// test-continuity-guard.mjs — drives the continuity-guard tool through its real
// cli-route contract (envelope on stdin → result on stdout) and asserts the
// expected warning codes on a document seeded with continuity mistakes.
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const doc = {
  skel_version: "2.9",
  metadata: { story_id: "cg-test", title: "Continuity Test", lifecycle: "production" },
  acts: [{ id: "act_1", title: "A", scene_refs: ["sc_1", "sc_2"] }],
  scenes: [
    { id: "sc_1", act_id: "act_1", header: "INT. ROOM - DAY", loc: { type: "INT", name: "ROOM", tod: "DAY" }, shot_refs: ["sh_1", "sh_2"] },
    { id: "sc_2", act_id: "act_1", header: "EXT. YARD - DAY", loc: { type: "EXT", name: "YARD", tod: "DAY" }, shot_refs: ["sh_3"] },
  ],
  shots: [
    { id: "sh_1", scene_id: "sc_1", action: "Aya enters, empty-handed.", v_setup: { size: "ms", angle: "eye" }, character_refs: ["char_aya"] },
    { id: "sh_2", scene_id: "sc_1", action: "The dagger lies on the table.", v_setup: { size: "ins", angle: "high" }, prop_refs: ["prop_dagger"] },
    { id: "sh_3", scene_id: "sc_2", action: "Aya walks the yard.", v_setup: { size: "ws", angle: "eye" }, character_refs: ["char_aya"] },
  ],
  characters: [
    {
      id: "char_aya",
      name: "Aya",
      first_appearance: "sh_3",
      props_carried: ["prop_dagger"],
      wardrobe_variants: [{ id: "w_gala", label: "Gala dress", scene_refs: ["sc_3_missing_from_cast", "sc_1"] }],
    },
  ],
  props: [
    { id: "prop_dagger", name: "Ceremonial dagger", significance: "plot_critical", first_appearance: "sh_1" },
  ],
};
doc.characters[0].wardrobe_variants[0].scene_refs = ["sc_2"]; // Aya IS in sc_2 → fine
doc.characters[0].wardrobe_variants.push({ id: "w_cloak", label: "Cloak", scene_refs: ["sc_1"] }); // Aya in sc_1 too → fine
// Make one genuinely absent case: a scene where she has no shots.
doc.scenes.push({ id: "sc_3", act_id: "act_1", header: "INT. HALL - NIGHT", loc: { type: "INT", name: "HALL", tod: "NIGHT" }, shot_refs: ["sh_4"] });
doc.acts[0].scene_refs.push("sc_3");
doc.shots.push({ id: "sh_4", scene_id: "sc_3", action: "The hall stands empty.", v_setup: { size: "ws", angle: "eye" } });
doc.characters[0].wardrobe_variants.push({ id: "w_gown", label: "Gown", scene_refs: ["sc_3"] });

const envelope = {
  payload_version: "1.1",
  hook: "document.validate",
  muscle_id: "continuity-guard",
  lifecycle: "production",
  context: { workspace_root: ".", project_slug: "cg-test", config: {} },
  document: doc,
};

const run = spawnSync(process.execPath, [join(here, "continuity-guard.mjs")], {
  input: JSON.stringify(envelope),
  encoding: "utf-8",
});
if (run.status !== 0) {
  console.error("continuity-guard exited nonzero:", run.stderr);
  process.exit(1);
}
const result = JSON.parse(run.stdout);
const codes = result.warnings.map((w) => w.code);

let failures = 0;
const expectCode = (code) => {
  const ok = codes.includes(code);
  console.log(`${ok ? "PASS" : "FAIL"}  expects ${code}`);
  if (!ok) failures++;
};

expectCode("continuity-guard.prop-orphan");          // dagger: plot-critical, one shot only
expectCode("continuity-guard.first-appearance");     // aya declares sh_3, actually sh_1
expectCode("continuity-guard.carried-prop-unseen");  // aya never in a shot with the dagger
expectCode("continuity-guard.wardrobe-absent");      // gown assigned to sc_3, aya not in sc_3

const falsePositives = codes.filter((c) => c.endsWith("wardrobe-absent")).length;
const okFP = falsePositives === 1;
console.log(`${okFP ? "PASS" : "FAIL"}  no false positives on wardrobe scenes she is in (got ${falsePositives})`);
if (!okFP) failures++;

const okShape = result.ok === true && Array.isArray(result.errors) && result.errors.length === 0;
console.log(`${okShape ? "PASS" : "FAIL"}  result shape: ok:true, errors empty, warnings only`);
if (!okShape) failures++;

console.log("");
if (failures) {
  console.error(`${failures} continuity-guard check(s) FAILED.`);
  process.exit(1);
}
console.log("continuity-guard: all checks pass.");
