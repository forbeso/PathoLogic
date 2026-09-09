# Sick City Blender kit

Original city assets authored with Blender 5.0.1. Open `sickcity-city-kit.blend` to edit the complete kit; `city-kit-preview.png` shows the rendered source scene.

The reproducible source is `scripts/build-sickcity-assets.py`. Run from the project root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/build-sickcity-assets.py
```

The generator writes four runtime GLBs to `public/models/sickcity/designed/` and keeps the editable source and studio render here. Each model uses meter units, a ground-level origin, and glTF Y-up coordinates. Building facades face negative Z. Runtime models are joined by material to keep draw calls down; instances share geometry and materials.

- `market-corner.glb`: terracotta mixed-use building with retail awnings.
- `civic-apartments.glb`: taller slate apartment block.
- `riverside-cafe.glb`: low sage cafe building.
- `unit-07-ambulance.glb`: EMS response vehicle, parked in the game.

All four assets total approximately 2.41 MiB, each below the project's 4 MiB per-model budget. The seven original FBX character assets have since been converted to animated GLBs (269.46 MiB → 9.64 MiB) and archived in `artifacts/sickcity-source-assets/`. See `character-optimization.json` for per-model sizes and bounds. The repository-wide model budget still fails at 26.81 MiB against a 16 MiB limit, although every individual model now passes its 4 MiB limit.

## Character optimization

Run `scripts/optimize-sickcity-characters.py` using Blender in background mode. Completed exports are skipped using `character-optimization.json`; remove a model’s report entry to regenerate it. The script reads source FBXs from the archive when they are no longer in `public/`.

Textures are limited to 512 pixels, geometry is reduced toward 24,000 triangles, and skeletons and animation clips are retained. Blender exports meter-scale scenes, so the React wrappers use meter-scale factors. The retained armature basis has local Z vertical: runtime root-motion suppression freezes hip X/Y translation while keeping the vertical stride.

Validation: TypeScript, targeted lint, GLB skin/animation checks, and a browser playthrough of the breathing call covering movement, proximity interaction, incorrect/correct feedback, all four decisions, and debrief. Mobile viewport emulation did not apply in the in-app browser, so mobile rendering remains unverified.
