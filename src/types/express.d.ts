import { Role } from '../generated/prisma/enums.js';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      name: string;
      role: Role;
    }
  }
}

export {};