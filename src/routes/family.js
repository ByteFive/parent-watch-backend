import { Router } from "express";
import User from "../models/user.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateFamilyCode } from "../utils/FamilyCode.js";

const router = Router();

router.use(requireAuth, requireRole("parent"));

router.post("/children", async (req, res) => {
  try {
    const familyCode = String(req.body.familyCode ?? "").trim().toUpperCase();

    if (!validateFamilyCode(familyCode)) {
      return res.status(400).json({ message: "Código da família inválido." });
    }

    const child = await User.findOne({ familyCode, role: "child" });

    if (!child) {
      return res.status(404).json({ message: "Código da família não encontrado." });
    }

    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { children: child._id } },
    );

    return res.json({
      message: "Filho vinculado com sucesso.",
      child: {
        id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
      },
    });
  } catch (error) {
    console.log("[ERRO] POST /family/children:", error);

    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

router.get("/children", async (req, res) => {
  try {
    const children = await User.find({ _id: { $in: req.user.children } })
      .select("firstName lastName")
      .lean();

    return res.json({
      children: children.map((child) => ({
        id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
      })),
    });
  } catch (error) {
    console.log("[ERRO] GET /family/children:", error);

    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

export default router;