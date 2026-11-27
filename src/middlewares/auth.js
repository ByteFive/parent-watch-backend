import jwt from "jsonwebtoken";
import User from "../models/user.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Sessão inválida ou expirada." });
    }

    console.log("[ERRO] requireAuth:", error);

    return res.status(500).json({ message: "Erro interno do servidor." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Sem permissão para esta ação." });
    }

    next();
  };
}