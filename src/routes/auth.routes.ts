import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import '../config/passport.config.js';

const authRouter = Router();

authRouter.get(
  "/login",
  passport.authenticate('google', { scope: ["profile", "email"] })
);

authRouter.get(
    "/google/callback",
    passport.authenticate('google', {
        failureRedirect: "/api/auth/login-failure",
        successRedirect: "/api/auth/login-success",
        session: false
    })
)

authRouter.get("/login-success", (req: Request, res: Response) => {
    const payload = req.user as any;

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    )

    // TODO: Refresh token implementation

    res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
});

authRouter.get("/login-failure", (req, res) => {
    res.send("Login Failed");
});

export default authRouter;