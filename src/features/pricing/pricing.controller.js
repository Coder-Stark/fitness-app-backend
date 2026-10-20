import { calculatePrice } from "./pricing.service.js";

export function getQuote(req, res) {
  const slotStart = new Date(req.body.slotStart);
  const price = calculatePrice(slotStart);

  res.json({ quote: { slotStart: slotStart.toISOString(), ...price } });
}