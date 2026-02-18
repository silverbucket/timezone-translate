# Release Process

## Overview

Pushing a version tag triggers a GitHub Actions workflow that:
1. Runs the test suite
2. Builds and zips the extension
3. Creates a GitHub Release with both zips attached as download assets

The release zip files can then be submitted to the browser extension stores.

---

## Step-by-step

### 1. Bump the version

Update `"version"` in `package.json`. The tag you push must match this value exactly (minus the `v` prefix) — the workflow will fail if they differ.

```bash
# package.json
"version": "1.2.0"
```

> `manifest.json` does **not** need to be edited manually — the build script reads
> the version from `package.json` and writes it into `dist/manifest.json` automatically.

### 2. Run tests locally

```bash
npm install
node test/index.js
```

### 3. Commit the version bump

```bash
git add package.json
git commit -m "chore: release v1.2.0"
```

### 4. Tag and push

```bash
git tag v1.2.0
git push origin master --tags
```

### 5. GitHub Actions takes over

The `release.yml` workflow fires automatically on the new tag. It will:
- Install dependencies (`npm ci`)
- Run the test suite (fails fast if any test breaks)
- Run `npm run bundle` to produce:
  - `timezone-translate-1.2.0.zip` — the built extension
  - `timezone-translate-1.2.0-sources.zip` — source code for Firefox AMO review
- Verify the tag matches `package.json` version
- Create a GitHub Release at `https://github.com/silverbucket/timezone-translate/releases`
  with both zips as downloadable assets and auto-generated release notes

### 6. Submit to browser stores (manual)

Download the release assets from the GitHub Release page, then submit:

**Chrome Web Store**
- URL: https://chrome.google.com/webstore/devconsole
- Upload: `timezone-translate-{version}.zip`

**Firefox Add-ons (AMO)**
- URL: https://addons.mozilla.org/developers/
- Upload: `timezone-translate-{version}.zip`
- Source code: attach `timezone-translate-{version}-sources.zip`
  (required by Mozilla because we use a bundler — their reviewers
  use it to verify the built code matches the source)

---

## Hotfix releases

Same process. Branch off the tag if needed, fix, then tag a patch version:

```bash
git checkout v1.2.0
git checkout -b hotfix/v1.2.1
# ... make fix ...
git commit -m "fix: ..."
git checkout master
git merge hotfix/v1.2.1
git tag v1.2.1
git push origin master --tags
```

---

## Local bundle (without publishing)

To produce the zips locally without creating a GitHub release:

```bash
npm run bundle
# → releases/timezone-translate-{version}.zip
# → releases/timezone-translate-{version}-sources.zip
```
