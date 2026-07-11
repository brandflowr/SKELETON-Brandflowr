# SKEL Token Quick Reference

> All valid tokens, defaults, and constraints at a glance.

---

## Shot Size (`v_setup.size`) — required

| Token | Label | Description |
|-------|-------|-------------|
| `ws`  | Wide Shot | Full environment, subject small |
| `mws` | Medium Wide | Knees up + environment |
| `ms`  | Medium Shot | Waist up |
| `mcu` | Medium Close-Up | Chest up |
| `cu`  | Close-Up | Face fills frame |
| `ecu` | Extreme Close-Up | Single detail (eye, hand) |
| `pov` | Point of View | Character's literal viewpoint |
| `ots` | Over the Shoulder | Past one character toward another |
| `2s`  | Two Shot | Two subjects together |

**Default:** `ms`

---

## Camera Angle (`v_setup.angle`) — required

| Token | Label | Conveys |
|-------|-------|---------|
| `eye`   | Eye Level | Neutral |
| `low`   | Low Angle | Power, menace |
| `high`  | High Angle | Vulnerability |
| `dutch` | Dutch Angle | Unease, disorientation |
| `bird`  | Bird's Eye | God-like, surveillance |
| `worm`  | Worm's Eye | Extreme low |

**Default:** `eye`

---

## Lens (`v_setup.lens`) — optional

| Token | Label | Focal Length |
|-------|-------|-------------|
| `wide`       | Wide Lens | 14–35mm |
| `std`        | Standard | 35–70mm |
| `tele`       | Telephoto | 70–200mm+ |
| `macro`      | Macro | Extreme close focus |
| `anamorphic` | Anamorphic | Widescreen, oval bokeh |

**Default:** `std`

---

## Camera Movement (`v_setup.move`) — optional

| Token | Label | Description |
|-------|-------|-------------|
| `static`    | Static | Locked off, no movement |
| `pan`       | Pan | Horizontal rotation |
| `tilt`      | Tilt | Vertical rotation |
| `dolly`     | Dolly | Toward/away on track |
| `crane`     | Crane | Vertical through space |
| `handheld`  | Handheld | Organic, unstable |
| `steadicam` | Steadicam | Smooth floating |
| `drone`     | Drone | Aerial, sweeping |

**Default:** `static`

---

## Lighting (`v_setup.light`) — optional

| Token | Label | Look |
|-------|-------|------|
| `natural`   | Natural Light | Ambient, realistic |
| `noir`      | Film Noir | High contrast, deep shadows |
| `high_key`  | High Key | Bright, even, minimal shadows |
| `low_key`   | Low Key | Dark with selective highlights |
| `golden`    | Golden Hour | Warm, soft, magic hour |
| `blue`      | Blue Hour | Cool twilight |
| `practical` | Practical | In-frame sources (lamps, candles) |
| `neon`      | Neon | Saturated color, cyberpunk |

**Default:** `natural`

---

## Depth of Field (`v_setup.dof`) — optional

| Token | Label | Effect |
|-------|-------|--------|
| `deep`    | Deep Focus | Everything sharp |
| `shallow` | Shallow Focus | Subject sharp, BG blurred |
| `rack`    | Rack Focus | Focus shifts during shot |

**Default:** `deep`

---

## Color (`v_setup.color`) — optional

| Token | Label | Effect |
|-------|-------|--------|
| `warm` | Warm | Warm color temperature |
| `cool` | Cool | Cool color temperature |

**Default:** none (omitted = no grading token applied)

---

## Mood (`v_setup.mood`) — optional

| Token | Label | Effect |
|-------|-------|--------|
| `tense`    | Tense | A tense or uneasy mood |
| `romantic` | Romantic | A dreamy or romantic mood |

**Default:** none (omitted = no mood token applied)

---

## Time of Day (`loc.tod`) — required

| Token | Label |
|-------|-------|
| `DAY`   | Day |
| `NIGHT` | Night |
| `DAWN`  | Dawn |
| `DUSK`  | Dusk |
| `CONT`  | Continuous (same as previous scene) |

**Default:** `DAY`

---

## Location Type (`loc.type`) — required

| Value | Meaning |
|-------|---------|
| `INT` | Interior |
| `EXT` | Exterior |
| `INT/EXT` | Both |

---

## Constraints

| Rule | Value |
|------|-------|
| Max `action` length | **200 chars** |
| Max `prompt` length | **300 chars** |
| Max `logline` length | **280 chars** |
| ID format (recommended) | `nanoid(12)` or UUID v4 |
| Extension key prefix | `x-` (e.g., `x-genlock`) |

---

## Minimal Valid Shot

```json
{
  "id": "sh_1",
  "scene_id": "sc_1",
  "action": "A figure walks through the door.",
  "v_setup": { "size": "ms", "angle": "eye" }
}
```

## Fully Specified Shot

```json
{
  "id": "sh_1",
  "scene_id": "sc_1",
  "action": "Harlan hunches over the logbook, scrawling coordinates.",
  "prompt": "Close-up of weathered hands writing in leather logbook, candlelight, noir lighting.",
  "dialogue": "It was me. It was always me.",
  "character_refs": ["char_harlan"],
  "duration": 4,
  "v_setup": {
    "size": "cu",
    "angle": "high",
    "lens": "std",
    "move": "static",
    "light": "noir",
    "dof": "shallow"
  },
  "extensions": {
    "x-genlock": { "production_status": "approved" }
  }
}
```
