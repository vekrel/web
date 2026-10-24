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
- Accounts: the upstream hosted auth provider is replaced by Vekrel accounts on the relay (`@vekrel/client-runtime/account-auth`, client `vekrel-web`). Sign-in sends the tab to `<relay>/oauth/authorize` (PKCE) and comes back on `/auth/callback`; the access token stays in memory and the refresh token is the relay's HttpOnly cookie, so the web app and the relay must be same-site: `VITE_VEKREL_RELAY_URL=https://relay.<domain>` enables sign-in on `https://<domain>` and its subdomains only, and a loopback relay (`http://localhost:<port>`) on the same loopback host only. The relay's `WEB_ORIGINS` must list the app origin. Unset relay URL: no cloud UI. Sign-in/out in one tab wakes the others (BroadcastChannel). The desktop shell has no cloud sign-in until Desktop wires its deep link. The hosted `/connect` hop for the CLI is gone (the CLI authorizes at the relay). The account dialog (sidebar avatar) shows the email, sign out, and the Vekrel Connect and mobile client pages.
- Local sign-in check: relay with `MAGIC_LINK_TRANSPORT=log RELAY_ORIGIN=http://localhost:<relay port> WEB_ORIGINS=http://localhost:<web port>`, then `VITE_VEKREL_RELAY_URL=http://localhost:<relay port> VITE_HOSTED_APP_URL=http://localhost:<web port> vp dev --port <web port>` in `apps/web`. Relay machine calls stay https-only, so the machine list shows "Relay URL must be a secure absolute HTTPS origin" against a local relay.
- Test: `bundledDev.test.ts` fails (`rolldown/experimental/runtime` not exported by the hoisted rolldown rc.17); the browser project needs `pnpm exec playwright install chromium`.
- Removed `patchedDependencies` entries (and patch files) for packages not installed here:
  - react-native-image-viewing@0.2.2
  - alchemy@2.0.0-beta.80
  - expo-audio@58.0.9
  - expo-network@58.0.3
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
