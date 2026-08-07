/*
  Warnings:

  - Changed the type of `action` on the `activity_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('BOOKING_CREATED', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN', 'FORWARDED');

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "role" "Role",
DROP COLUMN "action",
ADD COLUMN     "action" "ActivityAction" NOT NULL;
