import express from "express";
import cookieParser from "cookie-parser";
import indexRouter from "./routes/index.routes.js";
import 'dotenv/config';
import { object } from "zod";


export function createServer() {
    const app = express();
    app.get("/", (req, res) => {
        res.send("Hello, World!");
    });
    app.use(cookieParser());
    app.use(indexRouter);
    return app;
}