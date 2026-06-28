// Post-build patch: injects Cloudflare Worker env bindings into process.env
// so that server functions can read process.env.GROQ_API_KEY etc. at runtime.
const fs = require("fs");
const path = require("path");

const serverFile = path.join(__dirname, "..", "dist", "server", "server.js");

if (!fs.existsSync(serverFile)) {
  console.error("patch-cf: dist/server/server.js not found — run npm run build first");
  process.exit(1);
}

let content = fs.readFileSync(serverFile, "utf-8");

const MARKER = "// __cf_env_patched__";
if (content.includes(MARKER)) {
  console.log("patch-cf: already patched, skipping");
  process.exit(0);
}

// Inject Object.assign(process.env, env) at the start of the fetch handler
const original = "var server_default = { async fetch(request, env, ctx) {\n\ttry {";
const patched =
  "var server_default = { async fetch(request, env, ctx) {\n\t" +
  MARKER +
  "\n\tObject.assign(process.env, env);\n\ttry {";

if (!content.includes(original)) {
  console.error("patch-cf: could not find fetch handler — build output may have changed");
  process.exit(1);
}

content = content.replace(original, patched);
fs.writeFileSync(serverFile, content, "utf-8");
console.log("patch-cf: successfully patched dist/server/server.js");
