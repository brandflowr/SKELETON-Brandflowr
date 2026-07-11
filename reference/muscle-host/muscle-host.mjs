// muscle-host.mjs — reference MUSCLE host (MUSCLE Spec v1.0)
// Zero-dependency Node.js (>=18) reference implementation of the host side
// of the MUSCLE contract: discovery, manifest validation, hook invocation
// via the `cli` execution route, mode enforcement, capability-scoped
// RFC 6902 patch application with locked-entity protection, and atomic
// rollback. This is a teaching/conformance artifact, not a product:
// production hosts (Genlock, a `skel` CLI) implement the same rules.
//
// See: spec/muscle-spec.md, spec/hook-payload.schema.json

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";

export const PAYLOAD_VERSION = "1.0";

export const HOOKS = [
  "import.before", "import.after", "document.validate",
  "prompt.assemble.before", "prompt.assemble.after", "generate.route",
  "render.complete", "entity.changed", "export.before", "export.after",
];
const MODES = ["observe", "transform", "veto"];
const CAPABILITIES = [
  "read:document", "read:sidecars", "patch:metadata", "patch:acts",
  "patch:scenes", "patch:shots", "patch:shot.bones", "patch:scene.bones",
  "patch:v_setup", "patch:sidecars", "write:renders",
];
const CAP_XNS = /^patch:extensions\.x-[a-z0-9]+(-[a-z0-9]+)*$/;

// ── Manifest validation ──────────────────────────────────────────────────────

export function validateManifest(m) {
  const errs = [];
  const need = (k, ok) => { if (!ok) errs.push(`${k} missing or invalid`); };
  need("muscle_id", typeof m.muscle_id === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.muscle_id));
  need("muscle_version", typeof m.muscle_version === "string" && /^\d+\.\d+\.\d+$/.test(m.muscle_version));
  need("label", typeof m.label === "string" && m.label.length > 0);
  need("hooks", Array.isArray(m.hooks) && m.hooks.length >= 1);
  need("capabilities", Array.isArray(m.capabilities));
  need("execution_routes", Array.isArray(m.execution_routes) && m.execution_routes.length >= 1);
  for (const h of m.hooks ?? []) {
    if (!HOOKS.includes(h.on)) errs.push(`unknown hook: ${h.on}`);
    if (!MODES.includes(h.mode)) errs.push(`unknown mode: ${h.mode}`);
  }
  for (const c of m.capabilities ?? []) {
    if (!CAPABILITIES.includes(c) && !CAP_XNS.test(c)) errs.push(`unknown capability: ${c}`);
  }
  const KNOWN = ["$schema", "muscle_id", "muscle_version", "label", "description",
    "hooks", "capabilities", "execution_routes", "config_schema", "extensions"];
  for (const k of Object.keys(m)) {
    if (!KNOWN.includes(k) && !k.startsWith("x-")) errs.push(`unknown top-level field: ${k}`);
  }
  return errs;
}

// ── Discovery (spec §6.1) ────────────────────────────────────────────────────

export function discoverMuscles(dirs) {
  const found = new Map(); // muscle_id → { manifest, dir } — later dirs override
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".muscle.json")).sort()) {
      const path = join(dir, f);
      try {
        const manifest = JSON.parse(readFileSync(path, "utf-8"));
        const errs = validateManifest(manifest);
        if (errs.length) { console.error(`[muscle-host] skipping ${path}: ${errs.join("; ")}`); continue; }
        found.set(manifest.muscle_id, { manifest, dir: resolve(dir), path });
      } catch (e) {
        console.error(`[muscle-host] skipping ${path}: ${e.message}`);
      }
    }
  }
  return [...found.values()];
}

// ── JSON Pointer / RFC 6902 (minimal, complete) ──────────────────────────────

const unescape = (s) => s.replace(/~1/g, "/").replace(/~0/g, "~");
const parsePtr = (p) => (p === "" ? [] : p.slice(1).split("/").map(unescape));

function getAt(doc, tokens) {
  let cur = doc;
  for (const t of tokens) {
    if (cur == null) return undefined;
    cur = Array.isArray(cur) ? cur[t === "-" ? cur.length : +t] : cur[t];
  }
  return cur;
}

function applyOp(doc, op) {
  const tokens = parsePtr(op.path);
  if (op.op === "test") {
    if (JSON.stringify(getAt(doc, tokens)) !== JSON.stringify(op.value)) throw new Error(`test failed at ${op.path}`);
    return;
  }
  if (op.op === "move" || op.op === "copy") {
    const val = getAt(doc, parsePtr(op.from));
    if (val === undefined) throw new Error(`from not found: ${op.from}`);
    if (op.op === "move") applyOp(doc, { op: "remove", path: op.from });
    return applyOp(doc, { op: "add", path: op.path, value: structuredClone(val) });
  }
  const key = tokens[tokens.length - 1];
  const parent = getAt(doc, tokens.slice(0, -1));
  if (parent == null) throw new Error(`path not found: ${op.path}`);
  if (Array.isArray(parent)) {
    const i = key === "-" ? parent.length : +key;
    if (Number.isNaN(i) || i < 0 || i > parent.length) throw new Error(`bad index: ${op.path}`);
    if (op.op === "add") parent.splice(i, 0, op.value);
    else if (op.op === "remove") { if (i >= parent.length) throw new Error(`remove out of range: ${op.path}`); parent.splice(i, 1); }
    else if (op.op === "replace") { if (i >= parent.length) throw new Error(`replace out of range: ${op.path}`); parent[i] = op.value; }
  } else {
    if (op.op === "add" || op.op === "replace") {
      if (op.op === "replace" && !(key in parent)) throw new Error(`replace target missing: ${op.path}`);
      parent[key] = op.value;
    } else if (op.op === "remove") {
      if (!(key in parent)) throw new Error(`remove target missing: ${op.path}`);
      delete parent[key];
    }
  }
}

// ── Capability → path rules (spec §4.3 rule 1, §5) ──────────────────────────

export function patchAllowed(caps, path, doc) {
  const t = parsePtr(path);
  if (t[0] === "metadata") {
    if (t[1] === "plugins") return false; // host-owned, always
    return caps.includes("patch:metadata");
  }
  // extensions.x-<ns> at any depth: .../extensions/x-<ns>/...
  const extIdx = t.indexOf("extensions");
  if (extIdx !== -1 && t[extIdx + 1]?.startsWith("x-")) {
    if (caps.includes(`patch:extensions.${t[extIdx + 1]}`)) return true;
  }
  if (t[0] === "acts") return caps.includes("patch:acts");
  if (t[0] === "scenes") {
    if (t[2] === "bones") return caps.includes("patch:scene.bones");
    return caps.includes("patch:scenes");
  }
  if (t[0] === "shots") {
    if (t[2] === "bones") return caps.includes("patch:shot.bones");
    if (t[2] === "v_setup") return caps.includes("patch:v_setup");
    return caps.includes("patch:shots");
  }
  return false;
}

function lockedViolation(path, doc) {
  const t = parsePtr(path);
  if ((t[0] === "scenes" || t[0] === "shots") && t[1] !== undefined) {
    const entity = doc[t[0]]?.[+t[1]];
    if (entity?.creative_status === "locked") return `${t[0]}[${t[1]}] (${entity.id ?? "?"}) is locked`;
  }
  return null;
}

// ── Light document sanity check (stand-in for full AJV validation) ──────────

export function sanityCheck(doc) {
  const errs = [];
  if (typeof doc?.skel_version !== "string") errs.push("skel_version missing");
  for (const k of ["acts", "scenes", "shots"]) if (doc[k] && !Array.isArray(doc[k])) errs.push(`${k} not an array`);
  const ids = new Set();
  for (const k of ["acts", "scenes", "shots"]) for (const e of doc[k] ?? []) {
    if (!e.id) errs.push(`${k} entity missing id`);
    else if (ids.has(e.id)) errs.push(`duplicate id: ${e.id}`);
    else ids.add(e.id);
  }
  for (const a of doc.acts ?? []) for (const r of a.scene_refs ?? []) if (!ids.has(r)) errs.push(`dangling scene_ref: ${r}`);
  for (const s of doc.scenes ?? []) for (const r of s.shot_refs ?? []) if (!ids.has(r)) errs.push(`dangling shot_ref: ${r}`);
  return errs;
}

// ── Invocation (spec §4) ─────────────────────────────────────────────────────

function invokeRoute(entry, envelope) {
  // Reference host implements the `cli` route only. Others report unavailable.
  const route = entry.manifest.execution_routes.find((r) => r.type === "cli");
  if (!route) return { unavailable: true };
  const res = spawnSync(route.command, {
    shell: true,
    cwd: dirname(entry.path),
    input: JSON.stringify(envelope),
    encoding: "utf-8",
    timeout: envelope._timeout_ms ?? 30000,
  });
  if (res.error || res.status !== 0) throw new Error(`route failed: ${res.error?.message ?? `exit ${res.status}`} ${res.stderr ?? ""}`.trim());
  return { result: JSON.parse(res.stdout) };
}

/**
 * Run one hook point. Mutates and returns `document` only via validated,
 * capability-checked, atomic patch sets. Returns a report.
 */
export function runHook(hook, { muscles, document, subject, lifecycle = "draft", context = {} }) {
  const report = { hook, ran: [], errors: [], warnings: [], subject };
  const subs = muscles
    .flatMap((m) => (m.manifest.hooks ?? [])
      .filter((h) => h.on === hook && filterMatch(h.filter, subject))
      .map((h) => ({ entry: m, sub: h })))
    .sort((a, b) => (a.sub.priority ?? 100) - (b.sub.priority ?? 100));

  for (const { entry, sub } of subs) {
    const id = entry.manifest.muscle_id;
    const caps = entry.manifest.capabilities;
    const envelope = {
      payload_version: PAYLOAD_VERSION,
      hook, muscle_id: id, lifecycle,
      context: { workspace_root: context.workspace_root ?? process.cwd(), project_slug: context.project_slug ?? "demo", config: context.config?.[id] ?? {} },
      ...(caps.includes("read:document") ? { document } : {}),
      ...(subject !== undefined ? { subject } : {}),
      _timeout_ms: sub.timeout_ms,
    };
    const fail = (msg) => {
      report.ran.push({ muscle_id: id, ok: false, note: msg });
      console.error(`[muscle-host] ${id} on ${hook}: FAILED — ${msg}`);
      if (sub.mode === "veto" && lifecycle !== "draft") report.errors.push({ code: `${id}.host_failure`, severity: "error", path: "", message: msg });
    };

    let result;
    try {
      const r = invokeRoute(entry, envelope);
      if (r.unavailable) { report.ran.push({ muscle_id: id, ok: false, note: "no available execution route" }); continue; }
      result = r.result;
    } catch (e) { fail(e.message); continue; }

    if (result?.payload_version !== PAYLOAD_VERSION || typeof result.ok !== "boolean") { fail("malformed result"); continue; }
    if (!result.ok) { fail("plugin reported failure"); continue; }

    // Mode enforcement (spec §3.3): reject results that exceed the declared mode.
    if (sub.mode !== "transform" && (result.patches?.length || result.subject_replacement !== undefined)) { fail(`mode '${sub.mode}' may not return patches/subject_replacement`); continue; }
    if (sub.mode !== "veto" && result.errors?.length) { fail(`mode '${sub.mode}' may not return errors`); continue; }

    if (result.warnings?.length) report.warnings.push(...result.warnings);
    if (sub.mode === "veto" && result.errors?.length) report.errors.push(...result.errors);

    // subject_replacement: derived values only (spec §4.2). generate.route must pick a candidate.
    if (result.subject_replacement !== undefined) {
      if (hook === "generate.route") {
        const candidates = subject?.routes ?? [];
        const chosen = candidates.find((c) => JSON.stringify(c) === JSON.stringify(result.subject_replacement));
        if (!chosen) { fail("subject_replacement is not a candidate route — falling back to default"); continue; }
        report.subject = { ...subject, chosen_route: chosen };
      } else if (hook === "prompt.assemble.after") {
        report.subject = { ...report.subject, assembled_prompt: result.subject_replacement };
      } else {
        report.subject = result.subject_replacement;
      }
    }

    // Patch application (spec §4.3): capability check, locked check, atomic, re-validate.
    if (result.patches?.length) {
      const rejected = [];
      for (const p of result.patches) {
        if (!patchAllowed(caps, p.path, document)) rejected.push(`outside capabilities: ${p.op} ${p.path}`);
        const lock = lockedViolation(p.path, document);
        if (lock) rejected.push(`locked entity: ${p.op} ${p.path} (${lock})`);
      }
      if (rejected.length) { fail(`patch set rejected — ${rejected.join("; ")}`); continue; }
      const before = structuredClone(document);
      try {
        for (const p of result.patches) { vivifyExtensions(document, p.path); applyOp(document, p); }
        const sanity = sanityCheck(document);
        if (sanity.length) throw new Error(`document invalid after patches: ${sanity.join("; ")}`);
      } catch (e) {
        Object.keys(document).forEach((k) => delete document[k]);
        Object.assign(document, before);
        fail(`rolled back — ${e.message}`);
        continue;
      }
      // Record in metadata.plugins (spec §6.3) — host-owned.
      document.metadata ??= {};
      document.metadata.plugins ??= [];
      const rec = document.metadata.plugins.find((r) => r.id === id);
      const stamp = { id, version: entry.manifest.muscle_version, last_ran: new Date().toISOString() };
      rec ? Object.assign(rec, stamp) : document.metadata.plugins.push(stamp);
      report.ran.push({ muscle_id: id, ok: true, applied: result.patches.length });
      continue;
    }
    report.ran.push({ muscle_id: id, ok: true, applied: 0 });
  }
  return report;
}

// Host obligation (spec §4.3): a patch under a declared x-<ns> namespace must
// not fail just because the `extensions` container doesn't exist yet.
function vivifyExtensions(doc, path) {
  const t = parsePtr(path);
  const extIdx = t.indexOf("extensions");
  if (extIdx === -1 || !t[extIdx + 1]?.startsWith("x-")) return;
  const parent = getAt(doc, t.slice(0, extIdx));
  if (parent && typeof parent === "object" && parent.extensions === undefined) parent.extensions = {};
}

function filterMatch(filter, subject) {
  if (!filter) return true;
  if (filter.formats && subject?.format && !filter.formats.includes(subject.format)) return false;
  if (filter.bone_ids && subject?.bone_id && !filter.bone_ids.includes(subject.bone_id)) return false;
  if (filter.entities && subject?.entity && !filter.entities.includes(subject.entity)) return false;
  return true;
}
