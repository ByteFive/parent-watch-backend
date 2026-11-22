import mongoose from "mongoose";
import User from "../models/user.js";
import { canViewLocation } from "../lib/permissions.js";
import {
    isValidCoordinate,
    setCurrentPosition,
    getCurrentPosition,
    clearCurrentPosition,
    saveIfNeeded
} from "../services/locationService.js";

export function registerLocationSocket(io){

    io.on("connection", (socket) => {
        const userId = String(socket.data.user._id);
        let sharing = false;

        const stopSharing = () => {
            if(!sharing){
                return;
            }

            sharing = false;
            clearCurrentPosition(userId);
            io.to(`watch:${userId}`).emit("location:offline", { userId });
        };

        socket.on("location:update", (payload) => {
            if(!isValidCoordinate(payload)){
                return;
            }

            sharing = true;

            const position = setCurrentPosition(userId, payload);

            io.to(`watch:${userId}`).emit("location:changed", { userId, ...position });

            saveIfNeeded(userId, position).catch((error) => {
                console.error("Erro ao salvar localização: ", error.message);
            });
        });

        socket.on("location:watch", async (targetUserId) => {
            try{
                if(!mongoose.isValidObjectId(targetUserId)){
                    socket.emit("location:error", { message: "userId inválido." });
                    return;
                }

                const currentViewer = await User.findById(userId).select("role children");
                const target = await User.findById(targetUserId).select("_id");

                if(!target || !canViewLocation(currentViewer, target)){
                    socket.emit("location:error", { message: "Sem permissão para ver esta localização." });
                    return;
                }

                const id = String(target._id);

                socket.join(`watch:${id}`);

                socket.emit("location:current", {
                    userId: id,
                    position: getCurrentPosition(id)
                });
            }catch(error){
                socket.emit("location:error", { message: "Erro ao acompanhar a localização." });
            }
        });

        socket.on("location:unwatch", (targetUserId) => {
            if(typeof targetUserId === "string"){
                socket.leave(`watch:${targetUserId}`);
            }
        });

        socket.on("location:stop", stopSharing);
        socket.on("disconnect", stopSharing);
    });
}