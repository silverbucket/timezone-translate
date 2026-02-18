import esbuild from "esbuild";
import fs from "fs";
import path from "path";

const isDev = process.argv.includes("--dev");

const commonOptions = {
  bundle: true,
  minify: !isDev,
  sourcemap: isDev ? "inline" : false,
};

async function build() {
  // Content scripts must be IIFE (can't use ESM at runtime)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ["src/content/content.js"],
    outfile: "dist/content.js",
    format: "iife",
    globalName: "TimezoneTranslator",
  });

  // Service worker declared as "type": "module" in manifest
  await esbuild.build({
    ...commonOptions,
    entryPoints: ["src/background/service-worker.js"],
    outfile: "dist/service-worker.js",
    format: "esm",
    platform: "browser",
  });

  // Copy manifest.json
  fs.copyFileSync("manifest.json", "dist/manifest.json");

  // Copy icons/
  const iconsDir = "icons";
  const distIconsDir = "dist/icons";
  if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });
  for (const file of fs.readdirSync(iconsDir)) {
    fs.copyFileSync(path.join(iconsDir, file), path.join(distIconsDir, file));
  }

  console.log(`Build complete (${isDev ? "dev" : "production"})`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
