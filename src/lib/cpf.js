import crypto from "crypto";

export function normalizeCpf(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  for (const length of [9, 10]) {
    let sum = 0;

    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }

    const digit = ((sum * 10) % 11) % 10;

    if (digit !== Number(cpf[length])) {
      return false;
    }
  }

  return true;
}

export function hashCpf(cpf) {
  return crypto
    .createHmac("sha256", process.env.CPF_PEPPER)
    .update(cpf)
    .digest("hex");
}