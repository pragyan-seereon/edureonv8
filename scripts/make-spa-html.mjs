// Postbuild: emit dist/client/index.html for pure-SPA static hosting
// (Vercel, Netlify, any static host). TanStack Start's prerender path
// isn't used here — this app is UI-only and hydrates entirely on the client.
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = resolve(__dirname, "..", "dist", "client");
const manifestPath = resolve(clientDir, ".vite", "manifest.json");

if (!existsSync(manifestPath)) {
  console.error(`[make-spa-html] manifest not found at ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entry = Object.values(manifest).find((v) => v && v.isEntry);
if (!entry) {
  console.error("[make-spa-html] no isEntry chunk found in Vite manifest");
  process.exit(1);
}

const cssHrefs = new Set();
for (const asset of entry.css ?? []) cssHrefs.add(asset);
for (const asset of entry.assets ?? []) {
  if (asset.endsWith(".css")) cssHrefs.add(asset);
}
for (const key in manifest) {
  if (key.endsWith(".css") || (manifest[key].file || "").endsWith(".css")) {
    cssHrefs.add(manifest[key].file);
  }
}

const preloadJs = new Set([entry.file]);
for (const imp of entry.imports ?? []) {
  const rec = manifest[imp];
  if (rec?.file) preloadJs.add(rec.file);
}

const cssTags = [...cssHrefs]
  .map((href) => `    <link rel="stylesheet" href="/${href}">`)
  .join("\n");

const preloadTags = [...preloadJs]
  .filter((f) => f !== entry.file)
  .map((f) => `    <link rel="modulepreload" href="/${f}">`)
  .join("\n");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Edureon ERP — Enterprise School Management</title>
    <meta name="description" content="Enterprise-grade multi-tenant ERP for CBSE schools and institutes." />
    <meta property="og:title" content="Edureon ERP — Enterprise School Management" />
    <meta property="og:description" content="Enterprise-grade multi-tenant ERP for CBSE schools and institutes." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" />
${cssTags}
${preloadTags}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${entry.file}"></script>
  </body>
</html>
`;

writeFileSync(resolve(clientDir, "index.html"), html);
console.log(`[make-spa-html] wrote dist/client/index.html (entry: ${entry.file})`);

// Clean up the Cloudflare Worker server bundle — this app is UI-only and
// deploys as static files. Keeping dist/server around is misleading.
const serverDir = resolve(__dirname, "..", "dist", "server");
if (existsSync(serverDir)) {
  rmSync(serverDir, { recursive: true, force: true });
  console.log("[make-spa-html] removed dist/server (not used for static deploys)");
}
