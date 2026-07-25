import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const MEBIBYTE = 1024 * 1024;
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const MODELS_DIR = path.join(PUBLIC_DIR, "models");

const budgets = {
  publicBytes: 28 * MEBIBYTE,
  modelBytes: 16 * MEBIBYTE,
  singleModelBytes: 4 * MEBIBYTE,
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

console.log(`Public assets: ${formatBytes(publicBytes)} / ${formatBytes(budgets.publicBytes)}`);
console.log(`3D models: ${formatBytes(modelBytes)} / ${formatBytes(budgets.modelBytes)}`);

if (failures.length > 0) {
  console.error("\nPerformance budget failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Performance budgets passed.");
