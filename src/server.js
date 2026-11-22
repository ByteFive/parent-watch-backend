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

const server = http.createServer(app);

const io = new Server(server, { cors: corsOptions });

io.use(socketAuth);
registerLocationSocket(io);

await connectDatabase();

const PORT = Number(process.env.PORT) || 8080;

server.listen(PORT, () => {
    console.log(`Servidor rodando em: http://127.0.0.1:${PORT}`);
});