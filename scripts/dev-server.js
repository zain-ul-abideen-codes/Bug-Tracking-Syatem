const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const mongoDbPath = "D:\\mongodb-data";
const mongoExe = "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe";
const serverEntry = path.join(projectRoot, "server", "src", "server.js");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPortOpen = (port, host = "127.0.0.1") =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
  });

const waitForPort = async (port, attempts = 20) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await isPortOpen(port)) {
      return true;
    }
    await wait(1000);
  }
  return false;
};

const ensureMongoDir = () => {
  if (!fs.existsSync(mongoDbPath)) {
    fs.mkdirSync(mongoDbPath, { recursive: true });
  }
};

const startMongo = async () => {
  if (await isPortOpen(27017)) {
    process.stdout.write("MongoDB already running on 127.0.0.1:27017\n");
    return null;
  }

  if (!fs.existsSync(mongoExe)) {
    throw new Error(`MongoDB executable not found at ${mongoExe}`);
  }

  ensureMongoDir();

  process.stdout.write("Starting MongoDB for local development...\n");
  const mongoProcess = spawn(
    mongoExe,
    ["--dbpath", mongoDbPath, "--bind_ip", "127.0.0.1", "--port", "27017"],
    {
      cwd: mongoDbPath,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: false,
    },
  );

  mongoProcess.stdout.on("data", (chunk) => {
    const text = String(chunk);
    if (/Waiting for connections|mongod startup complete/i.test(text)) {
      process.stdout.write("MongoDB started successfully.\n");
    }
  });

  mongoProcess.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });

  mongoProcess.on("exit", (code) => {
    if (code !== null && code !== 0) {
      process.stderr.write(`MongoDB process exited with code ${code}\n`);
    }
  });

  const ready = await waitForPort(27017, 25);
  if (!ready) {
    throw new Error("MongoDB did not become ready on port 27017.");
  }

  return mongoProcess;
};

const startServer = () => {
  process.stdout.write("Starting backend server...\n");
  const serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: false,
  });

  serverProcess.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  return serverProcess;
};

const main = async () => {
  try {
    const mongoProcess = await startMongo();
    const serverProcess = startServer();

    const cleanup = () => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill();
      }
      if (mongoProcess && !mongoProcess.killed) {
        mongoProcess.kill();
      }
    };

    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
};

main();
