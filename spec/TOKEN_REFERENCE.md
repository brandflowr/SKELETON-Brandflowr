# SKEL Token Quick Reference

> All valid tokens, defaults, and constraints at a glance. 13 categories, 131 core tokens, plus `x-` customs.

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
| `est` | Establishing Shot | Opens a scene by showing the place |
| `fs`  | Full Shot | Head to toe, filling the frame |
| `cowboy` | Cowboy Shot | Mid-thigh up |
| `ins` | Insert Shot | Tight cutaway of a story-carrying detail |
| `3s`  | Three Shot | Three subjects together |
| `group` | Group Shot | Four or more subjects |

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
| `profile` | Profile | Side-on, observational |
| `three_quarter` | Three-Quarter | 45° portrait/reference angle |

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
| `zoom_in`   | Zoom In | Focal length increases, no travel |
| `zoom_out`  | Zoom Out | Focal length decreases, no travel |
| `dolly_zoom`| Dolly Zoom | Vertigo effect — background warps |
| `arc`       | Arc / Orbit | Circles the subject |
| `truck`     | Truck | Lateral travel, parallel to subject |
| `pedestal`  | Pedestal | Vertical raise/lower, no tilt |
| `whip_pan`  | Whip Pan | Violent blurring pan |
| `roll`      | Roll | Rotation on the lens axis |
| `push_in`   | Push In | Slow forward move — intensity |
| `pull_out`  | Pull Out | Slow backward move — reveal/isolate |

**Default:** `static`

> `dolly_zoom`, `arc`, `truck`, and `pedestal` map directly onto the camera-control vocabularies of Kling / Runway / Seedance APIs.

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
| `silhouette`| Silhouette | Dark shape against bright ground |
| `backlit`   | Backlit | Rim glow, haloed edges |
| `rembrandt` | Rembrandt | Portrait key with cheek triangle |
| `moonlight` | Moonlight | Cool, dim, directional night |
| `firelight` | Firelight | Warm flicker, restless shadows |
| `overcast`  | Overcast | Soft, diffuse, shadowless |
| `harsh_sun` | Harsh Sun | Hard midday shadows |
| `strobe`    | Strobe | Pulsing intermittent light |
| `volumetric`| Volumetric | Visible rays: god rays, dusty beams |

**Default:** `natural`

---

## Depth of Field (`v_setup.dof`) — optional

| Token | Label | Effect |
|-------|-------|--------|
| `deep`    | Deep Focus | Everything sharp |
| `shallow` | Shallow Focus | Subject sharp, BG blurred |
| `rack`    | Rack Focus | Focus shifts during shot |
| `split`   | Split Diopter | Two planes sharp at once |
| `tilt_shift` | Tilt-Shift | Miniaturizing selective plane |

**Default:** `deep`

---

## Aspect Ratio (`v_setup.aspect`) — optional

| Token | Label |
|-------|-------|
| `16:9` | Widescreen 16:9 |
| `9:16` | Vertical 9:16 |
| `1:1` | Square |
| `4:3` | Classic TV |
| `2.39:1` | Anamorphic scope |
| `21:9` | Ultra-wide |
| `4:5` | Portrait social feed |
| `1.85:1` | Theatrical flat |
| `3:2` | 35mm stills |

**Default:** none (project default lives in `metadata.delivery.aspect`)

---

## Color (`v_setup.color`) — optional

| Token | Label | Effect |
|-------|-------|--------|
| `warm` | Warm | Warm color temperature |
| `cool` | Cool | Cool color temperature |
| `teal_orange` | Teal & Orange | Blockbuster complementary grade |
| `monochrome` | Monochrome | Black and white |
| `sepia` | Sepia | Brown-toned archival |
| `desaturated` | Desaturated | Muted, drained, gritty |
| `vibrant` | Vibrant | Saturated, punchy |
| `pastel` | Pastel | Soft low-contrast candy palette |
| `bleach_bypass` | Bleach Bypass | Silver-retained metallic contrast |

**Default:** none (omitted = no grading token applied)

---

## Mood (`v_setup.mood`) — optional

| Token | Label |
|-------|-------|
| `tense` | Tense |
| `romantic` | Romantic |
| `eerie` | Eerie |
| `melancholic` | Melancholic |
| `hopeful` | Hopeful |
| `foreboding` | Foreboding |
| `serene` | Serene |
| `chaotic` | Chaotic |
| `nostalgic` | Nostalgic |
| `oppressive` | Oppressive |
| `whimsical` | Whimsical |
| `triumphant` | Triumphant |

**Default:** none (omitted = no mood token applied)

---

## Weather (`v_setup.weather`) — optional

| Token | Label | Effect |
|-------|-------|--------|
| `clear` | Clear | Cloudless, unobstructed light |
| `rain` | Rain | Wet surfaces, reflections |
| `heavy_rain` | Heavy Rain | Sheeting water, low visibility |
| `snow` | Snow | Falling/settled snow |
| `fog` | Fog | Shapes dissolve, depth compressed |
| `storm` | Storm | Wind + lightning + rain |
| `wind` | Wind | Moving hair, fabric, debris |
| `overcast` | Overcast | Flat gray sky |
| `heat_haze` | Heat Haze | Shimmering air distortion |

**Default:** none. Environments may declare `weather_default`.

---

## Texture (`v_setup.texture`) — optional

| Token | Label | Effect |
|-------|-------|--------|
| `film_35mm` | 35mm Film | Fine grain, halation |
| `film_16mm` | 16mm Film | Coarse grain, documentary |
| `digital_clean` | Digital Clean | Pristine, no grain |
| `vhs` | VHS | Tape noise, chroma bleed |
| `grainy` | Grainy | Pronounced generic grain |

**Default:** none

---

## Time of Day (`loc.tod`) — required

| Token | Label |
|-------|-------|
| `DAY`   | Day |
| `NIGHT` | Night |
| `DAWN`  | Dawn |
| `DUSK`  | Dusk |
| `MORNING` | Morning |
| `AFTERNOON` | Afternoon |
| `EVENING` | Evening |
| `LATER` | Unspecified jump forward |
| `SAME`  | Same time, resuming after a cutaway |
| `CONT`  | Continuous (same as previous scene) |

**Default:** `DAY`. Import mapping for other screenplay variants: spec §7.1.1. `CONT` semantics: spec §2.4.1.

---

## Transition (`shot.transition_out` / `scene.transition_out`) — optional

| Token | Label |
|-------|-------|
| `cut` | Cut |
| `dissolve` | Dissolve |
| `fade_in` | Fade In |
| `fade_out` | Fade Out |
| `smash_cut` | Smash Cut |
| `match_cut` | Match Cut |
| `wipe` | Wipe |
| `iris` | Iris |
| `whip` | Whip |

**Default:** omitted implies a straight `cut`.

---

## Location Type (`loc.type`) — required

| Value | Meaning |
|-------|---------|
| `INT` | Interior |
| `EXT` | Exterior |
| `INT/EXT` | Both |

---

## Custom Tokens

Any token field also accepts an `x-` prefixed custom token, declared in the key file's `custom` array with a required `category`:

```json
{ "token": "x-genlock-dreamy", "label": "Dreamy", "category": "light" }
```

See spec §4.3 for the validation rules (`CUSTOM_TOKEN_UNDECLARED`, `CUSTOM_TOKEN_CATEGORY_MISMATCH`).

---

## Constraints

| Rule | Value |
|------|-------|
| Max `action` length | **200 chars** (importers park the untruncated source under `x-<format>`, spec §3.5) |
| Max `logline` length | **280 chars** |
| Max BONE prompt length | per-BONE `prompt_assembly.max_length` (no global cap) |
| ID format (recommended) | `nanoid(12)` or UUID v4 |
| Extension key prefix | `x-` (e.g., `x-genlock`) — schema-enforced |

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

Prompt text lives in BONE data (`bones.<bone_id>.text`), not on the shot itself:

```json
{
  "id": "sh_1",
  "scene_id": "sc_1",
  "action": "Harlan hunches over the logbook, scrawling coordinates.",
  "dialogue": { "text": "It was me. It was always me.", "character_ref": "char_harlan", "mode": "spoken" },
  "character_refs": ["char_harlan"],
  "prop_refs": ["prop_watch"],
  "duration": 4,
  "status": { "image": "approved", "video": "not_started" },
  "v_setup": {
    "size": "cu",
    "angle": "high",
    "lens": "std",
    "move": "static",
    "light": "noir",
    "dof": "shallow",
    "weather": "storm",
    "texture": "film_35mm"
  },
  "transition_out": "smash_cut",
  "bones": {
    "flux-dev": {
      "text": "Close-up of weathered hands writing in leather logbook, candlelight, noir lighting."
    }
  },
  "extensions": {
    "x-genlock": { "hero_shot": true }
  }
}
```

(Requires a `bone_registry` entry for `flux-dev` and embedded/registry records for `char_harlan` and `prop_watch`.)
