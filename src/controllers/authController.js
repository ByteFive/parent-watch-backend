import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ms from 'ms';
import { createUniqueFamilyCode } from "../utils/FamilyCode.js";
import { normalizeCpf, isValidCpf, hashCpf } from "../lib/cpf.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

function publicUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    familyCode: user.familyCode,
  };
}

export async function register(req, res) {
  try {
    const { firstName, lastName, password, role } = req.body;
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const cpf = normalizeCpf(req.body.cpf);

    if (!firstName || !lastName || !cpf || !email || !password || !role) {
      return res.status(400).json({
        message: "Nome, sobrenome, CPF, email, senha e perfil são obrigatórios.",
      });
    }

    if (role !== "parent" && role !== "child") {
      return res.status(400).json({
        message: "Perfil inválido.",
      });
    }

    if (!isValidCpf(cpf)) {
      return res.status(400).json({
        message: "CPF inválido.",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Email inválido.",
      });
    }

    const cpfHash = hashCpf(cpf);

    const existingUser = await User.findOne({ $or: [{ cpfHash }, { email }] });

    if (existingUser) {
      return res.status(409).json({
        message: "CPF ou email já cadastrado.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      firstName,
      lastName,
      email,
      cpfHash,
      password: hashedPassword,
      role,
    };

    if (role === "child") {
      data.familyCode = await createUniqueFamilyCode();
    }

    const user = await User.create(data);

    return res.status(201).json({
      message: "Usuário criado com sucesso.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "CPF ou email já cadastrado.",
      });
    }

    console.log("[ERRO] POST /auth/register:", error);

    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
}

export async function login(req, res) {
  try {
    const { password } = req.body;
    const cpf = normalizeCpf(req.body.cpf);

    if (!cpf || typeof password !== "string") {
      return res.status(400).json({
        message: "CPF e senha são obrigatórios.",
      });
    }

    const user = await User.findOne({ cpfHash: hashCpf(cpf) }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "CPF ou senha inválidos.",
      });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "CPF ou senha inválidos.",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: ms('1d'),
    });

    return res.json({
      message: "Login realizado com sucesso.",
      user: publicUser(user),
    });
  } catch (error) {
    console.log("[ERRO] POST /auth/login:", error);

    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
}

export function logout(req, res) {
  res.clearCookie("token", cookieOptions);
  return res.status(204).send();
}

export function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}