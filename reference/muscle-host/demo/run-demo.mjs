// run-demo.mjs — end-to-end MUSCLE pipeline demo against the spec's example document.
// Usage: node run-demo.mjs   (from reference/muscle-host/demo/)
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverMuscles, runHook, sanityCheck } from "../muscle-host.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const document = JSON.parse(readFileSync(join(here, "../../../spec/example.skel.json"), "utf-8"));
const muscles = discoverMuscles([join(here, "muscles")]);

console.log(`Discovered ${muscles.length} MUSCLEs: ${muscles.map((m) => m.manifest.muscle_id).join(", ")}\n`);

// 1. document.validate — shot-lint (veto) adds lint results to validation.
console.log("── hook: document.validate ──");
const v = runHook("document.validate", { muscles, document, lifecycle: "production" });
console.log(`errors: ${v.errors.length}, warnings: ${v.warnings.length}`);
for (const w of [...v.errors, ...v.warnings]) console.log(`  [${w.severity}] ${w.code} ${w.path} — ${w.message}`);

// 2. entity.changed — note-stamper's patch applies; rogue-writer's set is rejected.
console.log("\n── hook: entity.changed ──");
const e = runHook("entity.changed", {
  muscles, document, lifecycle: "production",
  subject: { entity: "shot", id: document.shots?.[0]?.id ?? "sh_1", changed_paths: ["/shots/0/action"] },
});
for (const r of e.ran) console.log(`  ${r.muscle_id}: ${r.ok ? `OK (${r.applied} patches applied)` : `REJECTED — ${r.note}`}`);

console.log("\n── document state after pipeline ──");
console.log(`  metadata.title: ${JSON.stringify(document.metadata?.title)} (unchanged — rogue write blocked)`);
console.log(`  shots[0].extensions["x-demo"]: ${JSON.stringify(document.shots?.[0]?.extensions?.["x-demo"])}`);
console.log(`  metadata.plugins: ${JSON.stringify(document.metadata?.plugins)}`);
console.log(`  sanity check: ${sanityCheck(document).length === 0 ? "PASS" : "FAIL"}`);
