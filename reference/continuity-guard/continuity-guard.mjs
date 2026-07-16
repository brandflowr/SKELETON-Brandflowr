#!/usr/bin/env node
// continuity-guard — a worked veto-mode MUSCLE over the SKEL 2.9 asset layer.
// Reads a hook envelope on stdin (cli route), returns SKELError-shaped warnings
// namespaced by muscle_id (spec/errors.md §10). It never blocks a save — the
// point is showing veto-mode wiring plus machine-checkable continuity:
//
//   continuity-guard.prop-orphan          plot-critical prop used in exactly one shot
//   continuity-guard.first-appearance     first_appearance disagrees with actual first use
//   continuity-guard.carried-prop-unseen  props_carried never co-appears with its carrier
//   continuity-guard.wardrobe-absent      wardrobe variant assigned to a scene its wearer isn't in
const envelope = JSON.parse(await new Response(process.stdin).text());
const doc = envelope.document ?? {};
const warnings = [];
const warn = (code, path, message) => warnings.push({ code: `continuity-guard.${code}`, severity: "warning", path, message });

const shots = doc.shots ?? [];
const scenes = doc.scenes ?? [];
const acts = doc.acts ?? [];

// Presentation order of shots: acts → scene_refs → shot_refs.
const sceneById = new Map(scenes.map((s) => [s.id, s]));
const orderedShotIds = acts.flatMap((a) => (a.scene_refs ?? []).flatMap((r) => sceneById.get(r)?.shot_refs ?? []));
const shotOrder = new Map(orderedShotIds.map((id, i) => [id, i]));

// 1 + 2: props — orphaned plot-critical usage, first_appearance drift
(doc.props ?? []).forEach((prop, pi) => {
  const usedIn = shots.filter((sh) => (sh.prop_refs ?? []).includes(prop.id)).map((sh) => sh.id);
  if (prop.significance === "plot_critical" && usedIn.length === 1) {
    warn("prop-orphan", `/props/${pi}`, `Plot-critical prop '${prop.id}' appears only in ${usedIn[0]} — setup without payoff (or payoff without setup).`);
  }
  if (prop.first_appearance && usedIn.length) {
    const actualFirst = [...usedIn].sort((a, b) => (shotOrder.get(a) ?? 1e9) - (shotOrder.get(b) ?? 1e9))[0];
    if (actualFirst !== prop.first_appearance) {
      warn("first-appearance", `/props/${pi}/first_appearance`, `Prop '${prop.id}' declares first_appearance ${prop.first_appearance} but first shows up in ${actualFirst}.`);
    }
  }
});

// 3 + 4: characters — carried props and wardrobe scene coverage
(doc.characters ?? []).forEach((ch, ci) => {
  const charShots = shots.filter((sh) => (sh.character_refs ?? []).includes(ch.id));
  const charSceneIds = new Set(charShots.map((sh) => sh.scene_id));

  (ch.props_carried ?? []).forEach((propId, j) => {
    const together = charShots.some((sh) => (sh.prop_refs ?? []).includes(propId));
    if (charShots.length && !together) {
      warn("carried-prop-unseen", `/characters/${ci}/props_carried/${j}`, `Character '${ch.id}' carries '${propId}' but no shot shows them together (prop_refs).`);
    }
  });

  if (ch.first_appearance && charShots.length) {
    const actualFirst = charShots.map((s) => s.id).sort((a, b) => (shotOrder.get(a) ?? 1e9) - (shotOrder.get(b) ?? 1e9))[0];
    if (actualFirst !== ch.first_appearance) {
      warn("first-appearance", `/characters/${ci}/first_appearance`, `Character '${ch.id}' declares first_appearance ${ch.first_appearance} but first shows up in ${actualFirst}.`);
    }
  }

  (ch.wardrobe_variants ?? []).forEach((w, wi) => {
    (w.scene_refs ?? []).forEach((sceneId, si) => {
      if (sceneById.has(sceneId) && !charSceneIds.has(sceneId)) {
        warn("wardrobe-absent", `/characters/${ci}/wardrobe_variants/${wi}/scene_refs/${si}`, `Wardrobe '${w.id}' is assigned to ${sceneId}, but '${ch.id}' appears in no shot of that scene.`);
      }
    });
  });
});

process.stdout.write(JSON.stringify({
  payload_version: "1.1",
  ok: true,
  errors: [],
  warnings,
  logs: [`continuity-guard checked ${shots.length} shots, ${(doc.props ?? []).length} props, ${(doc.characters ?? []).length} characters`],
}));
