const fs = require("fs");
const net = require("net");
const path = require("path");
const { execSync, spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const mongoDbPath = "D:\\mongodb-data";
const mongoExe = "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe";
const serverEntry = path.join(projectRoot, "server", "src", "server.js");
const childProcesses = [];

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

const isFrontendPortOpen = async (port) => {
  const checks = await Promise.allSettled([
    isPortOpen(port, "127.0.0.1"),
    isPortOpen(port, "::1"),
  ]);

  return checks.some((result) => result.status === "fulfilled" && result.value);
};

const waitForPort = async (port, attempts = 25) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await isPortOpen(port)) {
      return true;
    }
    await wait(1000);
  }
  return false;
};

const prefixOutput = (stream, prefix, targetStream = process.stdout) => {
  if (!stream) {
    return;
  }

  stream.on("data", (chunk) => {
    const text = String(chunk)
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => `[${prefix}] ${line}`)
      .join("\n");

    if (text) {
      targetStream.write(`${text}\n`);
    }
  });
};

const spawnProcess = (command, args) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    windowsHide: false,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  childProcesses.push(child);
  return child;
};

const cleanup = () => {
  childProcesses.forEach((child) => {
    if (child && !child.killed) {
      child.kill();
    }
  });
};

const getWindowsListeningPids = (port) => {
  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();

    return [...new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => /\sLISTENING\s/i.test(line))
        .map((line) => line.split(/\s+/).pop())
        .filter(Boolean),
    )];
  } catch (_error) {
    return [];
  }
};

const killStaleProjectProcesses = () => {
  if (process.platform !== "win32") {
    return;
  }

  const escapedRoot = projectRoot.replace(/\\/g, "\\\\");
  const escapedVitePath = path
    .join(projectRoot, "client", "node_modules", "vite", "bin", "vite.js")
    .replace(/\\/g, "\\\\");
  const escapedRunDevPath = path.join(projectRoot, "scripts", "run-dev.js").replace(/\\/g, "\\\\");
  const escapedServerPath = path.join(projectRoot, "server", "src", "server.js").replace(/\\/g, "\\\\");
  const currentPid = process.pid;
  const command = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    `$currentPid = ${currentPid}`,
    `$root = '${escapedRoot}'`,
    `$vitePath = '${escapedVitePath}'`,
    `$runDevPath = '${escapedRunDevPath}'`,
    `$serverPath = '${escapedServerPath}'`,
    "Get-CimInstance Win32_Process | Where-Object {",
    "  $_.ProcessId -ne $currentPid -and",
    "  ($_.Name -eq 'node.exe' -or $_.Name -eq 'cmd.exe') -and",
    "  $_.CommandLine -and",
    "  (",
    "    $_.CommandLine -like \"*$root*\" -or",
    "    $_.CommandLine -like \"*$vitePath*\" -or",
    "    $_.CommandLine -like \"*$runDevPath*\" -or",
    "    $_.CommandLine -like \"*$serverPath*\" -or",
    "    $_.CommandLine -like '*npm run dev --prefix client*'",
    "  )",
    "} | ForEach-Object {",
    "  try {",
    "    Stop-Process -Id $_.ProcessId -Force",
    "    Write-Output (\"[dev] Cleared stale project process {0} (PID {1})\" -f $_.Name, $_.ProcessId)",
    "  } catch {}",
    "}",
  ].join("; ");

  try {
    const output = execSync(`powershell -NoProfile -Command "${command}"`, {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();

    if (output.trim()) {
      process.stdout.write(`${output.trim()}\n`);
    }
  } catch (_error) {
    // Ignore cleanup errors and continue with normal startup.
  }
};

const getProcessImageName = (pid) => {
  try {
    const output = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();

    if (!output || output.startsWith("INFO:")) {
      return "";
    }

    return output.split(",")[0].replace(/^"|"$/g, "").toLowerCase();
  } catch (_error) {
    return "";
  }
};

const killProcessesOnPort = async (port) => {
  const pids = getWindowsListeningPids(port);

  for (const pid of pids) {
    const imageName = getProcessImageName(pid);

    try {
      execSync(`taskkill /PID ${pid} /F`, {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
      });
      process.stdout.write(`[dev] Cleared stale ${imageName || "process"} on port ${port} (PID ${pid})\n`);
    } catch (_error) {
      process.stderr.write(`[dev] Failed to clear process on port ${port} (PID ${pid})\n`);
    }
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (!(await isPortOpen(port))) {
      return;
    }
    await wait(300);
  }
};

const ensureMongoDir = () => {
  if (!fs.existsSync(mongoDbPath)) {
    fs.mkdirSync(mongoDbPath, { recursive: true });
  }
};

const startMongo = async () => {
  if (await isPortOpen(27017)) {
    process.stdout.write("[mongo] MongoDB already running on 127.0.0.1:27017\n");
    return null;
  }

  if (!fs.existsSync(mongoExe)) {
    throw new Error(`MongoDB executable not found at ${mongoExe}`);
  }

  ensureMongoDir();

  process.stdout.write("[mongo] Starting MongoDB for local development...\n");
  const mongoProcess = spawnProcess(mongoExe, ["--dbpath", mongoDbPath, "--bind_ip", "127.0.0.1", "--port", "27017"]);
  prefixOutput(mongoProcess.stdout, "mongo");
  prefixOutput(mongoProcess.stderr, "mongo", process.stderr);

  const ready = await waitForPort(27017);
  if (!ready) {
    throw new Error("MongoDB did not become ready on port 27017.");
  }

  process.stdout.write("[mongo] MongoDB ready on 127.0.0.1:27017\n");
  return mongoProcess;
};

const startBackend = () => {
  process.stdout.write("[server] Starting backend server...\n");
  const backendProcess = spawnProcess(process.execPath, [serverEntry]);
  prefixOutput(backendProcess.stdout, "server");
  prefixOutput(backendProcess.stderr, "server", process.stderr);
  return backendProcess;
};

const startFrontend = async () => {
  if (await isFrontendPortOpen(5173)) {
    process.stdout.write("[client] Frontend already running on port 5173. Reusing existing dev server.\n");
    return null;
  }

  process.stdout.write("[client] Starting frontend dev server on port 5173...\n");
  const clientProcess =
    process.platform === "win32"
      ? spawnProcess("cmd.exe", ["/d", "/s", "/c", "npm run dev --prefix client -- --port 5173 --strictPort"])
      : spawnProcess("npm", ["run", "dev", "--prefix", "client", "--", "--port", "5173", "--strictPort"]);
  prefixOutput(clientProcess.stdout, "client");
  prefixOutput(clientProcess.stderr, "client", process.stderr);
  return clientProcess;
};

const main = async () => {
  try {
    if (process.platform === "win32") {
      killStaleProjectProcesses();
      for (const port of [5000, 5173, 5174, 5175]) {
        // Ensure stale listeners from previous local dev runs are gone before startup.
        await killProcessesOnPort(port);
      }
    }

    const mongoProcess = await startMongo();
    const backendProcess = startBackend();
    const backendReady = await waitForPort(5000, 30);

    if (!backendReady) {
      throw new Error("Backend server did not become ready on port 5000.");
    }

    process.stdout.write("[server] Backend ready on http://127.0.0.1:5000\n");

    let clientProcess = await startFrontend();
    let clientRestarted = false;

    backendProcess.on("exit", (code) => {
      process.stderr.write(`[server] exited with code ${code ?? 0}\n`);
      cleanup();
      process.exit(code ?? 0);
    });

    const attachClientExitHandler = () => {
      if (!clientProcess) {
        return;
      }

      clientProcess.on("exit", async (code) => {
        if (code !== 0 && !clientRestarted && process.platform === "win32") {
          clientRestarted = true;
          process.stderr.write("[client] Startup failed once. Retrying after clearing frontend ports...\n");
          for (const port of [5173, 5174, 5175]) {
            await killProcessesOnPort(port);
          }
          clientProcess = await startFrontend();
          attachClientExitHandler();
          return;
        }

        process.stderr.write(`[client] exited with code ${code ?? 0}\n`);
        cleanup();
        process.exit(code ?? 0);
      });
    };

    attachClientExitHandler();

    process.stdout.write("[dev] Backend URL:  http://localhost:5000\n");
    process.stdout.write("[dev] Frontend URL: http://localhost:5173\n");
    process.stdout.write("[dev] Open the app in your browser at http://localhost:5173\n");

    if (mongoProcess) {
      mongoProcess.on("exit", (code) => {
        process.stderr.write(`[mongo] exited with code ${code ?? 0}\n`);
        cleanup();
        process.exit(code ?? 0);
      });
    }

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
