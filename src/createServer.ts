import express from "express";
import indexRouter from "./routes/index.routes.js";
import 'dotenv/config';
import { object } from "zod";


export function createServer() {
    const app = express();
    app.get("/", (req, res) => {
        res.send("Hello, World!");
    });
    app.use(indexRouter);
    return app;
}