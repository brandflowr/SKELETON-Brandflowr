# BONE vs MUSCLE — the two-minute version

> **`.skel` is the skeleton** — your story's structure: acts, scenes, shots, camera setup.
> **BONEs attach to it. MUSCLEs move it.**

That's the whole model. Everything else is detail.

| | **BONE** 🦴 | **MUSCLE** 💪 |
|---|---|---|
| Kind of plugin | **Data** | **Behavior** |
| Answers | "What does this tool need to know?" | "What runs when something happens?" |
| File | `.bone.json` | `.muscle.json` |
| Contains | Fields, defaults, UI hints, prompt-assembly rules, output paths | Hook subscriptions, permissions, how to invoke it |
| Executes code? | Never — it *is* data | Yes — but only via the host, and it can only *propose* changes |
| On export | Embedded in your story file — travels everywhere | Recorded by name — reproducibility, never embedded |
| Mental model | A form. A contract. | An event handler. A workflow step. |

**BONEs are nouns. MUSCLEs are verbs.**

---

## BONE in 60 seconds

A BONE describes a tool — usually an AI generator — as pure data: the fields it expects, their defaults, how a UI should render them, how the final prompt assembles from your story's context, and where the rendered file lands when it's done.

```json
{
  "bone_id": "flux-dev",
  "label": "Flux Dev (Image Generation)",
  "target": "image",
  "fields": {
    "text":     { "type": "string", "required": true,  "ui": "textarea", "label": "Prompt" },
    "guidance": { "type": "number", "ui": "slider", "min": 1, "max": 20, "default": 7.5 },
    "seed":     { "type": "number", "ui": "number" }
  }
}
```

Attach BONE data at the project, scene, or shot level and it **cascades** — set your negative prompt once on the project, override guidance on one moody scene, override the prompt per shot. Shots only carry what's different.

**Why it exists:** AI generators change faster than any spec can keep up. So SKEL hardcodes *zero* generators. Swapping Flux for next month's model means swapping a JSON file — your story never changes.

## MUSCLE in 60 seconds

A MUSCLE is behavior — a lint rule, a house-style prompt enforcer, a format importer, a render post-processor — declared as a **manifest, not embedded code**. It subscribes to named moments in the workflow (import, validation, prompt assembly, generation routing, render completion, export), and the host calls your tool — CLI, MCP tool, or API — with JSON in, JSON out.

```json
{
  "muscle_id": "studio-style-guard",
  "label": "Studio Style Guard",
  "hooks": [{ "on": "prompt.assemble.after", "mode": "transform" }],
  "capabilities": ["read:document", "patch:shot.bones"],
  "execution_routes": [{ "type": "cli", "command": "style-guard run-hook" }]
}
```

The part that matters: **a MUSCLE never touches your story file.** It returns patches. The host checks every patch against the capabilities the plugin declared (and *you* approved), refuses anything touching locked content, applies the set atomically, and rolls back if the document would break. The worst a buggy — or hostile — plugin can do is get its patches rejected and logged.

**Why it exists:** data can be safely embedded in a document; code can't. So behavior stays outside the file, permission-scoped, and recorded — your story notes *what* acted on it, and opens everywhere either way.

---

## They work together

A real generator integration usually ships both:

- a **BONE** — *what to send*: the prompt contract, the knobs, where the output goes;
- a **MUSCLE** — *when and what then*: pick the cheapest route, enforce house style on every prompt, watermark each finished render.

The skeleton holds the story. The bones give it something to generate with. The muscles make the whole thing move.

→ Full specs: [bone-spec.md](../spec/bone-spec.md) · [muscle-spec.md](../spec/muscle-spec.md) · build one in an afternoon: [MUSCLE_AUTHORING.md](../spec/MUSCLE_AUTHORING.md)
