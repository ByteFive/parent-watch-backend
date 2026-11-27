import mongoose from "mongoose";

export async function connectDatabase() {

    const mongoUri = process.env.MONGODB_URI;

    if(!mongoUri){
        throw new Error("MONGODB_URI não definida.")
    }

    mongoose.connection.on("error", (error) => {
        console.log("[ERRO] MongoDB:", error);
    });

    mongoose.connection.on("disconnected", () => {
        console.log("[ERRO] MongoDB desconectado.");
    });

    await mongoose.connect(mongoUri);

    console.log("MongoDB conectado.");
    
}