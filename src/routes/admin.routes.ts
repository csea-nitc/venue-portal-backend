import { Router,Request,Response,NextFunction } from "express";


const adminRouter = Router();

adminRouter.get("/dashboard", (req, res) => {
    res.send("Admin Dashboard");
});


export default adminRouter; 