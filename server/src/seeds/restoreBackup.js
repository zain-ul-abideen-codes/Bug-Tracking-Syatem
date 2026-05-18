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
const requestedSnapshot = process.argv[2] || "latest";
const snapshotDir = path.join(backupRoot, requestedSnapshot);

const collections = [
  { key: "agent_conversations", model: AgentConversation },
  { key: "audit_logs", model: AuditLog },
  { key: "bugs", model: Bug },
  { key: "projects", model: Project },
  { key: "users", model: User },
];

const readJson = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const restoreBackup = async () => {
  try {
    if (!fs.existsSync(snapshotDir)) {
      throw new Error(`Backup snapshot not found: ${requestedSnapshot}`);
    }

    await connectDB(env.mongoUri);

    for (const { model } of collections) {
      await model.deleteMany({});
    }

    const restoreOrder = [...collections].reverse();

    for (const { key, model } of restoreOrder) {
      const records = readJson(path.join(snapshotDir, `${key}.json`));
      if (records.length) {
        await model.collection.insertMany(records, { ordered: false });
      }
    }

    console.log(`Backup restored successfully from server/backups/${requestedSnapshot}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to restore backup:", error.message);
    process.exit(1);
  }
};

restoreBackup();
