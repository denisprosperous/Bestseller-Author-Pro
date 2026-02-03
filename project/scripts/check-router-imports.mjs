import { readFileSync } from "node:fs";
import { globSync } from "glob";

const repoRoot = new URL("..", import.meta.url);
const projectRootPath = decodeURIComponent(repoRoot.pathname).replace(/\/$/, "");

const files = globSync("app/**/*.{ts,tsx}", {
  cwd: projectRootPath,
  nodir: true,
  absolute: true,
  ignore: ["**/*.d.ts"]
});

const forbidden = [
  { name: "json from react-router", re: /import\s*\{[^}]*\bjson\b[^}]*\}\s*from\s*["']react-router["']/ },
  { name: "redirect from react-router", re: /import\s*\{[^}]*\bredirect\b[^}]*\}\s*from\s*["']react-router["']/ },
  { name: "json from @react-router/node", re: /import\s*\{[^}]*\bjson\b[^}]*\}\s*from\s*["']@react-router\/node["']/ },
  { name: "redirect from @react-router/node", re: /import\s*\{[^}]*\bredirect\b[^}]*\}\s*from\s*["']@react-router\/node["']/ }
];

const matches = [];

for (const filePath of files) {
  const src = readFileSync(filePath, "utf8");
  for (const rule of forbidden) {
    if (rule.re.test(src)) {
      matches.push({ filePath, rule: rule.name });
    }
  }
}

if (matches.length) {
  for (const m of matches) {
    process.stderr.write(`${m.rule}: ${m.filePath}\n`);
  }
  process.exit(1);
}

process.stdout.write("router import check: ok\n");
