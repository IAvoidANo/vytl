-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "isInSampleMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sampleDataAppliedAt" TIMESTAMP(3),
ADD COLUMN     "sampleDataExitedAt" TIMESTAMP(3);
