import mongoose from "mongoose";
import { locationSchema } from "../../shared/models/location.schema.js";
import { ROLES, ROLE_VALUES } from "./user.constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.CUSTOMER, required: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", default: null },
    location: { type: locationSchema, default: null },
    lockVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);