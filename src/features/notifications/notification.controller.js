import * as notificationService from "./notification.service.js";

export async function list(req, res) {
  const { unread, limit } = req.validated.query;
  res.json(await notificationService.listForUser(req.user.id, { unreadOnly: unread, limit }));
}

export async function unreadCount(req, res) {
  res.json({ unreadCount: await notificationService.countUnread(req.user.id) });
}

export async function readOne(req, res) {
  const notification = await notificationService.markRead(req.user.id, req.validated.params.id);
  res.json({ notification });
}

export async function readAll(req, res) {
  res.json(await notificationService.markAllRead(req.user.id));
}