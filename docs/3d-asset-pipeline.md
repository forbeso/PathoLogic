# 3D Asset Pipeline

PathoLogix serves optimized GLB files from `public/`. Keep original source models
outside `public/` so they are not copied into the production deployment.

## Optimize A Model

Use the same `gltfjsx` transform pipeline as the existing scene assets:

```bash
npx gltfjsx@6.5.3 source.glb \
  --output /tmp/Model.tsx \
  --transform \
  --resolution 1024
```

The command creates a sibling `*-transformed.glb`. Use a 1024-pixel texture
limit for hero assets such as patients, medics, vehicles, and equipment. Use
512 pixels for background terrain, plants, rocks, and structures.

Place the transformed GLB at the URL used by the scene component. Do not add
eager `useGLTF.preload()` calls for assets that are not present in the initial
scene.

## Budgets

Run:

```bash
npm run check:budgets
```

The check enforces:

- 28 MiB maximum for all files in `public/`
- 16 MiB maximum for all files in `public/models/`
- 4 MiB maximum for any single model

CI runs this check before the production build.

## Verification

After replacing a model:

1. Run lint, type-checking, the budget check, and a production build.
2. Load the festival and collision scenes.
3. Switch scenes through both the desktop and mobile controls.
4. Wait for the asset loader to finish before inspecting the canvas.
5. Check materials, orientation, scale, clipping, and camera framing.

The EMT Scene Playwright regression performs the scene switch and verifies the
collision-specific model response before capturing the rendered canvas.
