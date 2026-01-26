import { Request } from 'express';
import { Role } from '../generated/prisma/enums.ts';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                name: string;
                role: Role;
            };
        }
    }
}