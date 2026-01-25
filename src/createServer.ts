import express from "express";

export function createServer() {
    const app = express();
    app.get("/", (req, res) => {
        res.send("Hello, World!");
    });
    return app;
}