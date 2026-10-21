import * as packageService from "./package.service.js";

export function plans(req, res) {
  res.json({ plans: packageService.listPlans() });
}

export async function mine(req, res) {
  res.json(await packageService.getMyPackages(req.user.id));
}

export async function purchase(req, res) {
  const { package: pkg, replayed } = await packageService.purchasePackage(
    req.user.id,
    req.body,
    req.idempotencyKey
  );
  if (replayed) res.set("Idempotent-Replayed", "true");
  res.status(replayed ? 200 : 201).json({ package: pkg, replayed });
}