/*
  Warnings:

  - Added the required column `handler_role` to the `booking_handlers` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `venue_handlers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "booking_handlers" ADD COLUMN     "handler_role" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "venue_handlers" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- DropEnum
DROP TYPE "HandlerRole";
