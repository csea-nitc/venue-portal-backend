import { Router } from "express";
import * as clubController from "../controllers/club.controller.js";
import authenticator from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createClubSchema } from "../schemas/club.schema.js";
import { Role } from "../generated/prisma/enums.js";

const clubRouter = Router();

clubRouter.use(authenticator);

// Logged-in Club profile 
clubRouter.get("/me", clubController.getMyClubProfile);

clubRouter.get("/", authorizeRoles(Role.ADMIN), clubController.getAllClubs);
clubRouter.get("/:id", authorizeRoles(Role.ADMIN), clubController.getClubById);

clubRouter.post(
    "/", 
    authorizeRoles(Role.ADMIN), 
    validate(createClubSchema as any), 
    clubController.createClub
);

export default clubRouter;