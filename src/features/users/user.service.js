import { AppError } from "../../shared/utils/AppError.js";
import { lockDocument } from "../../shared/utils/lock.js";
import { User } from "./user.model.js";

const ZONE_FIELDS = "name center radiusKm";

export function findUserByEmail(email, { withPassword = false } = {}) {
  const query = User.findOne({ email: email.toLowerCase() }).populate("zone", ZONE_FIELDS);
  return withPassword ? query.select("+passwordHash") : query;
}

export function findUserById(id) {
  return User.findById(id).populate("zone", ZONE_FIELDS);
}

export function createUser(data) {
  return User.create(data);
}

export async function getCustomerWithZone(userId) {
  const user = await findUserById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!user.zone) throw new AppError("Your account has no service zone", 400);
  return user;
}

export const lockUser = (userId, session) => lockDocument(User, userId, session);

export function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    zone: user.zone,
    location: user.location,
  };
}