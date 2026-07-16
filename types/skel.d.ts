/**
 * @skel/spec — TypeScript types for SKEL 2.9 (Story Keyframe Extensible Layout).
 * Mirrors spec/skel.schema.json (+ studio.schema.json, sidecar schemas).
 *
 * Token fields are typed as their core enum union OR an `x-` custom token
 * (`XToken`), matching the schema's anyOf pattern.
 */

export type XToken = `x-${string}`;

/** Vendor-namespaced extension data. Keys must start with "x-". */
export type Extensions = { [key: XToken]: unknown };

/** BONE data keyed by bone_id. Shapes are defined by the BONE definitions. */
export type Bones = Record<string, Record<string, unknown>>;

// ── Tokens (skel-spec §4.1) ───────────────────────────────────────────────────

export type SizeToken = "ws" | "mws" | "ms" | "mcu" | "cu" | "ecu" | "pov" | "ots" | "2s" | "est" | "fs" | "cowboy" | "ins" | "3s" | "group" | XToken;
export type AngleToken = "eye" | "low" | "high" | "dutch" | "bird" | "worm" | "profile" | "three_quarter" | XToken;
export type LensToken = "wide" | "std" | "tele" | "macro" | "anamorphic" | XToken;
export type MoveToken = "static" | "pan" | "tilt" | "dolly" | "crane" | "handheld" | "steadicam" | "drone" | "zoom_in" | "zoom_out" | "dolly_zoom" | "arc" | "truck" | "pedestal" | "whip_pan" | "roll" | "push_in" | "pull_out" | XToken;
export type LightToken = "natural" | "noir" | "high_key" | "low_key" | "golden" | "blue" | "practical" | "neon" | "silhouette" | "backlit" | "rembrandt" | "moonlight" | "firelight" | "overcast" | "harsh_sun" | "strobe" | "volumetric" | XToken;
export type DofToken = "deep" | "shallow" | "rack" | "split" | "tilt_shift" | XToken;
export type AspectToken = "16:9" | "9:16" | "1:1" | "4:3" | "2.39:1" | "21:9" | "4:5" | "1.85:1" | "3:2" | XToken;
export type ColorToken = "warm" | "cool" | "teal_orange" | "monochrome" | "sepia" | "desaturated" | "vibrant" | "pastel" | "bleach_bypass" | XToken;
export type MoodToken = "tense" | "romantic" | "eerie" | "melancholic" | "hopeful" | "foreboding" | "serene" | "chaotic" | "nostalgic" | "oppressive" | "whimsical" | "triumphant" | XToken;
export type WeatherToken = "clear" | "rain" | "heavy_rain" | "snow" | "fog" | "storm" | "wind" | "overcast" | "heat_haze" | XToken;
export type TextureToken = "film_35mm" | "film_16mm" | "digital_clean" | "vhs" | "grainy" | XToken;
export type TodToken = "DAY" | "NIGHT" | "DAWN" | "DUSK" | "MORNING" | "AFTERNOON" | "EVENING" | "LATER" | "SAME" | "CONT" | XToken;
export type TransitionToken = "cut" | "dissolve" | "fade_in" | "fade_out" | "smash_cut" | "match_cut" | "wipe" | "iris" | "whip" | XToken;

export type TokenCategory = "size" | "angle" | "lens" | "move" | "light" | "tod" | "dof" | "aspect" | "color" | "mood" | "weather" | "texture" | "transition";

// ── Core structure ────────────────────────────────────────────────────────────

export type Lifecycle = "draft" | "production" | "export";
export type CreativeStatus = "idea" | "drafted" | "needs_review" | "approved" | "locked";
export type StoryFunction = "setup" | "escalation" | "reveal" | "reaction" | "decision" | "transition" | "payoff" | "button";
export type ProductionState = "not_started" | "pending" | "generating" | "review" | "approved" | "rejected" | "failed";
export type NarrativeMode = "present" | "flashback" | "flashforward" | "dream" | "montage" | "imagined" | XToken;
export type AttachTarget = "metadata" | "act" | "scene" | "shot" | "character" | "environment";

export interface SKELDocument {
  $schema?: string;
  /** Semver; MAJOR.MINOR required, PATCH optional (e.g. "2.0" or "2.0.1"). */
  skel_version: string;
  metadata: Metadata;
  bone_registry?: Record<string, BoneRegistryEntry>;
  acts: Act[];
  scenes: Scene[];
  shots: Shot[];
  characters?: Character[];
  environments?: Environment[];
  locations?: Location[];
  props?: Prop[];
  audio_assets?: AudioAsset[];
  music_cues?: MusicCue[];
  story_analysis?: StoryAnalysis;
  production?: Production;
  key_file?: string | KeyFile;
}

export interface Metadata {
  story_id: string;
  title: string;
  lifecycle?: Lifecycle;
  logline?: string;
  subtitle?: string;
  author?: string;
  director?: string;
  writer?: string;
  genre?: string;
  classification?: string;
  target_audience?: string;
  /** Canonical duration field; wins over target_duration_minutes on conflict. */
  target_duration_seconds?: number;
  /** Derived display convenience only. */
  target_duration_minutes?: number;
  budget_range?: string;
  status?: string;
  /** BCP 47 tag; Dialogue.lang overrides per line. */
  language?: string;
  content_warnings?: string[];
  tags?: string[];
  production_notes?: string;
  created_at?: string;
  modified_at?: string;
  /** Resolves to a skin id in the studio registry. */
  skin_key?: string;
  series?: SeriesRef;
  delivery?: Delivery;
  source?: SourceProvenance;
  /** Host-owned; MUSCLEs cannot patch it. */
  plugins?: PluginRecord[];
  constraints?: Record<string, unknown>;
  bones?: Bones;
  extensions?: Extensions;
}

export interface SeriesRef {
  series_id: string;
  series_title?: string;
  season?: number;
  episode?: number;
  /** e.g. "S01E03" */
  episode_code?: string;
  arc_refs?: string[];
  /** story_ids this episode assumes. */
  previously?: string[];
}

export interface Delivery {
  /** fps; the timecode base. */
  frame_rate?: number;
  resolution?: { width: number; height: number };
  /** Project default; v_setup.aspect overrides per shot. */
  aspect?: string;
  color_space?: "rec709" | "srgb" | "p3-d65" | "rec2020" | "aces-cct" | XToken;
  audio?: { sample_rate?: number; channels?: number; loudness_target_lufs?: number };
}

export interface SourceProvenance {
  format: string;
  file?: string;
  tool?: string;
  imported_at?: string;
}

export interface PluginRecord {
  id: string;
  version: string;
  last_ran?: string;
}

export interface Act {
  id: string;
  /** Derived display index; refs arrays are canonical (§3.6). */
  order?: number;
  title: string;
  scene_refs: string[];
  bones?: Bones;
  extensions?: Extensions;
}

export interface Loc {
  type: "INT" | "EXT" | "INT/EXT";
  name: string;
  tod: TodToken;
}

export interface SceneIntent {
  purpose?: string;
  conflict?: string;
  emotional_turn?: string;
  story_function?: StoryFunction;
}

export interface ShotIntent {
  beat?: string;
  function?: StoryFunction;
  emphasis?: string;
}

export interface Scene {
  id: string;
  act_id: string;
  order?: number;
  /** Derived display slug line; loc is canonical. */
  header: string;
  loc: Loc;
  /** The physical place (Location). */
  location_ref?: string;
  /** The dressed/lit variant (Environment). */
  environment_ref?: string;
  shot_refs: string[];
  narrative?: string;
  notes?: string;
  duration_seconds?: number;
  mood?: string;
  key_story_elements?: string[];
  /** Sortable in-world chronological position. */
  story_time?: string | number;
  time_elapsed_since_previous?: string;
  narrative_mode?: NarrativeMode;
  transition_out?: TransitionToken;
  intent?: SceneIntent;
  creative_status?: CreativeStatus;
  bones?: Bones;
  extensions?: Extensions;
}

export interface VSetup {
  size: SizeToken;
  angle: AngleToken;
  lens?: LensToken;
  move?: MoveToken;
  light?: LightToken;
  dof?: DofToken;
  aspect?: AspectToken;
  color?: ColorToken;
  mood?: MoodToken;
  weather?: WeatherToken;
  texture?: TextureToken;
}

/** Canonical home of production status; x-genlock.production_status is a deprecated mirror. */
export interface Status {
  image?: ProductionState;
  video?: ProductionState;
}

export type DialogueMode = "spoken" | "vo" | "os" | "thought" | "song" | "radio";

export interface Dialogue {
  text: string;
  character_ref?: string;
  mode?: DialogueMode;
  /** BCP 47; defaults to metadata.language. */
  lang?: string;
  subtitle?: string;
  timing_start_seconds?: number;
  timing_end_seconds?: number;
  emotion?: string;
  delivery_notes?: string;
  voice_settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SoundCue {
  audio_ref: string;
  timing_start_seconds?: number;
  timing_end_seconds?: number;
  volume?: number;
  loop?: boolean;
  [key: string]: unknown;
}

export interface CuePoint {
  shot_ref: string;
  /** Defaults to 0; negative leads the cut. */
  offset_seconds?: number;
}

export interface MusicCue {
  id: string;
  audio_ref: string;
  in: CuePoint;
  out?: CuePoint;
  volume?: number;
  notes?: string;
  extensions?: Extensions;
}

export interface Cinematography {
  focal_length?: string;
  lens_type?: string;
  focus_subject?: string;
  framing_notes?: string;
  depth_of_field?: string;
  lighting?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Shot {
  id: string;
  scene_id: string;
  order?: number;
  title?: string;
  /** Max 200 chars; importers park the untruncated source under x-<format> (§3.5). */
  action: string;
  visual_focus?: string;
  dialogue?: string | Dialogue | Dialogue[];
  character_refs?: string[];
  prop_refs?: string[];
  duration?: number;
  notes?: string;
  status?: Status;
  v_setup: VSetup;
  cinematography?: Cinematography;
  sound_effects?: SoundCue[];
  transition_out?: TransitionToken;
  /** Described-video accessibility text. */
  audio_description?: string;
  intent?: ShotIntent;
  creative_status?: CreativeStatus;
  bones?: Bones;
  extensions?: Extensions;
}

// ── Asset layer (2.9) ─────────────────────────────────────────────────────────

export type CharacterRole = "protagonist" | "antagonist" | "deuteragonist" | "supporting" | "minor" | "background" | "narrator" | XToken;

export interface WardrobeVariant {
  id: string;
  label?: string;
  description?: string;
  scene_refs?: string[];
}

export interface VoiceProfile {
  description?: string;
  accent?: string;
  casting?: string;
  voice_settings?: Record<string, unknown>;
}

export interface Relationship {
  character_ref: string;
  type?: string;
  description?: string;
}

export interface CharacterStateOverride {
  scene_ref: string;
  wardrobe_ref?: string;
  injuries?: string;
  notes?: string;
}

export interface Character {
  id: string;
  name: string;
  aliases?: string[];
  pronouns?: string;
  age?: string | number;
  age_range?: string;
  species?: string;
  role?: CharacterRole;
  archetype?: string;
  /** THE canonical 30–60-word appearance description; reused verbatim downstream. */
  identity_lock?: string;
  height?: string;
  build?: string;
  hair?: string;
  eyes?: string;
  skin?: string;
  distinguishing_marks?: string[];
  default_wardrobe?: string;
  wardrobe_variants?: WardrobeVariant[];
  voice?: VoiceProfile;
  reference_sheet?: string;
  reference_images?: string[];
  identity_refs?: { lora?: string; embedding?: string; soul_id?: string; face_ref?: string; [key: string]: unknown };
  thumbnail?: string;
  bio?: string;
  want?: string;
  need?: string;
  flaw?: string;
  arc?: string;
  secrets?: string[];
  relationships?: Relationship[];
  first_appearance?: string;
  props_carried?: string[];
  state_overrides?: CharacterStateOverride[];
  creative_status?: CreativeStatus;
  notes?: string;
  tags?: string[];
  bones?: Bones;
  extensions?: Extensions;
  /** Open for pre-2.9 loose snapshots. */
  [key: string]: unknown;
}

export interface TodVariant {
  tod: TodToken;
  lighting?: string;
  description?: string;
}

export interface Environment {
  id: string;
  name: string;
  loc_type?: "INT" | "EXT" | "INT/EXT";
  /** Parent Location. */
  location_ref?: string;
  description?: string;
  /** Canonical prompt text, mirroring Character.identity_lock. */
  style_lock?: string;
  era_period?: string;
  /** Spatial layout notes — the continuity anchor. */
  geography?: string;
  tod_variants?: TodVariant[];
  weather_default?: WeatherToken;
  soundscape_refs?: string[];
  reference_images?: string[];
  props_present?: string[];
  bones?: Bones;
  extensions?: Extensions;
  [key: string]: unknown;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  reference_images?: string[];
  notes?: string;
  extensions?: Extensions;
}

export type PropSignificance = "set_dressing" | "recurring" | "plot_critical";

export interface Prop {
  id: string;
  name: string;
  description?: string;
  significance?: PropSignificance;
  first_appearance?: string;
  carried_by?: string;
  reference_image?: string;
  notes?: string;
  extensions?: Extensions;
}

export interface AudioAsset {
  id: string;
  name?: string;
  type?: "dialogue" | "sfx" | "music";
  [key: string]: unknown;
}

export interface StoryAnalysis {
  themes?: string[];
  motifs?: string[];
  character_arcs?: Array<{ character_ref?: string; arc?: string; notes?: string; [key: string]: unknown }>;
  emotional_curve?: Array<{ scene_ref?: string; emotion?: string; intensity?: number; [key: string]: unknown }>;
  pacing_notes?: string;
  [key: string]: unknown;
}

export interface Production {
  schedule?: Record<string, unknown>;
  budget?: Record<string, unknown>;
  crew?: Array<{ role?: string; name?: string; [key: string]: unknown }>;
  generation_stats?: Record<string, unknown>;
  [key: string]: unknown;
}

// ── Key file ──────────────────────────────────────────────────────────────────

export interface KeyFileToken {
  token: string;
  label: string;
  description?: string;
  [key: string]: unknown;
}

export interface CustomKeyFileToken extends KeyFileToken {
  token: XToken;
  category: TokenCategory;
}

export interface KeyFile {
  version?: string;
  size?: KeyFileToken[];
  angle?: KeyFileToken[];
  lens?: KeyFileToken[];
  move?: KeyFileToken[];
  light?: KeyFileToken[];
  tod?: KeyFileToken[];
  dof?: KeyFileToken[];
  aspect?: KeyFileToken[];
  color?: KeyFileToken[];
  mood?: KeyFileToken[];
  weather?: KeyFileToken[];
  texture?: KeyFileToken[];
  transition?: KeyFileToken[];
  custom?: CustomKeyFileToken[];
}

// ── BONE ──────────────────────────────────────────────────────────────────────

export type BoneTarget = "image" | "video" | "audio" | "style" | "custom";
/** Neutral write-back slots (BONE Spec §2.6). Deprecated read-accepted aliases: image, startFrameImage, endFrameImage, videoTake. */
export type BoneOutputTarget = "still" | "start_frame" | "end_frame" | "video_take" | "audio_track" | (string & {});

export interface BoneFieldDef {
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  ui?: string;
  label?: string;
  description?: string;
  default?: unknown;
  min?: number;
  max?: number;
  options?: unknown[];
  [key: string]: unknown;
}

export interface QualityGate {
  severity: string;
  message: string;
  id?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface BoneRegistryEntry {
  bone_version?: string;
  label: string;
  description?: string;
  target: BoneTarget;
  provider?: string;
  attaches_to?: AttachTarget[];
  fields: Record<string, Partial<BoneFieldDef>>;
  defaults?: Record<string, unknown>;
  output?: { format?: string; target?: BoneOutputTarget; path_template?: string; completion_status?: ProductionState; [key: string]: unknown };
  /** Capability ids this BONE needs to fire (host capability matrix). */
  requires?: string[];
  pipeline_stage?: string;
  authoring_mode?: "templated" | "atelier" | "hybrid" | XToken;
  render_runtime?: "native" | "remotion" | "hyperframes" | "ffmpeg" | XToken;
  style_tokens?: Record<string, unknown>;
  decision_log_refs?: string[];
  quality_gates?: QualityGate[];
  [key: string]: unknown;
}

/** Generation provenance block (BONE Spec §2.8). */
export interface Provenance {
  bone_id?: string;
  provider?: string;
  model?: string;
  prompt?: string;
  params?: Record<string, unknown>;
  generated_at?: string;
  job_id?: string;
}

// ── Validation (ARCHITECTURE.md / spec/errors.md) ─────────────────────────────

export interface SKELError {
  /** Stable code from spec/errors.md; MUSCLE codes are `<muscle_id>.<code>`. */
  code: string;
  severity: "error" | "warning";
  /** RFC 6901 JSON Pointer. */
  path: string;
  message: string;
}

export interface SKELValidationResult {
  valid: boolean;
  lifecycle: Lifecycle;
  errors: SKELError[];
  warnings: SKELError[];
}

// ── Sidecars ──────────────────────────────────────────────────────────────────

export interface VideoTake {
  id: string;
  file: string;
  isActive: boolean;
  label?: string;
  bone_id?: string;
  duration?: number;
  created_at?: string;
  /** Legacy provenance (pre-2.9 writers). */
  prompt?: string;
  promptJson?: Record<string, unknown>;
  provenance?: Provenance;
  extensions?: Extensions;
}

export type VideoMap = Record<string, { takes: VideoTake[] }>;

export interface ShotAudioEntry {
  dialogue?: string | null;
  sfx?: string | null;
  music?: string | null;
  provenance?: { dialogue?: Provenance; sfx?: Provenance; music?: Provenance };
}

export type AudioMap = Record<string, ShotAudioEntry>;

// ── Studio registry (studio.schema.json) ─────────────────────────────────────

export interface StudioVoice {
  id: string;
  label?: string;
  description?: string;
  accent?: string;
  provider?: string;
  voice_id?: string;
  settings?: Record<string, unknown>;
  tags?: string[];
}

export interface StudioSkin {
  id: string;
  label?: string;
  description?: string;
  style_text?: string;
  palette_ref?: string;
  v_setup_defaults?: Partial<VSetup> & Record<string, unknown>;
  reference_images?: string[];
  extensions?: Extensions;
}

export interface StudioPalette {
  id: string;
  label?: string;
  colors?: string[];
  notes?: string;
}

export interface SeriesEpisode {
  episode_code: string;
  story_id?: string;
  project_slug?: string;
  title?: string;
  logline?: string;
  status?: string;
}

export interface SeriesSeason {
  season: number;
  title?: string;
  episodes?: SeriesEpisode[];
}

export interface SeriesArc {
  id: string;
  title?: string;
  description?: string;
  /** episode_codes, in order. */
  spans?: string[];
}

export interface Series {
  series_id: string;
  title: string;
  format?: "limited" | "ongoing" | "anthology";
  logline?: string;
  seasons?: SeriesSeason[];
  arcs?: SeriesArc[];
  /** Shared cast: character ids in the registry. */
  cast_refs?: string[];
  notes?: string;
  extensions?: Extensions;
}

export interface StudioRegistry {
  $schema?: string;
  studio_version: string;
  studio_id: string;
  name: string;
  description?: string;
  created_at?: string;
  modified_at?: string;
  characters?: Character[];
  environments?: Environment[];
  locations?: Location[];
  props?: Prop[];
  audio_assets?: AudioAsset[];
  voices?: StudioVoice[];
  skins?: StudioSkin[];
  palettes?: StudioPalette[];
  series?: Series[];
  notes?: string;
  extensions?: Extensions;
}
