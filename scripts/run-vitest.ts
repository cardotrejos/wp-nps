import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const nodeOptions = process.env.NODE_OPTIONS ?? "";
const tokenRegex = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\\S+/g;
const tokens = nodeOptions.match(tokenRegex) ?? [];
const sanitizedTokens: string[] = [];

const unquote = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

for (let i = 0; i < tokens.length; i += 1) {
  const token = tokens[i];
  const unquoted = unquote(token);

  if (unquoted === "--localstorage-file") {
    i += 1;
    continue;
  }
  if (unquoted.startsWith("--localstorage-file=")) {
    continue;
  }

  sanitizedTokens.push(token);
}

const env = { ...process.env };
const localStorageOption = "--localstorage-file=/tmp/node-localstorage";
if (sanitizedTokens.length > 0) {
  env.NODE_OPTIONS = `${sanitizedTokens.join(" ")} ${localStorageOption}`.trim();
} else {
  env.NODE_OPTIONS = localStorageOption;
}

const child = spawn("vitest", args, {
  stdio: "inherit",
  env,
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
