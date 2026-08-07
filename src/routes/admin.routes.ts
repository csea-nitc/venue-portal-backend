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
    addVenueHandlerSchema,
    removeVenueHandlerSchema,
} from "../schemas/venue.schema.js";
import * as userController from "../controllers/admin.user.controller.js";
import * as venueController from "../controllers/admin.venue.controller.js";
import { Role } from "../generated/prisma/enums.js";
import authenticator from "../middlewares/auth.middleware.js";


const adminRouter = Router();

adminRouter.use(authenticator);
adminRouter.use(authorizeRoles(Role.ADMIN));

adminRouter.get("/dashboard", (req, res) => {
    res.send("Admin Dashboard");
});

adminRouter.post(
    "/users",
    validate(createUserSchema),
    userController.createUser,
);
adminRouter.get(
    "/users", 
    userController.getAllUsers
);
adminRouter.get(
    "/users/:userId",
    validate(userIdSchema),
    userController.getUserById,
);
adminRouter.put(
    "/users/:userId",
    validate(updateUserSchema),
    userController.updateUserById,
);
adminRouter.delete(
    "/users/:userId",
    validate(userIdSchema),
    userController.deleteUserById,
);

adminRouter.post(
    "/venues",
    validate(createVenueSchema),
    venueController.createVenue,
);
adminRouter.get(
    "/venues", 
    venueController.getAvailableVenues
);
adminRouter.get(
    "/venues/:venueId",
    validate(venueIdSchema),
    venueController.getVenueById,
);
adminRouter.put(
    "/venues/:venueId",
    validate(venueIdSchema.merge(updateVenueSchema)),
    venueController.updateVenue,
);
adminRouter.delete(
    "/venues/:venueId",
    validate(venueIdSchema),
    venueController.deleteVenue,
);
adminRouter.post(
    "/venues/:venueId/handlers",
    validate(addVenueHandlerSchema),
    venueController.addVenueHandler,
);
adminRouter.delete(
    "/venues/:venueId/handlers/:handlerId",
    validate(removeVenueHandlerSchema),
    venueController.removeVenueHandler,
);

export default adminRouter;
