// test-roundtrip.mjs — proves ADR-016 with the shipped adapter:
//   1. fountain → skel: imports, validates against the schema + validator lib.
//   2. skel → fountain: byte-identical to the canonical source.
//   3. Second cycle (import the export, export again): stable — IDs and bytes.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fountainToSkel, skelToFountain } from "./skel-fountain.mjs";
import { validateDocument } from "../cli/lib/validate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "test", "the-last-signal.fountain");
const source = readFileSync(sourcePath, "utf-8").replace(/\r\n/g, "\n");

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

// 1. Import + validate
const doc = fountainToSkel(source, { file: "the-last-signal.fountain" });
check("import: 3 scenes", doc.scenes.length === 3, `got ${doc.scenes.length}`);
check("import: characters extracted", (doc.characters ?? []).some((c) => c.name === "HARLAN") && doc.characters.some((c) => c.name === "ELI"));
check("import: (V.O.) → dialogue.mode vo", doc.shots.some((s) => (Array.isArray(s.dialogue) ? s.dialogue : []).some((d) => d.mode === "vo")));
check("import: (O.S.) → dialogue.mode os", doc.shots.some((s) => (Array.isArray(s.dialogue) ? s.dialogue : []).some((d) => d.mode === "os")));
check("import: CONTINUOUS → tod CONT", doc.scenes[1].loc.tod === "CONT", doc.scenes[1].loc.tod);
check("import: MOMENTS LATER → tod LATER", doc.scenes[2].loc.tod === "LATER", doc.scenes[2].loc.tod);
check("import: CUT TO: → transition_out cut", doc.shots.some((s) => s.transition_out === "cut"));
const longShot = doc.shots.find((s) => s.extensions?.["x-fountain"]?.full_action);
check("import: >200-char action parks full_action (§3.5)", !!longShot && longShot.action.length <= 200);
check("import: metadata.source recorded", doc.metadata.source?.format === "fountain");

const result = validateDocument(doc);
check("import: validates (draft lifecycle)", result.valid, JSON.stringify(result.errors.slice(0, 3)));

// 2. Byte-identical round trip
const exported = skelToFountain(doc);
check("round-trip: byte-identical", exported === source, (() => {
  if (exported === source) return "";
  const a = source.split("\n"), b = exported.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return `first diff at line ${i + 1}: expected ${JSON.stringify(a[i])}, got ${JSON.stringify(b[i])}`;
  }
  return "length mismatch";
})());

// 3. Second cycle: stable IDs + stable bytes
const doc2 = fountainToSkel(exported, { file: "the-last-signal.fountain" });
check("second cycle: stable scene IDs", JSON.stringify(doc2.scenes.map((s) => s.id)) === JSON.stringify(doc.scenes.map((s) => s.id)));
check("second cycle: stable shot IDs", JSON.stringify(doc2.shots.map((s) => s.id)) === JSON.stringify(doc.shots.map((s) => s.id)));
check("second cycle: byte-identical again", skelToFountain(doc2) === source);

// 4. Edited-field export: change one action, exporter re-renders it (no stale raw)
const edited = JSON.parse(JSON.stringify(doc));
const target = edited.shots.find((s) => s.action.startsWith("The hatch stands open."));
target.action = "The hatch is shut. The rhythm knocks against it from below.";
const editedOut = skelToFountain(edited);
check("edited export: rewritten action appears", editedOut.includes("The hatch is shut."));
check("edited export: stale raw gone", !editedOut.includes("patient as a metronome"));

console.log("");
if (failures) {
  console.error(`${failures} round-trip check(s) FAILED.`);
  process.exit(1);
}
console.log("Fountain round-trip: all checks pass.");
