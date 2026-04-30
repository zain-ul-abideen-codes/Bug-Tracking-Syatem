const write = (level, message, meta = {}) => {
  const payload = {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  };

  const line = `${JSON.stringify(payload)}\n`;
  if (level === "error" || level === "warn") {
    process.stderr.write(line);
    return;
  }

  process.stdout.write(line);
};

module.exports = {
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
  debug(message, meta) {
    write("debug", message, meta);
  },
};
