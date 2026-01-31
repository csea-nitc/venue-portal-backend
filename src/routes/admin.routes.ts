import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authorizeRoles } from "../middlewares/roles.middleware.js";
import {
    createUserSchema,
    updateUserSchema,
    userIdSchema,
} from "../schemas/user.schema.js";
import {
    createVenueSchema,
    updateVenueSchema,
    venueIdSchema,
} from "../schemas/venue.schema.js";
import * as userController from "../controllers/admin.user.controller.js";
import * as venueController from "../controllers/admin.venue.controller.js";
import { Role } from "../generated/prisma/enums.js";
const adminRouter = Router();

adminRouter.use(authorizeRoles(Role.ADMIN));

adminRouter.get("/dashboard", (req, res) => {
    res.send("Admin Dashboard");
});

adminRouter.post(
    "/admin",
    validate(createUserSchema as any),
    userController.createAdmin,
);
adminRouter.get("/admin", userController.getAllAdmins);
adminRouter.get(
    "/admin/:userId",
    validate(userIdSchema as any),
    userController.getAdminById,
);
adminRouter.put(
    "/admin/:userId",
    validate(userIdSchema.merge(updateUserSchema) as any),
    userController.updateAdminById,
);
adminRouter.delete(
    "/admin/:userId",
    validate(userIdSchema as any),
    userController.deleteAdminById,
);

adminRouter.post(
    "/venues",
    validate(createVenueSchema as any),
    venueController.createVenue,
);
adminRouter.get("/venues", venueController.getAvailableVenues);
adminRouter.get(
    "/venues/:venueId",
    validate(venueIdSchema as any),
    venueController.getVenueById,
);
adminRouter.put(
    "/venues/:venueId",
    validate(venueIdSchema.merge(updateVenueSchema) as any),
    venueController.updateVenue,
);
adminRouter.delete(
    "/venues/:venueId",
    validate(venueIdSchema as any),
    venueController.deleteVenue,
);

export default adminRouter;
