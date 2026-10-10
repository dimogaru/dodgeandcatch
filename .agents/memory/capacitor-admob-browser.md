---
name: AdMob in the browser game
description: Loading @capacitor-community/admob in this unbundled Express-served web app.
---

The package's raw ESM entry is not directly browser-loadable here: its generated ESM uses extensionless internal imports, which browsers reject without a bundler. A static import failure prevented the entire game script from executing, including all button listeners.

**Why:** This project serves a single HTML game directly from Express and has no frontend bundler.

**How to apply:** If the game remains unbundled, use the package's browser-ready UMD distribution and serve it with the required Capacitor core bundle. If adding a build pipeline, bundle the package and import the built asset instead.
