-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DecisionCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DecisionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Criterion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'benefit',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decisionCaseId" TEXT NOT NULL,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alternative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decisionCaseId" TEXT NOT NULL,

    CONSTRAINT "Alternative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AlternativeScore" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "alternativeId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,

    CONSTRAINT "AlternativeScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativeScore_alternativeId_criterionId_key" ON "public"."AlternativeScore"("alternativeId", "criterionId");

-- AddForeignKey
ALTER TABLE "public"."DecisionCase" ADD CONSTRAINT "DecisionCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Criterion" ADD CONSTRAINT "Criterion_decisionCaseId_fkey" FOREIGN KEY ("decisionCaseId") REFERENCES "public"."DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alternative" ADD CONSTRAINT "Alternative_decisionCaseId_fkey" FOREIGN KEY ("decisionCaseId") REFERENCES "public"."DecisionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlternativeScore" ADD CONSTRAINT "AlternativeScore_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "public"."Alternative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlternativeScore" ADD CONSTRAINT "AlternativeScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "public"."Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
