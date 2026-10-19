import * as authService from "./auth.service.js";

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req, res) {
  const result = await authService.getCurrentUser(req.user.id);
  res.json(result);
}