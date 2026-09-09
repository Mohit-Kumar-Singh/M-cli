// Build stamp — values are frozen into the bundle by vite.config.ts.
export const APP_VERSION = __APP_VERSION__;
export const GIT_SHA = __GIT_SHA__;
export const BUILD_TIME = __BUILD_TIME__;

/** e.g. "v0.3.0" */
export const versionShort = `v${APP_VERSION}`;

/** e.g. "v0.3.0 · a1b2c3d · built 9 Sep 2026" */
export const versionLong = `${versionShort} · ${GIT_SHA} · built ${new Date(
  BUILD_TIME,
).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
