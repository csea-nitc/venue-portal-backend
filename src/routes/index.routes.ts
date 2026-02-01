import { Router } from "express";
import authRouter from "./auth.routes.js";
import adminRouter from "./admin.routes.js";

const indexRouter = Router();

indexRouter.use("/api/auth", authRouter);
indexRouter.use("/api/admin", adminRouter);

export default indexRouter;