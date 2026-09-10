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
  sickCityModelBytes: 6 * MEBIBYTE,
  sickCityInitialJavaScriptBytes: 650 * 1024,
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
const sickCityModelBytes = modelSizes.filter(([file]) => file.startsWith(path.join(MODELS_DIR, "sickcity") + path.sep)).reduce((total, [, size]) => total + size, 0);
const oversizedModels = modelSizes
  .filter(([, size]) => size > budgets.singleModelBytes)
  .sort((a, b) => b[1] - a[1]);
const failures = [];
if (sickCityModelBytes > budgets.sickCityModelBytes) {
  failures.push(`SickCity models use ${formatBytes(sickCityModelBytes)}; budget is ${formatBytes(budgets.sickCityModelBytes)}.`);
}
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
console.log(`SickCity models: ${formatBytes(sickCityModelBytes)} / ${formatBytes(budgets.sickCityModelBytes)}`);
console.log(
  `EMT Scene core models: ${formatBytes(emtSceneCoreBytes)} / ${formatBytes(
    budgets.emtSceneCoreBytes
  )}`
);

try {
  const manifest = JSON.parse(await readFile(BUILD_MANIFEST, "utf8"));
  for (const [route, label, budget] of [
    ["/emtscene", "EMT Scene", budgets.emtSceneInitialJavaScriptBytes],
    ["/sickcity", "SickCity", budgets.sickCityInitialJavaScriptBytes],
  ]) {
    const chunks = manifest.pages?.[route];
    if (!chunks?.length) {
      failures.push(`${label} is missing from the production build manifest.`);
      continue;
    }
    const chunkSizes = await Promise.all(chunks.map(async chunk => (await stat(path.join(ROOT, ".next", chunk))).size));
    const initialJavaScriptBytes = chunkSizes.reduce((total, size) => total + size, 0);
    console.log(`${label} initial JavaScript: ${formatBytes(initialJavaScriptBytes)} / ${formatBytes(budget)}`);
    if (initialJavaScriptBytes > budget) {
      failures.push(`${label} initial JavaScript is ${formatBytes(initialJavaScriptBytes)}; budget is ${formatBytes(budget)}. Keep the 3D renderer dynamically loaded.`);
    }
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  console.log("Initial JavaScript: skipped (run a production build first).");
}

if (failures.length > 0) {
  console.error("\nPerformance budget failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Performance budgets passed.");
