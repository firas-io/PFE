const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = levels[process.env.LOG_LEVEL] ?? levels.info;

function log(level, msg, meta) {
  if (levels[level] > current) return;
  const line = meta ? `[${level.toUpperCase()}] ${msg} ${JSON.stringify(meta)}` : `[${level.toUpperCase()}] ${msg}`;
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  error: (meta, msg) => log("error", msg ?? meta, typeof meta === "object" ? meta : undefined),
  warn:  (meta, msg) => log("warn",  msg ?? meta, typeof meta === "object" ? meta : undefined),
  info:  (meta, msg) => log("info",  msg ?? meta, typeof meta === "object" ? meta : undefined),
  debug: (meta, msg) => log("debug", msg ?? meta, typeof meta === "object" ? meta : undefined),
};

export default logger;
