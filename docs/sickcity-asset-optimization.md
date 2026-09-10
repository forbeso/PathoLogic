# SickCity asset optimization

The September 9, 2026 optimization retains all eleven SickCity models and their meshes, nodes, skins, and animation clips. High-precision Draco compression changes geometry encoding; it does not remove scenery or reduce texture resolution.

- SickCity model total: 5.01 MiB (previously approximately 12.04 MiB).
- All public model assets: 12.46 MiB, within the existing 16 MiB budget.
- All public assets, including local Draco decoders: 22.47 MiB, within the existing 28 MiB budget.
- SickCity initial production JavaScript: approximately 605 KiB, within a new 650 KiB budget. This includes shared route chunks and excludes dynamically loaded renderer chunks; it is not the complete playable-game download.

`node scripts/compress-sickcity-models.mjs` runs glTF Transform 4.5.0 with 16-bit positions, 12-bit normals, and 14-bit texture coordinates. Regenerate models from their Blender/FBX sources before recompressing if their geometry changes. Per-model size results are in `artifacts/sickcity-blender/draco-compression.json`.

SickCity loaders use `/draco/`, including preloads. The decoders are the glTF-specific files bundled with the project's Three.js dependency. Their Apache license and upstream README are included beside them. No external decoder CDN is required for SickCity.

Unused, unoptimized EMT Scene source GLBs are preserved in `artifacts/emt-scene-source-assets`; the runtime optimized variants remain at their original public URLs.

Validation: node/mesh/skin/clip count comparisons against the previous Git versions, live game visual inspection, browser decoder/model request checks, a production build, and `npm run check:budgets`. Cold-load timing and physical-device frame-rate benchmarks remain separate follow-up work.
