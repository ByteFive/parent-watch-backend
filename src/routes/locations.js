import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/user.js";
import { requireAuth } from "../middlewares/auth.js";
import { canViewLocation } from "../lib/permissions.js";
import { getCurrentPosition, getLastLocations } from "../services/locationService.js";

const router = Router();

router.use(requireAuth);

router.get("/:userId", async (req, res) => {

    const { userId } = req.params;

    if(!mongoose.isValidObjectId(userId)){
        return res.status(400).json({ message: "userId inválido." });
    }

    try{
        const target = await User.findById(userId).select("_id");

        if(!target){
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        if(!canViewLocation(req.user, target)){
            return res.status(403).json({ message: "Sem permissão para ver esta localização." });
        }

        const lastLocations = await getLastLocations(userId);
        const current = getCurrentPosition(userId);

        res.json({
            userId,
            online: current !== null,
            current,
            lastLocations
        });
    }catch(error){
        console.log("[ERRO] GET /locations/:userId:", error);
        res.status(500).json({ message: "Erro ao buscar localizações." });
    }

});

export default router;