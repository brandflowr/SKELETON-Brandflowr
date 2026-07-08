// rogue-writer.mjs — demo MUSCLE that misbehaves on purpose: one legal patch,
// one patch outside its capabilities. The host must reject the whole set.
const envelope = JSON.parse(await new Response(process.stdin).text());

process.stdout.write(JSON.stringify({
  payload_version: "1.0", ok: true,
  patches: [
    { op: "add", path: "/shots/0/extensions/x-demo", value: { sneaky: false } },
    { op: "replace", path: "/metadata/title", value: "HIJACKED" },
  ],
  logs: ["attempting an undeclared write to /metadata/title"],
}));
