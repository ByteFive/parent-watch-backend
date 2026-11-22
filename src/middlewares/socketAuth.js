import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export async function socketAuth(socket, next) {
  try {
    const origin = socket.handshake.headers.origin;

    if (origin && origin !== process.env.CLIENT_ORIGIN) {
      return next(new Error("Origem não permitida."));
    }

    const { token } = parseCookie(socket.handshake.headers.cookie || "");

    if (!token) {
      return next(new Error("Não autenticado."));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return next(new Error("Não autenticado."));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error("Não autenticado."));
  }
}