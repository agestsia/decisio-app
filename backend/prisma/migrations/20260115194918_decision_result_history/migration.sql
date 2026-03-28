-- CreateTable
CREATE TABLE "public"."DecisionResult" (
    "id" TEXT NOT NULL,
    "decisionCaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'WSM',
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DecisionResultItem" (
    "id" TEXT NOT NULL,
    "decisionResultId" TEXT NOT NULL,
    "alternativeId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionResultItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionResult_decisionCaseId_idx" ON "public"."DecisionResult"("decisionCaseId");

-- CreateIndex
CREATE INDEX "DecisionResult_userId_idx" ON "public"."DecisionResult"("userId");

-- CreateIndex
CREATE INDEX "DecisionResultItem_decisionResultId_idx" ON "public"."DecisionResultItem"("decisionResultId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionResultItem_decisionResultId_alternativeId_key" ON "public"."DecisionResultItem"("decisionResultId", "alternativeId");

-- AddForeignKey
ALTER TABLE "public"."DecisionResult" ADD CONSTRAINT "DecisionResult_decisionCaseId_fkey" FOREIGN KEY ("decisionCaseId") REFERENCES "public"."DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DecisionResult" ADD CONSTRAINT "DecisionResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DecisionResultItem" ADD CONSTRAINT "DecisionResultItem_decisionResultId_fkey" FOREIGN KEY ("decisionResultId") REFERENCES "public"."DecisionResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DecisionResultItem" ADD CONSTRAINT "DecisionResultItem_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "public"."Alternative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
