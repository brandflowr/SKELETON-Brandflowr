// shot-lint.mjs — demo veto MUSCLE. Envelope on stdin, result on stdout.
const envelope = JSON.parse(await new Response(process.stdin).text());
const doc = envelope.document ?? {};
const errors = [];
const warnings = [];

for (const [i, shot] of (doc.shots ?? []).entries()) {
  if (!shot.action || !shot.action.trim()) {
    errors.push({
      code: "shot-lint.empty-action", severity: "error",
      path: `/shots/${i}/action`,
      message: `Shot ${shot.id ?? i} has no action text.`,
    });
  } else if (shot.action.length > 200) {
    warnings.push({
      code: "shot-lint.action-length", severity: "warning",
      path: `/shots/${i}/action`,
      message: `Shot ${shot.id ?? i} action exceeds the 200-char front-loading budget (${shot.action.length}).`,
    });
  } else if (shot.action.length < 60) {
    warnings.push({
      code: "shot-lint.action-thin", severity: "warning",
      path: `/shots/${i}/action`,
      message: `Shot ${shot.id ?? i} action is thin (${shot.action.length} chars) — consider front-loading more visual detail.`,
    });
  }
}

process.stdout.write(JSON.stringify({
  payload_version: "1.0", ok: true, errors, warnings,
  logs: [`linted ${(doc.shots ?? []).length} shots`],
}));
