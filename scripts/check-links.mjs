// check-links.mjs — verifies that relative markdown links in the repo's docs
// point at files that exist. External URLs are not fetched (CI stays offline).
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".github", "renders"]);

function mdFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (d.isDirectory()) return SKIP_DIRS.has(d.name) ? [] : mdFiles(join(dir, d.name));
    return d.name.endsWith(".md") ? [join(dir, d.name)] : [];
  });
}

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
let broken = 0;
for (const file of mdFiles(root)) {
  const text = readFileSync(file, "utf-8");
  for (const m of text.matchAll(LINK_RE)) {
    let target = m[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    target = decodeURIComponent(target.split("#")[0]);
    if (!target) continue;
    const abs = resolve(dirname(file), target);
    if (!existsSync(abs)) {
      broken++;
      console.error(`BROKEN  ${relative(root, file)} -> ${m[1]}`);
    } else if (statSync(abs).isDirectory() && !existsSync(abs)) {
      // directories are fine as link targets on GitHub
    }
  }
}

if (broken) {
  console.error(`\n${broken} broken relative link(s).`);
  process.exit(1);
}
console.log("All relative markdown links resolve.");
