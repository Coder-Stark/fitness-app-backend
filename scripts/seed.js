import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/shared/config/db.js";
import { User } from "../src/features/users/user.model.js";
import { ROLES } from "../src/features/users/user.constants.js";
import { Zone } from "../src/features/zones/zone.model.js";
import { Trainer } from "../src/features/trainers/trainer.model.js";

const DEMO_PASSWORD = "Demo@1234";

const zoneData = [
  { name: "Sunrise Heights, Dwarka", center: { lat: 28.5921, lng: 77.046 }, radiusKm: 3 },
  { name: "Green Meadows, Noida", center: { lat: 28.5355, lng: 77.391 }, radiusKm: 3 },
  { name: "Palm Residency, Gurugram", center: { lat: 28.4595, lng: 77.0266 }, radiusKm: 3 },
];

const near = (center, dLat, dLng) => ({
  lat: +(center.lat + dLat).toFixed(5),
  lng: +(center.lng + dLng).toFixed(5),
});

async function seed() {
  await connectDB();

  await Promise.all([Trainer.deleteMany({}), User.deleteMany({}), Zone.deleteMany({})]);

  const zones = await Zone.insertMany(zoneData);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await User.create({
    name: "Demo Admin",
    email: "admin@demo.com",
    passwordHash,
    role: ROLES.ADMIN,
  });

  const trainerData = [
    { name: "Arjun Mehta", email: "trainer@demo.com", zone: 0, offset: [0.002, 0.001] },
    { name: "Meera Iyer", email: "meera.trainer@demo.com", zone: 0, offset: [-0.004, 0.003] },
    { name: "Rohan Verma", email: "rohan.trainer@demo.com", zone: 1, offset: [0.001, -0.002] },
    { name: "Sneha Kapoor", email: "sneha.trainer@demo.com", zone: 2, offset: [-0.002, 0.002] },
  ];

  for (const t of trainerData) {
    const zone = zones[t.zone];
    const location = near(zone.center, ...t.offset);
    const user = await User.create({
      name: t.name,
      email: t.email,
      passwordHash,
      role: ROLES.TRAINER,
      zone: zone._id,
      location,
    });
    await Trainer.create({ user: user._id, zone: zone._id, location });
  }

  const customerData = [
    { name: "Aarav Sharma", email: "customer@demo.com", zone: 0, offset: [0.001, -0.001] },
    { name: "Diya Singh", email: "diya.customer@demo.com", zone: 0, offset: [-0.002, 0.002] },
    { name: "Kabir Malhotra", email: "kabir.customer@demo.com", zone: 1, offset: [0.002, 0.001] },
    { name: "Isha Reddy", email: "isha.customer@demo.com", zone: 2, offset: [0.001, 0.003] },
  ];

  for (const c of customerData) {
    const zone = zones[c.zone];
    await User.create({
      name: c.name,
      email: c.email,
      passwordHash,
      role: ROLES.CUSTOMER,
      zone: zone._id,
      location: near(zone.center, ...c.offset),
    });
  }

  console.log("Seed complete");
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
  console.log("Admin:    admin@demo.com");
  console.log("Trainer:  trainer@demo.com");
  console.log("Customer: customer@demo.com");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());