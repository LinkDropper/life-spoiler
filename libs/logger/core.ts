import type { LogLevel, LogContext, LogEntry, Logger } from "./types";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const RESET_COLOR = "\x1b[0m";

const SENSITIVE_KEYS = ["password", "token", "secret", "authorization", "key"];

const CONSOLE_METHODS: Record<LogLevel, typeof console.log> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

const getMinLogLevel = (): LogLevel =>
  process.env.NODE_ENV === "production" ? "info" : "debug";

const shouldLog = (level: LogLevel): boolean =>
  LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[getMinLogLevel()];

const formatTimestamp = (): string => new Date().toISOString();

const sanitizeContext = (context?: LogContext): LogContext | undefined => {
  if (!context) return undefined;

  return Object.entries(context).reduce<LogContext>((acc, [key, value]) => {
    const isSensitive = SENSITIVE_KEYS.some((sk) =>
      key.toLowerCase().includes(sk)
    );
    acc[key] = isSensitive ? "[REDACTED]" : value;
    return acc;
  }, {});
};

const formatLogEntry = (entry: LogEntry, useColor: boolean): string => {
  const { level, message, timestamp, context, error } = entry;
  const color = useColor ? LOG_LEVEL_COLORS[level] : "";
  const reset = useColor ? RESET_COLOR : "";

  const levelStr = `${color}[${level.toUpperCase()}]${reset}`;
  const timeStr = `[${timestamp}]`;
  const sourceStr = context?.source ? ` (${context.source})` : "";

  let output = `${timeStr} ${levelStr}${sourceStr} ${message}`;

  if (context) {
    const { source: _source, ...rest } = context;
    if (Object.keys(rest).length > 0) {
      try {
        output += `\n  Context: ${JSON.stringify(rest)}`;
      } catch {
        output += `\n  Context: [Unserializable context]`;
      }
    }
  }

  if (error) {
    output += `\n  Error: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }

  return output;
};

export const createLogger = (defaultContext?: LogContext): Logger => {
  const isServer = typeof window === "undefined";
  const useColor = isServer;

  const log = (
    level: LogLevel,
    message: string,
    error?: Error,
    context?: LogContext
  ) => {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: formatTimestamp(),
      context: sanitizeContext({ ...defaultContext, ...context }),
      error,
    };

    CONSOLE_METHODS[level](formatLogEntry(entry, useColor));
  };

  return {
    debug: (message, context) => log("debug", message, undefined, context),
    info: (message, context) => log("info", message, undefined, context),
    warn: (message, context) => log("warn", message, undefined, context),
    error: (message, error, context) => log("error", message, error, context),
  };
};

export const logger = createLogger();
