// Files under public/ are served relative to the app's path prefix: when ROOT_URL
// ends in /KdD, Meteor strips that leading /KdD from every request before
// looking in public/, so a hardcoded src="/KdD/plot.png" resolves to
// public/plot.png and 404s. Prepend the runtime prefix (empty when the app is
// served from the host root, e.g. local `meteor` on :3000).
export default function assetUrl(path) {
  const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
  return `${prefix}${path}`;
}
