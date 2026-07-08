// note-stamper.mjs — demo transform MUSCLE. Envelope on stdin, result on stdout.
const envelope = JSON.parse(await new Response(process.stdin).text());
const doc = envelope.document ?? {};
const patches = [];

if (doc.shots?.length) {
  patches.push({
    op: "add", path: "/shots/0/extensions/x-demo",
    value: { note: "stamped by note-stamper", hook: envelope.hook, at: new Date().toISOString() },
  });
}

process.stdout.write(JSON.stringify({
  payload_version: "1.0", ok: true, patches,
  logs: [`proposed ${patches.length} patches`],
}));
