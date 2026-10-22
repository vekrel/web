<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/brand/logo-horizontal-on-dark.png">
    <img src=".github/brand/logo-horizontal-on-light.png" alt="Vekrel" width="360">
  </picture>
</p>

# Vekrel-Web
The browser client for Vekrel (also wrapped by the desktop app). Highly inspired by T3 Code (MIT, see NOTICE).

`packages/` is a git subtree of Vekrel-Shared's `packages/` (split with `git subtree split --prefix=packages`; see Vekrel-Engine's README for the pull commands).

## Deviations from upstream 8d3b061
- Root package name is `@vekrel/web-root`; web package is `@vekrel/web`. The upstream npm scope, env prefix and product name are replaced by `@vekrel/`, `VEKREL_` and `Vekrel`.
- `<title>` is `Vekrel`; manifest theme/background colour is `#111111`.
- Web icons (`apps/web/public/favicon*.png`, `favicon.ico`, `apple-touch-icon.png`) are generated from `brand/favicon.svg` (white mark on `#111111`) with `sharp`, not with `scripts/export-brand-icons.ts` (that script needs the macOS Icon Composer `.icon` assets under `assets/`, which are not copied). The ICO holds 16/24/32/48/64 PNG entries.
- `pnpm-lock.yaml` is upstream's, with the scope renamed, then reconciled by `pnpm install`. A fresh resolve pulled newer @tanstack/router and broke `tsc`.
- `apps/web/vite.config.ts`: the third-party-licenses plugin no longer reads `apps/server` and `apps/desktop` manifests (those apps live in other repos), so the web notices cover web dependencies only.
- Files copied only so the licenses plugin and tests find their inputs: `apps/server/src/device/deviceToolVersions.json`, `native/libghostty-vt/{LICENSE,VERSION,include/}`, `apps/mobile/modules/{t3-composer-editor,t3-source-text}/LICENSE`, `third-party-licenses.config.json`.
- `scripts` and `infra/*` are not workspace members (scripts' typecheck references app files); `scripts/` kept on disk. Root `start` runs `vp run --filter @vekrel/web preview`.
- `apps/web` has no `typecheck` package script; run `pnpm --filter @vekrel/web exec vp run typecheck`.
- Test: `bundledDev.test.ts` fails (`rolldown/experimental/runtime` not exported by the hoisted rolldown rc.17); the browser project needs `pnpm exec playwright install chromium`.
- Removed `patchedDependencies` entries (and patch files) for packages not installed here:
  - react-native-image-viewing@0.2.2
  - alchemy@2.0.0-beta.80
  - expo-audio@58.0.9
  - expo-network@58.0.3
  - "@clerk/expo-native-components@0.2.0"
  - "@expo/metro-config@58.0.14"
  - expo-sharing@58.0.19
  - expo-widgets@58.0.20
  - "@react-native-ai/apple@0.12.0"
  - "@react-native-menu/menu@2.0.0"
  - "@react-navigation/native-stack@7.21.0"
  - dbus-next@0.10.2
  - react-native-gesture-handler@3.3.0
  - react-native-reanimated@4.7.1
  - react-native-keyboard-controller@1.22.7
  - react-native-pdf-jsi@5.0.0
  - react-native-webview@14.0.1
  - "@expo/ui@58.0.20"
  - expo-modules-core@58.0.22 (and the unreferenced 57.0.14)
  - "@expo/fingerprint@0.21.5"
  - app-builder-lib@26.16.1
  - expo-notifications@57.0.15 (unreferenced file)
  - "@ff-labs/fff-node@0.11.0" (server-only)
  - node-pty@1.2.0-beta.15 (server-only)

## Serving
The engine serves `apps/web/dist` from its own repo root (`apps/web/dist` next to `apps/server`); copy this repo's `apps/web/dist` there.
