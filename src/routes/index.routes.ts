import { Router } from "express";
import authRouter from "./auth.routes.js";
import adminRouter from "./admin.routes.js";
import clubRouter from "./club.routes.js";

const indexRouter = Router();

indexRouter.use("/api/auth", authRouter);
indexRouter.use("/api/admin", adminRouter);
indexRouter.use("/api/clubs", clubRouter);

export default indexRouter;