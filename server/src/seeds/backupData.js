const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const env = require("../config/env");
const User = require("../models/User");
const Project = require("../models/Project");
const Bug = require("../models/Bug");
const AuditLog = require("../models/AuditLog");
const AgentConversation = require("../models/AgentConversation");

const backupRoot = path.resolve(__dirname, "..", "..", "backups");
const latestDir = path.join(backupRoot, "latest");
const keepSnapshots = 10;

const collections = [
  { key: "users", model: User },
  { key: "projects", model: Project },
  { key: "bugs", model: Bug },
  { key: "audit_logs", model: AuditLog },
  { key: "agent_conversations", model: AgentConversation },
];

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
};

const pruneOldSnapshots = () => {
  const snapshotDirs = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "latest")
    .map((entry) => entry.name)
    .sort()
    .reverse();

  snapshotDirs.slice(keepSnapshots).forEach((directoryName) => {
    fs.rmSync(path.join(backupRoot, directoryName), { recursive: true, force: true });
  });
};

const backupData = async () => {
  try {
    await connectDB(env.mongoUri);

    const payload = {};
    const counts = {};

    for (const { key, model } of collections) {
      const records = await model.find({}).lean();
      payload[key] = records;
      counts[key] = records.length;
    }

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (totalRecords === 0) {
      console.log("No database records found. Backup skipped.");
      process.exit(0);
    }

    ensureDir(backupRoot);

    const snapshotName = timestamp();
    const snapshotDir = path.join(backupRoot, snapshotName);
    ensureDir(snapshotDir);

    for (const [key, records] of Object.entries(payload)) {
      writeJson(path.join(snapshotDir, `${key}.json`), records);
    }

    writeJson(path.join(snapshotDir, "metadata.json"), {
      createdAt: new Date().toISOString(),
      mongoUri: env.mongoUri,
      counts,
    });

    fs.rmSync(latestDir, { recursive: true, force: true });
    fs.cpSync(snapshotDir, latestDir, { recursive: true });
    pruneOldSnapshots();

    console.log(`Backup created successfully at server/backups/${snapshotName}`);
    console.log(`Latest restore point updated at server/backups/latest`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to create backup:", error.message);
    process.exit(1);
  }
};

backupData();
