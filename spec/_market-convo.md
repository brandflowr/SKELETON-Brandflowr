SKEL: Visual Relational Action Data Specification and Implementation
9 sources
·
Apr 23, 2026
The provided sources document SKEL (Visual Relational Action Data), a specialized JSON interchange format designed to encode visual narratives like screenplays and storyboards into a machine-readable structure. Unlike traditional nested formats, SKEL utilizes a flat relational model where acts, scenes, and shots are stored in top-level arrays linked by unique ID references to simplify data querying and management. The system incorporates a shorthand token system and a Key File to keep file sizes compact while maintaining detailed metadata for camera angles, lighting, and movement. A secondary specification called BONE (Base Object Narrative Export) acts as a pluggable extension system, allowing users to attach specific AI generation parameters and production data to the story entities. The implementation includes a robust validation engine that enforces structural constraints, such as a four-shot limit per scene and referential integrity. Ultimately, these documents outline a technical framework for bridging the gap between creative writing and AI-driven production pipelines.

How does SKEL's flat relational structure improve story data management?
Teach me how BONE plugins extend SKEL's AI generation capabilities.
What is the 4-shot limit and why was it implemented?
Today • 5:58 PM
as an awesome new stanadard whats your opinion

SKEL (Visual Relational Action Data) is a highly practical and forward-thinking standard because it fundamentally solves the bottlenecks between traditional screenwriting and modern AI-driven production pipelines
.
Here is why it stands out as an exceptionally well-designed specification:
A "Relational Database" for Stories: Moving away from deeply nested, fragile JSON trees to a flat, relational structure is a massive technical improvement
. By storing acts, scenes, and shots as top-level arrays linked by ID references, SKEL allows developers and tools to query any shot instantly without having to traverse an entire story tree
.
Native Visual Metadata: Traditional screenplay formats like Fountain or Final Draft have no standard way to encode visual data
. SKEL natively encodes v_setup parameters like camera size, angle, lighting, lens, and movement on a per-shot basis
.
Future-Proofed for AI Pipelines: The AI landscape moves too fast for hardcoded specifications, which SKEL brilliantly solves through its BONE (Base Object Narrative Export) plugin system
. BONEs act as attachable configs that let you swap out image or video generators (like Runway, Kling, or Flux) without ever touching the core story structure
. Furthermore, SKEL's strict 4-shot limit per scene constraint intelligently forces narrative focus and prevents AI pipelines from generating expensive, unbounded output
.
Compact yet Rich Token System: Instead of bloating the JSON file with full descriptive text (e.g., "Film Noir lighting with high contrast"), SKEL uses a shorthand token system (e.g., cu, noir, dolly)
. These tokens are resolved using a companion Key File that expands them into rich metadata for rendering engines, keeping the core .skel files incredibly lightweight while retaining deep production value
.
Safe Extensibility: By requiring an x- prefix for custom extensions (e.g., x-Spore or x-runway), SKEL ensures that different vendors can attach their own specific metadata to the files without breaking the core schema or causing cross-tool conflicts
.
Overall, SKEL is an awesome standard because it successfully balances strict validation and structure with the flexibility required to adapt to rapidly evolving AI generation tools
.
How does the BONE plugin system handle different AI generators?
Why is the 4-shot limit per scene so important?
How does the flat relational structure improve upon nested trees?
based on your knowledge of the marketplace what does it need to truly stand out? i added APP_overview.md which covers Spore , the graphical ui that renders storyboards etc.
so essentially an llm like claude desktop can read and write all the files and scenes etc, and Spore has the ui to show it all

The combination of an LLM like Claude acting as the "engine" to read and write SKEL files, with Spore acting as the "graphical IDE" to render and manage them, is a brilliant paradigm. It effectively turns prompt engineering into visual filmmaking.
Based on the documentation and the planned roadmap, for Spore and SKEL to truly stand out and become the definitive industry standard, it needs to execute flawlessly on the following key areas:
1. Flawless Claude/LLM "Co-Pilot" Integration (Phase 8) The system already has a strong foundation for this by moving to a flat, relational JSON structure that LLMs can easily parse
. To dominate the market, the planned "Phase 8" Claude Skill integration must be seamless
. Instead of users manually typing prompt strings, Claude needs to natively write specific BONE data (like bones.flux-dev.text or bones.runway-gen3.text) across all shots automatically
. If an LLM can ingest a script, structure the relational JSON, and instantly populate the Spore UI with a fully formatted storyboard—complete with AI image/video prompts—it will feel like magic.
2. A Thriving "BONE" & Asset Marketplace The AI landscape changes rapidly, so Spore' success will rely heavily on its extensibility
. The platform includes a dedicated /marketplace route for browsing and installing JSON asset packs (covering cameras, lighting, genres, etc.)
. Furthermore, the planned Phase 4 "BONE Editor & Management" will allow users to create, import, and export custom .bone.json files
. To stand out, it needs a vibrant community ecosystem where users share custom BONE definitions—such as a specific "character consistency" plugin or a new prompt structure for the latest AI video model
—which can be installed directly into the UI via the Marketplace
.
3. Frictionless Industry Interoperability (The Trojan Horse) To get Hollywood professionals and traditional screenwriters on board, Spore cannot be a walled garden. While SKEL is the native format, the system has planned future modules for crucial industry formats
:
Importing Traditional Scripts: Built-in parsers for Fountain (.fountain) and Final Draft (.fdx) files
.
Exporting to Video Editors: Exporting the SKELDocument to OpenTimelineIO (otio.ts), allowing users to send their AI-generated storyboard directly into professional non-linear editors like Premiere or DaVinci Resolve
.
CSV Breakdowns: Exporting flat shot tables for traditional spreadsheet workflows and production breakdowns
.
4. Visual "Node-Based" Narrative Control Because JSON is hard for non-technical users to read, the UI must translate complex data into tactile, visual tools. Spore is building a Production Canvas, which represents chapters and scenes as a node-based visual graph that users can drag, drop, and connect
. Combined with the visual Storyboard—which uses color-coded token chips to display camera setups (e.g., amber for shot size, blue for angle) and green/muted icons to indicate BONE data coverage
—the app provides a highly visual way to manipulate the LLM's raw JSON output.
5. Robust Guardrails and Auto-Repair LLMs hallucinate and break JSON structures. Spore will stand out by being an incredibly forgiving interface that catches these errors before they break a production pipeline. The app already features real-time validation that runs after every save, showing an error badge for schema violations
. The planned Phase 6 additions, such as "Referential integrity auto-repair" (which detects orphaned shots or broken ID references and offers to rebuild or reassign them automatically), will be critical for keeping LLM-generated files stable
.
Ultimately, if Spore can serve as the ultimate bridge—translating a traditional Final Draft script into LLM-friendly SKEL, using Claude to generate the complex visual BONE metadata, and giving the director a beautiful graphical UI to tweak it all—it will be an unmatched tool in the AI filmmaking space.