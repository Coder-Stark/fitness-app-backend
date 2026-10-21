import { AppError } from "../../shared/utils/AppError.js";
import { formatSlot } from "../../shared/utils/time.js";
import { NOTIFICATION_TYPES } from "./notification.constants.js";
import { Notification } from "./notification.model.js";

function serialize(notification) {
  return {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    bookingId: notification.booking ?? null,
    read: Boolean(notification.readAt),
    readAt: notification.readAt ?? null,
    createdAt: notification.createdAt,
  };
}

// Always called with the transaction session of the booking change that caused it, so a
// notification exists only if that change was really saved.
async function create(session, { recipient, type, title, message, booking }) {
  await Notification.create([{ recipient, type, title, message, booking }], { session });
}

export const notifyAssigned = (session, { trainerUserId, bookingId, customerName, startTime }) =>
  create(session, {
    recipient: trainerUserId,
    type: NOTIFICATION_TYPES.BOOKING_ASSIGNED,
    title: "New session assigned",
    message: `${customerName} booked a 60-minute session on ${formatSlot(startTime)}.`,
    booking: bookingId,
  });

export const notifyCancelled = (session, { trainerUserId, bookingId, customerName, startTime }) =>
  create(session, {
    recipient: trainerUserId,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    title: "Session cancelled",
    message: `${customerName} cancelled the session on ${formatSlot(startTime)}.`,
    booking: bookingId,
  });

export const notifyRescheduled = (
  session,
  { trainerUserId, bookingId, customerName, previousStartTime, startTime }
) =>
  create(session, {
    recipient: trainerUserId,
    type: NOTIFICATION_TYPES.BOOKING_RESCHEDULED,
    title: "Session rescheduled",
    message: `${customerName} moved the session from ${formatSlot(previousStartTime)} to ${formatSlot(startTime)}.`,
    booking: bookingId,
  });

// The old trainer is told when a rescheduled session goes to someone else
export const notifyMovedAway = (
  session,
  { trainerUserId, bookingId, customerName, previousStartTime }
) =>
  create(session, {
    recipient: trainerUserId,
    type: NOTIFICATION_TYPES.BOOKING_RESCHEDULED,
    title: "Session moved to another trainer",
    message: `${customerName}'s session on ${formatSlot(previousStartTime)} was rescheduled and assigned to another trainer.`,
    booking: bookingId,
  });

export async function listForUser(userId, { unreadOnly, limit }) {
  const filter = { recipient: userId, ...(unreadOnly && { readAt: null }) };

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  const unreadCount = await countUnread(userId);

  return { notifications: notifications.map(serialize), unreadCount };
}

export const countUnread = (userId) =>
  Notification.countDocuments({ recipient: userId, readAt: null });

export async function markRead(userId, notificationId) {
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId, readAt: null },
    { readAt: new Date() },
    { returnDocument: "after" }
  ).lean();
  if (updated) return serialize(updated);

  // Already read (its readAt is left as it was), or not this user's notification
  const existing = await Notification.findOne({ _id: notificationId, recipient: userId }).lean();
  if (!existing) throw new AppError("Notification not found", 404);
  return serialize(existing);
}

export async function markAllRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, readAt: null },
    { readAt: new Date() }
  );
  return { updated: result.modifiedCount };
}