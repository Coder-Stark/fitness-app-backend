export function getServerTime(req, res) {
  const now = new Date();
  res.set("Cache-Control", "no-store");
  res.json({ serverTime: now.toISOString(), epochMs: now.getTime() });
}