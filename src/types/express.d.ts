import { Role } from '../generated/prisma/enums.js';

declare global {
  namespace Express {
    interface User {
      name: string;
      userId: number;
      email: string;
      role: Role;
      isActive: boolean;
    }
  }
}

export {};