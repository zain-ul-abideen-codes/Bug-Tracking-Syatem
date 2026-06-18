const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const removablePaths = [
  "client/dist",
  "server/backups/latest",
  "dev-run.err.log",
  "dev-run.log",
  "dev-run2.err.log",
  "dev-run2.log",
  "dev-run3.err.log",
  "dev-run3.log",
  "dev-run4.err.log",
  "dev-run4.log",
  "dev-run5.err.log",
  "dev-run5.log",
  "dev-run-final.err.log",
  "dev-run-final.log",
  "mongo-run.err.log",
  "mongo-run.log",
  "server-run.err.log",
  "server-run.log",
];

let removedCount = 0;

for (const relativePath of removablePaths) {
  const targetPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(targetPath)) {
    continue;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  removedCount += 1;
  console.log(`[clean-generated] Removed ${relativePath}`);
}

if (removedCount === 0) {
  console.log("[clean-generated] No generated artifacts were found.");
} else {
  console.log(`[clean-generated] Cleanup finished. Removed ${removedCount} generated path(s).`);
}
