/*
  Warnings:

  - Added the required column `updatedAt` to the `AlternativeScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AlternativeScore" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Alternative_decisionCaseId_idx" ON "public"."Alternative"("decisionCaseId");

-- CreateIndex
CREATE INDEX "AlternativeScore_criterionId_idx" ON "public"."AlternativeScore"("criterionId");

-- CreateIndex
CREATE INDEX "AlternativeScore_alternativeId_idx" ON "public"."AlternativeScore"("alternativeId");

-- CreateIndex
CREATE INDEX "Criterion_decisionCaseId_idx" ON "public"."Criterion"("decisionCaseId");

-- CreateIndex
CREATE INDEX "DecisionCase_userId_idx" ON "public"."DecisionCase"("userId");
