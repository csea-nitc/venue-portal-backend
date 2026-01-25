import { Router } from "express";
import passport from "passport";
import '../config/passport.js';

const authRouter = Router();

authRouter.get(
  "/login",
  passport.authenticate('google', { scope: ["profile", "email"] })
);

authRouter.get(
    "/google/callback",
    passport.authenticate('google', {
        failureRedirect: "/login-failure",
        successRedirect: "/login-success",
    })
)

authRouter.get("/login-success", (req, res) => {
    res.send("Login Successful");
});

authRouter.get("/login-failure", (req, res) => {
    res.send("Login Failed");
});

export default authRouter;