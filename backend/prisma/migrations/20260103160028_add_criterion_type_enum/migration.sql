/*
  Warnings:

  - The `type` column on the `Criterion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."CriterionType" AS ENUM ('benefit', 'cost');

-- AlterTable
ALTER TABLE "public"."Criterion" DROP COLUMN "type",
ADD COLUMN     "type" "public"."CriterionType" NOT NULL DEFAULT 'benefit';
