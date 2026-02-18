import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const isDev    = process.argv.includes("--dev");
const isBundle = process.argv.includes("--bundle");

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

  // Copy manifest.json, syncing version from package.json
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  manifest.version = pkg.version;
  fs.writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 2));

  // Copy icons/
  const iconsDir = "icons";
  const distIconsDir = "dist/icons";
  if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });
  for (const file of fs.readdirSync(iconsDir)) {
    fs.copyFileSync(path.join(iconsDir, file), path.join(distIconsDir, file));
  }

  console.log(`Build complete (${isDev ? "dev" : "production"})`);
}

async function bundle() {
  const { version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const releasesDir = "releases";
  if (!fs.existsSync(releasesDir)) fs.mkdirSync(releasesDir);

  // 1. Extension zip — upload this to Chrome Web Store and Firefox AMO
  const extZip = path.join(releasesDir, `timezone-translate-${version}.zip`);
  execSync(`cd dist && zip -r ../${extZip} .`);
  console.log(`Extension zip : ${extZip}`);

  // 2. Source zip — required by Firefox AMO when a bundler is used,
  //    so Mozilla reviewers can verify the built code matches the source.
  const srcZip = path.join(releasesDir, `timezone-translate-${version}-sources.zip`);
  execSync(
    `zip -r ${srcZip} src/ test/ icons/ manifest.json package.json package-lock.json build.js README.md LICENSE --exclude "*.DS_Store"`
  );
  console.log(`Source zip    : ${srcZip}`);
  console.log(`\nPublishing:`);
  console.log(`  Chrome Web Store  → upload ${extZip}`);
  console.log(`    https://chrome.google.com/webstore/devconsole`);
  console.log(`  Firefox AMO       → upload ${extZip}, attach ${srcZip} as source`);
  console.log(`    https://addons.mozilla.org/developers/`);
}

build()
  .then(() => isBundle && bundle())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
