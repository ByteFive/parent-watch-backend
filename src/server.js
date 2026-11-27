import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { connectDatabase } from "./lib/db.js";
import authRouter from "./routes/auth.js";
import familyRouter from "./routes/family.js";
import locationsRouter from "./routes/locations.js";
import { socketAuth } from "./middlewares/socketAuth.js";
import { registerLocationSocket } from "./socket/locationSocket.js";

process.on("unhandledRejection", (reason) => {
    console.log("[ERRO] unhandledRejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.log("[ERRO] uncaughtException:", error);
    process.exit(1);
});

for(const name of ["JWT_SECRET", "CLIENT_ORIGIN", "CPF_PEPPER"]){
    if(!process.env[name]){
        throw new Error(`Variável ${name} não definida no .env`);
    }
}

const corsOptions = { origin: process.env.CLIENT_ORIGIN, credentials: true };

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/family", familyRouter);
app.use("/locations", locationsRouter);

app.use((error, req, res, next) => {
    console.log(`[ERRO] ${req.method} ${req.path}:`, error);

    if(res.headersSent){
        return next(error);
    }

    const status = error.status ?? error.statusCode;

    if(Number.isInteger(status) && status >= 400 && status < 500){
        return res.status(status).json({ message: "Requisição inválida." });
    }

    return res.status(500).json({ message: "Erro interno do servidor." });
});

const server = http.createServer(app);

const io = new Server(server, { cors: corsOptions });

io.use(socketAuth);
registerLocationSocket(io);

try{
    await connectDatabase();
}catch(error){
    console.log("[ERRO] Falha ao conectar no MongoDB:", error.message);
    process.exit(1);
}

const PORT = Number(process.env.PORT) || 8080;

server.on("error", (error) => {
    console.log("[ERRO] Servidor HTTP:", error.message);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em: http://127.0.0.1:${PORT}`);
});