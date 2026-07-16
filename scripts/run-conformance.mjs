// run-conformance.mjs — drives the reference validator across tests/conformance/.
// Each manifest entry declares a fixture and its expectation:
//   { file, lifecycle?, sidecars?, expect: { valid, codes: [...], forbid?: [...] } }
// PASS = validity matches, every expected code is reported, no forbidden code is.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDocument, validateDocument, loadSidecarsNear, ParseError } from "../reference/cli/lib/validate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const corpusDir = join(root, "tests", "conformance");
const manifest = JSON.parse(readFileSync(join(corpusDir, "manifest.json"), "utf-8"));

let failures = 0;
for (const entry of manifest) {
  const path = join(corpusDir, entry.file);
  let result;
  try {
    const doc = loadDocument(path);
    const opts = { lifecycle: entry.lifecycle };
    if (entry.sidecars) opts.sidecars = loadSidecarsNear(path);
    result = validateDocument(doc, opts);
  } catch (e) {
    if (e instanceof ParseError) {
      result = { valid: false, lifecycle: "draft", errors: [{ code: e.code, severity: "error", path: "", message: e.message }], warnings: [] };
    } else {
      throw e;
    }
  }

  const reported = new Set([...result.errors, ...result.warnings].map((e) => e.code));
  const problems = [];
  if (result.valid !== entry.expect.valid) {
    problems.push(`expected valid=${entry.expect.valid}, got ${result.valid} (errors: ${result.errors.map((e) => e.code).join(", ") || "none"})`);
  }
  for (const code of entry.expect.codes ?? []) {
    if (!reported.has(code)) problems.push(`expected code ${code} not reported (got: ${[...reported].join(", ") || "none"})`);
  }
  for (const code of entry.expect.forbid ?? []) {
    if (reported.has(code)) problems.push(`forbidden code ${code} was reported`);
  }

  if (problems.length) {
    failures++;
    console.error(`FAIL  ${entry.file}`);
    for (const p of problems) console.error(`      ${p}`);
  } else {
    console.log(`PASS  ${entry.file}`);
  }
}

console.log("");
if (failures) {
  console.error(`${failures}/${manifest.length} conformance fixtures FAILED.`);
  process.exit(1);
}
console.log(`All ${manifest.length} conformance fixtures pass.`);
