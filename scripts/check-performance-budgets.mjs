import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const MEBIBYTE = 1024 * 1024;
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const MODELS_DIR = path.join(PUBLIC_DIR, "models");
const BUILD_MANIFEST = path.join(ROOT, ".next", "build-manifest.json");
const EMT_SCENE_CORE_MODELS = [
  "public/models/emt-scene/custom/ambulance-optimized.glb",
  "public/models/emt-scene/custom/first-aid-bag-optimized.glb",
  "public/models/emt-scene/custom/patient-optimized.glb",
  "public/models/emt-scene/paramedic-guide.glb",
];

const budgets = {
  publicBytes: 28 * MEBIBYTE,
  modelBytes: 16 * MEBIBYTE,
  singleModelBytes: 4 * MEBIBYTE,
  emtSceneCoreBytes: 2 * MEBIBYTE,
  emtSceneInitialJavaScriptBytes: 750 * 1024,
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(fullPath) : [fullPath];
    })
  );

  return nested.flat();
}

function formatBytes(bytes) {
  return `${(bytes / MEBIBYTE).toFixed(2)} MiB`;
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath);
}

const [publicFiles, modelFiles] = await Promise.all([
  collectFiles(PUBLIC_DIR),
  collectFiles(MODELS_DIR),
]);
const publicSizes = await Promise.all(publicFiles.map(async (file) => [file, (await stat(file)).size]));
const modelSizes = await Promise.all(modelFiles.map(async (file) => [file, (await stat(file)).size]));
const publicBytes = publicSizes.reduce((total, [, size]) => total + size, 0);
const modelBytes = modelSizes.reduce((total, [, size]) => total + size, 0);
const oversizedModels = modelSizes
  .filter(([, size]) => size > budgets.singleModelBytes)
  .sort((a, b) => b[1] - a[1]);
const failures = [];
const emtSceneCoreSizes = await Promise.all(
  EMT_SCENE_CORE_MODELS.map(async (file) => {
    const absolutePath = path.join(ROOT, file);
    return [absolutePath, (await stat(absolutePath)).size];
  })
);
const emtSceneCoreBytes = emtSceneCoreSizes.reduce(
  (total, [, size]) => total + size,
  0
);

if (publicBytes > budgets.publicBytes) {
  failures.push(
    `Public assets use ${formatBytes(publicBytes)}; budget is ${formatBytes(budgets.publicBytes)}.`
  );
}

if (modelBytes > budgets.modelBytes) {
  failures.push(
    `3D models use ${formatBytes(modelBytes)}; budget is ${formatBytes(budgets.modelBytes)}.`
  );
}

for (const [file, size] of oversizedModels) {
  failures.push(
    `${relativePath(file)} is ${formatBytes(size)}; per-model budget is ${formatBytes(
      budgets.singleModelBytes
    )}.`
  );
}

if (emtSceneCoreBytes > budgets.emtSceneCoreBytes) {
  failures.push(
    `EMT Scene core models use ${formatBytes(
      emtSceneCoreBytes
    )}; budget is ${formatBytes(budgets.emtSceneCoreBytes)}.`
  );
}

console.log(`Public assets: ${formatBytes(publicBytes)} / ${formatBytes(budgets.publicBytes)}`);
console.log(`3D models: ${formatBytes(modelBytes)} / ${formatBytes(budgets.modelBytes)}`);
console.log(
  `EMT Scene core models: ${formatBytes(emtSceneCoreBytes)} / ${formatBytes(
    budgets.emtSceneCoreBytes
  )}`
);

try {
  const manifest = JSON.parse(await readFile(BUILD_MANIFEST, "utf8"));
  const emtSceneChunks = manifest.pages?.["/emtscene"] ?? [];
  const chunkSizes = await Promise.all(
    emtSceneChunks.map(async (chunk) => {
      const file = path.join(ROOT, ".next", chunk);
      return (await stat(file)).size;
    })
  );
  const initialJavaScriptBytes = chunkSizes.reduce((total, size) => total + size, 0);

  console.log(
    `EMT Scene initial JavaScript: ${formatBytes(
      initialJavaScriptBytes
    )} / ${formatBytes(budgets.emtSceneInitialJavaScriptBytes)}`
  );
  if (initialJavaScriptBytes > budgets.emtSceneInitialJavaScriptBytes) {
    failures.push(
      `EMT Scene initial JavaScript is ${formatBytes(
        initialJavaScriptBytes
      )}; budget is ${formatBytes(
        budgets.emtSceneInitialJavaScriptBytes
      )}. Keep the 3D renderer dynamically loaded.`
    );
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  console.log("EMT Scene initial JavaScript: skipped (run a production build first).");
}

if (failures.length > 0) {
  console.error("\nPerformance budget failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Performance budgets passed.");
