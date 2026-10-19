import bcrypt from "bcryptjs";
import { AppError } from "../../shared/utils/AppError.js";
import { signToken } from "../../shared/utils/token.js";
import { ROLES } from "../users/user.constants.js";
import { createUser, findUserByEmail, findUserById, toPublicUser } from "../users/user.service.js";
import { findZoneById } from "../zones/zone.service.js";
import { findTrainerByUserId } from "../trainers/trainer.service.js";

const SALT_ROUNDS = 10;

export async function register({ name, email, password, zoneId, role }) {
  if (role !== undefined && role !== ROLES.CUSTOMER) {
    throw new AppError("Trainer and admin accounts cannot be created through registration", 403);
  }

  const zone = await findZoneById(zoneId);
  if (!zone || !zone.isActive) throw new AppError("Selected zone does not exist", 400);

  if (await findUserByEmail(email)) throw new AppError("Email is already registered", 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;
  try {
    user = await createUser({
      name,
      email,
      passwordHash,
      role: ROLES.CUSTOMER,
      zone: zone._id,
      location: { lat: zone.center.lat, lng: zone.center.lng },
    });
  } catch (err) {
    if (err.code === 11000) throw new AppError("Email is already registered", 409);
    throw err;
  }

  const fullUser = await findUserById(user._id);
  return { token: signToken(user), user: toPublicUser(fullUser) };
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email, { withPassword: true });
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));

  if (!passwordMatches) throw new AppError("Invalid email or password", 401);

  return { token: signToken(user), user: toPublicUser(user) };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) throw new AppError("User no longer exists", 401);

  const result = { user: toPublicUser(user) };

  if (user.role === ROLES.TRAINER) {
    const trainer = await findTrainerByUserId(user._id);
    result.trainer = trainer && {
      id: trainer._id,
      location: trainer.location,
      isActive: trainer.isActive,
    };
  }

  return result;
}