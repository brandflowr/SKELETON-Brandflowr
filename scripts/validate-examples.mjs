// validate-examples.mjs — machine-validates every shipped JSON/YAML artifact against its schema.
// This is the script CI runs (see .github/workflows/ci.yml) and the check that caught
// PRODUCTION-ROADMAP P0-1. Exit 0 = everything passes; exit 1 = at least one failure.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const spec = (p) => join(root, "spec", p);
const rel = (p) => relative(root, p).replaceAll("\\", "/");

let failures = 0;
const pass = (label) => console.log(`  OK    ${label}`);
const fail = (label, errors) => {
  failures++;
  console.error(`  FAIL  ${label}`);
  for (const e of [].concat(errors ?? []).slice(0, 12)) {
    console.error(`        ${e.instancePath || "/"} ${e.message}${e.params ? " " + JSON.stringify(e.params) : ""}`);
  }
};

const readJson = (p) => JSON.parse(readFileSync(p, "utf-8"));

// ── 1. Load + meta-validate all schemas ──────────────────────────────────────
// strictRequired stays off: the conditional `then: { required: ["template"] }` pattern in
// PromptAssembly legitimately requires a property defined on the parent schema.
const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);

const schemaFiles = readdirSync(spec("")).filter((f) => f.endsWith(".schema.json"));
console.log("Schemas (meta-validation against Draft-7):");
const schemas = {};
for (const f of schemaFiles) {
  const s = readJson(spec(f));
  schemas[f] = s;
  const ok = ajv.validateSchema(s);
  ok ? pass(`spec/${f}`) : fail(`spec/${f}`, ajv.errors);
  ajv.addSchema(s);
}

// Compile the entry points that hosts actually compile (strict mode surfaces schema bugs).
console.log("Schema compilation (AJV strict):");
const compileTargets = [
  ["skel.schema.json", ""],
  ["bone.schema.json", ""],
  ["muscle.schema.json", ""],
  ["x-genlock.schema.json", ""],
  ["audio-map.schema.json", ""],
  ["video-map.schema.json", ""],
  ["canvas-layout.schema.json", ""],
  ["hook-payload.schema.json", "#/definitions/HookEnvelope"],
  ["hook-payload.schema.json", "#/definitions/HookResult"],
];
if (schemas["studio.schema.json"]) compileTargets.push(["studio.schema.json", ""]);
const compiled = {};
for (const [file, frag] of compileTargets) {
  const id = schemas[file].$id + frag;
  try {
    compiled[file + frag] = ajv.getSchema(id) ?? ajv.compile(frag ? { $ref: id } : schemas[file]);
    pass(`${file}${frag}`);
  } catch (err) {
    fail(`${file}${frag}`, [{ message: err.message }]);
  }
}
const validatorFor = (file, frag = "") => compiled[file + frag] ?? ajv.getSchema(schemas[file].$id + frag);

// ── 2. Documents against skel.schema.json ────────────────────────────────────
console.log("SKEL documents:");
const skelValidator = validatorFor("skel.schema.json");
if (!skelValidator) {
  console.error("skel.schema.json failed to compile — cannot validate documents.");
  process.exit(1);
}
const skelDocs = [spec("example.skel.json")];
const examplesDir = spec("examples");
if (existsSync(examplesDir)) {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith(".skel.json") ? [join(dir, d.name)] : []
    );
  skelDocs.push(...walk(examplesDir));
}
if (existsSync(spec("example.skel"))) skelDocs.push(spec("example.skel"));
for (const p of skelDocs) {
  const doc = p.endsWith(".skel") ? yaml.load(readFileSync(p, "utf-8")) : readJson(p);
  skelValidator(doc) ? pass(rel(p)) : fail(rel(p), skelValidator.errors);
}

// ── 3. Key file against the KeyFile definition ───────────────────────────────
console.log("Key file:");
const keyfileValidator = ajv.compile({ $ref: schemas["skel.schema.json"].$id + "#/definitions/KeyFile" });
const keyfile = readJson(spec("skel-keyfile.json"));
keyfileValidator(keyfile) ? pass("spec/skel-keyfile.json") : fail("spec/skel-keyfile.json", keyfileValidator.errors);

// ── 4. BONE definitions ───────────────────────────────────────────────────────
console.log("BONE definitions:");
const boneValidator = validatorFor("bone.schema.json");
for (const f of readdirSync(spec("bones")).filter((f) => f.endsWith(".bone.json"))) {
  const bone = readJson(spec(join("bones", f)));
  boneValidator(bone) ? pass(`spec/bones/${f}`) : fail(`spec/bones/${f}`, boneValidator.errors);
}

// ── 5. MUSCLE manifests ───────────────────────────────────────────────────────
console.log("MUSCLE manifests:");
const muscleValidator = validatorFor("muscle.schema.json");
const muscleDirs = [spec("muscles"), join(root, "reference", "muscle-host", "demo", "muscles")];
for (const dir of muscleDirs.filter(existsSync)) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".muscle.json"))) {
    const m = readJson(join(dir, f));
    muscleValidator(m) ? pass(rel(join(dir, f))) : fail(rel(join(dir, f)), muscleValidator.errors);
  }
}

// ── 6. Studio registry examples (when present) ───────────────────────────────
if (schemas["studio.schema.json"]) {
  console.log("Studio registries:");
  const studioValidator = validatorFor("studio.schema.json");
  const studioFiles = [];
  if (existsSync(examplesDir)) {
    const walk = (dir) =>
      readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : d.name === "studio.json" ? [join(dir, d.name)] : []
      );
    studioFiles.push(...walk(examplesDir));
  }
  for (const p of studioFiles) {
    const doc = readJson(p);
    studioValidator(doc) ? pass(rel(p)) : fail(rel(p), studioValidator.errors);
  }
}

// ── Result ────────────────────────────────────────────────────────────────────
console.log("");
if (failures > 0) {
  console.error(`${failures} artifact(s) FAILED validation.`);
  process.exit(1);
}
console.log("All shipped artifacts validate against their schemas.");
