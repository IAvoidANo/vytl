-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('BASELINE', 'SCHEDULED', 'MANUAL', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "SnapshotFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "snapshotFrequency" "SnapshotFrequency" NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN     "snapshotMateriality" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "risk_snapshots" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "snapshotType" "SnapshotType" NOT NULL,
    "createdBy" TEXT,
    "vytlScore" INTEGER,
    "vytlGrade" TEXT,
    "vytlCoverage" DOUBLE PRECISION,
    "vytlControl" DOUBLE PRECISION,
    "vytlMaturity" DOUBLE PRECISION,
    "vytlTrend" DOUBLE PRECISION,
    "totalRisks" INTEGER NOT NULL,
    "openRisks" INTEGER NOT NULL,
    "inProgressRisks" INTEGER NOT NULL,
    "monitoringRisks" INTEGER NOT NULL,
    "closedRisks" INTEGER NOT NULL,
    "archivedRisks" INTEGER NOT NULL,
    "risksByCategory" JSONB NOT NULL,
    "lowRiskCount" INTEGER NOT NULL,
    "mediumRiskCount" INTEGER NOT NULL,
    "highRiskCount" INTEGER NOT NULL,
    "extremeRiskCount" INTEGER NOT NULL,
    "krisTotal" INTEGER NOT NULL,
    "krisGreen" INTEGER NOT NULL,
    "krisAmber" INTEGER NOT NULL,
    "krisRed" INTEGER NOT NULL,
    "treatmentsTotal" INTEGER NOT NULL,
    "treatmentsOpen" INTEGER NOT NULL,
    "treatmentsInProgress" INTEGER NOT NULL,
    "treatmentsCompleted" INTEGER NOT NULL,
    "treatmentCompletionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_snapshot_details" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "refCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "RiskCategory" NOT NULL,
    "status" "RiskStatus" NOT NULL,
    "inherentLikelihood" INTEGER NOT NULL,
    "inherentImpact" INTEGER NOT NULL,
    "inherentScore" INTEGER NOT NULL,
    "residualLikelihood" INTEGER NOT NULL,
    "residualImpact" INTEGER NOT NULL,
    "residualScore" INTEGER NOT NULL,
    "owner" TEXT,
    "ownerEmail" TEXT,
    "isTopRisk" BOOLEAN NOT NULL DEFAULT false,
    "rankAtSnapshot" INTEGER,
    "fullState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_snapshot_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "risk_snapshots_orgId_snapshotDate_idx" ON "risk_snapshots"("orgId", "snapshotDate");

-- CreateIndex
CREATE INDEX "risk_snapshots_orgId_snapshotType_idx" ON "risk_snapshots"("orgId", "snapshotType");

-- CreateIndex
CREATE UNIQUE INDEX "risk_snapshots_orgId_snapshotDate_snapshotType_key" ON "risk_snapshots"("orgId", "snapshotDate", "snapshotType");

-- CreateIndex
CREATE INDEX "risk_snapshot_details_snapshotId_riskId_idx" ON "risk_snapshot_details"("snapshotId", "riskId");

-- CreateIndex
CREATE INDEX "risk_snapshot_details_riskId_idx" ON "risk_snapshot_details"("riskId");

-- AddForeignKey
ALTER TABLE "risk_snapshots" ADD CONSTRAINT "risk_snapshots_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_snapshot_details" ADD CONSTRAINT "risk_snapshot_details_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "risk_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
