import { Request, Response, NextFunction } from "express";
import { Role } from '../generated/prisma/enums.js';

export const authorizeRoles = (...allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRoles = req.user?.role ?? [];
        if (!userRoles.some((role) => allowedRoles.includes(role))) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    }
}
