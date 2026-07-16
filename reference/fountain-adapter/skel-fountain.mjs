#!/usr/bin/env node
// skel-fountain — reference Fountain ⇄ SKEL adapter (ADR-016 proof).
//
//   skel-fountain import <in.fountain> <out.skel.json>
//   skel-fountain export <in.skel.json|.skel> <out.fountain>
//   skel-fountain run-hook --payload -          (MUSCLE cli route: envelope on stdin)
//
// Preservation strategy: every parsed source element parks its exact raw text
// under the x-fountain extension namespace (per-scene element lists, document
// preamble, title page). Export emits the parked raw whenever the SKEL field
// it maps to is unchanged, and re-renders from SKEL data when it was edited.
// For canonically spaced Fountain (single blank line between elements, single
// trailing newline), an unmodified import → export round-trip is byte-identical.
//
// Stable IDs: Fountain carries no IDs, so the importer mints deterministic
// sequential IDs (sc_1…, sh_1…) — repeat imports of the same file agree.
import { readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";

const XF = "x-fountain";

// ── Time-of-day mapping (skel-spec §7.1.1) ────────────────────────────────────
const TOD_MAP = new Map([
  ["DAY", "DAY"], ["NIGHT", "NIGHT"], ["DAWN", "DAWN"], ["DUSK", "DUSK"],
  ["MORNING", "MORNING"], ["AFTERNOON", "AFTERNOON"], ["EVENING", "EVENING"],
  ["CONTINUOUS", "CONT"], ["CONT", "CONT"], ["CONT.", "CONT"],
  ["SAME", "SAME"], ["SAME TIME", "SAME"],
  ["LATER", "LATER"], ["MOMENTS LATER", "LATER"], ["MOMENTS", "LATER"],
  ["SUNSET", "DUSK"], ["MAGIC HOUR", "DUSK"], ["TWILIGHT", "DUSK"],
  ["SUNRISE", "DAWN"], ["FIRST LIGHT", "DAWN"],
]);

const TRANSITION_MAP = new Map([
  ["CUT TO:", "cut"], ["SMASH CUT TO:", "smash_cut"], ["MATCH CUT TO:", "match_cut"],
  ["DISSOLVE TO:", "dissolve"], ["FADE OUT.", "fade_out"], ["FADE TO BLACK.", "fade_out"],
  ["FADE IN:", "fade_in"], ["WIPE TO:", "wipe"], ["IRIS OUT.", "iris"], ["WHIP TO:", "whip"],
]);

const SCENE_RE = /^(?:(INT\.?\/EXT|EXT\.?\/INT|I\/E|INT|EXT|EST)[. ]\s*)(.*)$/i;
const TRANSITION_RE = /^(?:>.*|[A-Z][A-Z .]*TO:|FADE OUT\.|FADE TO BLACK\.|FADE IN:|IRIS OUT\.)$/;
const CUE_RE = /^(@?)([A-Z0-9 .'\-()]+?)(\s*\((?:V\.O\.|O\.S\.|O\.C\.|CONT'D|SUBTITLE|[^)]*)\))*\s*(\^?)$/;

const slug = (name) =>
  "char_" + name.toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// ── Element splitter ──────────────────────────────────────────────────────────
// Blocks are separated by blank lines; /* boneyard */ spans merge into one element.
function splitBlocks(text) {
  const rawBlocks = text.replace(/\r\n/g, "\n").split(/\n[ \t]*\n/);
  const blocks = [];
  let boneyard = null;
  for (const b of rawBlocks) {
    if (boneyard !== null) {
      boneyard += "\n\n" + b;
      if (b.includes("*/")) {
        blocks.push({ raw: boneyard, boneyard: true });
        boneyard = null;
      }
      continue;
    }
    if (b.trimStart().startsWith("/*") && !b.includes("*/")) {
      boneyard = b;
      continue;
    }
    blocks.push({ raw: b, boneyard: b.trimStart().startsWith("/*") });
  }
  if (boneyard !== null) blocks.push({ raw: boneyard, boneyard: true });
  return blocks;
}

function classify(block) {
  if (block.boneyard) return "boneyard";
  const lines = block.raw.split("\n");
  const first = lines[0].trim();
  if (first.startsWith("#")) return "section";
  if (first.startsWith("=") && !first.startsWith("===")) return "synopsis";
  if (first.startsWith("!")) return "action"; // forced action
  if (first.startsWith(".") && !first.startsWith("..")) return "scene";
  if (SCENE_RE.test(first) && lines.length === 1) return "scene";
  if (TRANSITION_RE.test(first) && lines.length === 1 && first === first.toUpperCase()) return "transition";
  if (
    lines.length >= 2 &&
    CUE_RE.test(first) &&
    first === first.toUpperCase() &&
    !SCENE_RE.test(first)
  ) return "dialogue";
  return "action";
}

function parseHeading(raw) {
  const line = raw.trim().replace(/^\./, "");
  const m = line.match(SCENE_RE);
  let type = "INT", name = line, todRaw = "";
  if (m) {
    const t = m[1].toUpperCase().replace(/\./g, "");
    type = t === "I/E" || t.includes("/") ? "INT/EXT" : t === "EST" ? "EXT" : t;
    const rest = m[2];
    const dash = rest.lastIndexOf(" - ");
    if (dash >= 0) {
      name = rest.slice(0, dash).trim();
      todRaw = rest.slice(dash + 3).trim();
    } else {
      name = rest.trim();
    }
  }
  const tod = TOD_MAP.get(todRaw.toUpperCase()) ?? "DAY";
  return { type, name: name || "UNTITLED", tod, todRaw };
}

function deriveAction(sourceText) {
  const flat = sourceText.split("\n").join(" ").replace(/\s+/g, " ").trim();
  if (flat.length <= 200) return flat;
  const cut = flat.slice(0, 200);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 120 ? lastSpace : 200).trim();
}

function parseCueLine(first) {
  const modes = [];
  if (/\(V\.O\.\)/.test(first)) modes.push("vo");
  if (/\(O\.S\.\)|\(O\.C\.\)/.test(first)) modes.push("os");
  const name = first.replace(/^@/, "").replace(/\(.*?\)/g, "").replace(/\^$/, "").trim();
  return { name, mode: modes[0] ?? "spoken" };
}

// ── Import ────────────────────────────────────────────────────────────────────
export function fountainToSkel(source, { file = "input.fountain" } = {}) {
  const normalized = source.replace(/\r\n/g, "\n");
  const trailing = normalized.match(/\n*$/)[0];
  const body = normalized.replace(/\n*$/, "");
  let blocks = splitBlocks(body);

  // Title page: first block of `Key: value` lines.
  let titlePageRaw = null;
  let title = null, author = null;
  if (blocks.length && /^[A-Za-z][A-Za-z ]*:/.test(blocks[0].raw.split("\n")[0]) && classify(blocks[0]) === "action") {
    const looksTitle = blocks[0].raw.split("\n").every((l) => /^[A-Za-z][A-Za-z ]*:/.test(l) || /^\s+\S/.test(l));
    if (looksTitle) {
      titlePageRaw = blocks[0].raw;
      for (const l of blocks[0].raw.split("\n")) {
        const m = l.match(/^(Title|Author|Authors|Credit|Source|Draft date|Contact):\s*(.*)$/i);
        if (m?.[1].toLowerCase() === "title") title = m[2].replace(/^_+\**|\**_+$/g, "").trim();
        if (m && /authors?/i.test(m[1])) author = m[2].trim();
      }
      blocks = blocks.slice(1);
    }
  }

  const doc = {
    skel_version: "2.9",
    metadata: {
      story_id: `fountain-${file.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
      title: title ?? file,
      lifecycle: "draft",
      source: { format: "fountain", file, tool: "skel-fountain 2.9.0" },
      extensions: { [XF]: {} },
    },
    acts: [{ id: "act_1", title: "Screenplay", scene_refs: [] }],
    scenes: [],
    shots: [],
    characters: [],
  };
  if (author) doc.metadata.author = author;
  if (titlePageRaw !== null) doc.metadata.extensions[XF].title_page_raw = titlePageRaw;
  doc.metadata.extensions[XF].trailing = trailing;

  const charByName = new Map();
  let scene = null;
  let sc = 0, sh = 0;
  const preamble = [];

  const elementsOf = (s) => s.extensions[XF].elements;

  for (const block of blocks) {
    const kind = classify(block);
    if (kind === "scene") {
      const heading = block.raw.trim();
      const loc = parseHeading(heading);
      sc++;
      scene = {
        id: `sc_${sc}`,
        act_id: "act_1",
        header: heading.replace(/^\./, ""),
        loc: { type: loc.type, name: loc.name, tod: loc.tod },
        shot_refs: [],
        extensions: { [XF]: { heading_raw: block.raw, elements: [] } },
      };
      if (loc.todRaw && !TOD_MAP.has(loc.todRaw.toUpperCase())) scene.extensions[XF].tod_raw = loc.todRaw;
      doc.scenes.push(scene);
      doc.acts[0].scene_refs.push(scene.id);
      continue;
    }

    if (!scene) {
      preamble.push(block.raw);
      continue;
    }

    if (kind === "action") {
      sh++;
      const sourceText = block.raw;
      const action = deriveAction(sourceText.replace(/^!/, ""));
      const shot = {
        id: `sh_${sh}`,
        scene_id: scene.id,
        action,
        v_setup: { size: "ms", angle: "eye" },
        extensions: { [XF]: { source_text: sourceText } },
      };
      if (action !== sourceText.replace(/^!/, "").trim()) shot.extensions[XF].full_action = sourceText;
      doc.shots.push(shot);
      scene.shot_refs.push(shot.id);
      elementsOf(scene).push({ type: "action", shot_ref: shot.id });
      continue;
    }

    if (kind === "dialogue") {
      const lines = block.raw.split("\n");
      const { name, mode } = parseCueLine(lines[0].trim());
      let charId = charByName.get(name);
      if (!charId) {
        charId = slug(name);
        charByName.set(name, charId);
        doc.characters.push({ id: charId, name });
      }
      const textLines = lines.slice(1).filter((l) => !/^\s*\(.*\)\s*$/.test(l.trim()));
      const text = textLines.join(" ").replace(/\s+/g, " ").trim();

      let shot = doc.shots.find((s) => s.id === scene.shot_refs[scene.shot_refs.length - 1]);
      if (!shot) {
        sh++;
        shot = {
          id: `sh_${sh}`,
          scene_id: scene.id,
          action: `${name} speaks.`,
          v_setup: { size: "mcu", angle: "eye" },
          extensions: { [XF]: { synthesized_for_dialogue: true } },
        };
        doc.shots.push(shot);
        scene.shot_refs.push(shot.id);
      }
      const line = { text, character_ref: charId };
      if (mode !== "spoken") line.mode = mode;
      if (shot.dialogue === undefined) shot.dialogue = [line];
      else if (Array.isArray(shot.dialogue)) shot.dialogue.push(line);
      else shot.dialogue = [typeof shot.dialogue === "string" ? { text: shot.dialogue } : shot.dialogue, line];
      if (!(shot.character_refs ?? []).includes(charId)) {
        shot.character_refs = [...(shot.character_refs ?? []), charId];
      }
      const dialogueIndex = Array.isArray(shot.dialogue) ? shot.dialogue.length - 1 : 0;
      elementsOf(scene).push({ type: "dialogue", shot_ref: shot.id, dialogue_index: dialogueIndex, raw: block.raw });
      continue;
    }

    if (kind === "transition") {
      const raw = block.raw.trim();
      const mapped = TRANSITION_MAP.get(raw.replace(/^>\s*/, ""));
      const lastShot = doc.shots.find((s) => s.id === scene.shot_refs[scene.shot_refs.length - 1]);
      if (mapped && lastShot) lastShot.transition_out = mapped;
      elementsOf(scene).push({ type: "transition", raw: block.raw, shot_ref: lastShot?.id, mapped });
      continue;
    }

    // section / synopsis / boneyard — pure parked raw
    elementsOf(scene).push({ type: kind, raw: block.raw });
  }

  if (preamble.length) doc.metadata.extensions[XF].preamble = preamble;
  if (!doc.characters.length) delete doc.characters;
  return doc;
}

// ── Export ────────────────────────────────────────────────────────────────────
export function skelToFountain(doc) {
  const xfMeta = doc.metadata?.extensions?.[XF] ?? {};
  const out = [];

  if (xfMeta.title_page_raw != null) out.push(xfMeta.title_page_raw);
  else if (doc.metadata?.title) {
    out.push([`Title: ${doc.metadata.title}`, doc.metadata.author ? `Author: ${doc.metadata.author}` : null].filter(Boolean).join("\n"));
  }
  for (const p of xfMeta.preamble ?? []) out.push(p);

  const shotById = new Map((doc.shots ?? []).map((s) => [s.id, s]));
  const charById = new Map((doc.characters ?? []).map((c) => [c.id, c]));
  const sceneById = new Map((doc.scenes ?? []).map((s) => [s.id, s]));

  const renderDialogue = (shot, index) => {
    const lines = Array.isArray(shot?.dialogue) ? shot.dialogue : shot?.dialogue != null ? [shot.dialogue] : [];
    const d = lines[index];
    if (d == null) return null;
    const line = typeof d === "string" ? { text: d } : d;
    const name = charById.get(line.character_ref)?.name ?? (line.character_ref ?? "UNKNOWN").replace(/^char_/, "").toUpperCase();
    const ext = line.mode === "vo" ? " (V.O.)" : line.mode === "os" ? " (O.S.)" : "";
    return `${name.toUpperCase()}${ext}\n${line.text}`;
  };

  const orderedScenes = (doc.acts ?? []).flatMap((a) => (a.scene_refs ?? []).map((r) => sceneById.get(r))).filter(Boolean);
  for (const scene of orderedScenes.length ? orderedScenes : doc.scenes ?? []) {
    const xf = scene.extensions?.[XF] ?? {};
    out.push(xf.heading_raw != null && xf.heading_raw.replace(/^\./, "") === scene.header ? xf.heading_raw : scene.header);

    const elements = xf.elements;
    if (elements) {
      for (const el of elements) {
        const shot = el.shot_ref ? shotById.get(el.shot_ref) : null;
        if (el.type === "action") {
          const source = shot?.extensions?.[XF]?.source_text;
          if (source != null && shot && deriveAction(source.replace(/^!/, "")) === shot.action) out.push(source);
          else if (shot) out.push(shot.extensions?.[XF]?.full_action ?? shot.action);
        } else if (el.type === "dialogue") {
          const rendered = renderDialogue(shot, el.dialogue_index ?? 0);
          if (el.raw != null && rendered != null) {
            const rawText = el.raw.split("\n").slice(1).filter((l) => !/^\s*\(.*\)\s*$/.test(l.trim())).join(" ").replace(/\s+/g, " ").trim();
            const currentText = rendered.split("\n").slice(1).join(" ");
            out.push(rawText === currentText ? el.raw : rendered);
          } else if (rendered != null) out.push(rendered);
          else if (el.raw != null) out.push(el.raw);
        } else if (el.raw != null) {
          out.push(el.raw);
        }
      }
    } else {
      // No parked structure (document not born from Fountain): render from SKEL.
      for (const ref of scene.shot_refs ?? []) {
        const shot = shotById.get(ref);
        if (!shot) continue;
        out.push(shot.extensions?.[XF]?.full_action ?? shot.action);
        const lines = Array.isArray(shot.dialogue) ? shot.dialogue : shot.dialogue != null ? [shot.dialogue] : [];
        lines.forEach((_, i) => {
          const r = renderDialogue(shot, i);
          if (r) out.push(r);
        });
      }
    }
  }

  return out.join("\n\n") + (xfMeta.trailing ?? "\n");
}

// ── MUSCLE run-hook mode (cli route from spec/muscles/fountain-adapter.muscle.json)
async function runHook() {
  const envelope = JSON.parse(await new Response(process.stdin).text());
  const result = { payload_version: "1.1", ok: true, patches: [], warnings: [], logs: [] };
  const subject = envelope.subject ?? {};
  if (envelope.hook === "import.after" && subject.format === "fountain" && subject.source_text) {
    // Park document-level Fountain data the host's structural importer drops.
    const parsed = fountainToSkel(subject.source_text, { file: subject.source_path ?? "input.fountain" });
    const xf = parsed.metadata.extensions[XF];
    result.patches.push({ op: "add", path: "/metadata/extensions", value: { [XF]: xf } });
    if (!envelope.document?.metadata?.source) {
      result.patches.push({ op: "add", path: "/metadata/source", value: parsed.metadata.source });
    }
    result.logs.push("parked Fountain title page/preamble under x-fountain");
  } else if (envelope.hook === "export.before" && subject.format === "fountain") {
    result.logs.push("x-fountain data present; exporter should restore parked raw text");
  } else {
    result.logs.push(`no-op for hook ${envelope.hook}`);
  }
  process.stdout.write(JSON.stringify(result));
}

// ── CLI ───────────────────────────────────────────────────────────────────────
const [cmd, a, b] = process.argv.slice(2);
if (cmd === "import") {
  if (!a || !b) { console.error("usage: skel-fountain import <in.fountain> <out.skel.json>"); process.exit(2); }
  const doc = fountainToSkel(readFileSync(a, "utf-8"), { file: a.split(/[\\/]/).pop() });
  writeFileSync(b, JSON.stringify(doc, null, 2) + "\n", "utf-8");
  console.log(`imported ${a} → ${b} (${doc.scenes.length} scenes, ${doc.shots.length} shots)`);
} else if (cmd === "export") {
  if (!a || !b) { console.error("usage: skel-fountain export <in.skel(.json)> <out.fountain>"); process.exit(2); }
  const doc = a.endsWith(".json") ? JSON.parse(readFileSync(a, "utf-8")) : yaml.load(readFileSync(a, "utf-8"));
  writeFileSync(b, skelToFountain(doc), "utf-8");
  console.log(`exported ${a} → ${b}`);
} else if (cmd === "run-hook") {
  await runHook();
} else if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("skel-fountain.mjs")) {
  if (cmd) { console.error("usage: skel-fountain import|export|run-hook"); process.exit(2); }
}
