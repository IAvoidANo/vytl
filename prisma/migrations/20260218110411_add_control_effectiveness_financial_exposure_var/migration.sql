-- CreateEnum
CREATE TYPE "ControlEffectiveness" AS ENUM ('EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE', 'NOT_TESTED', 'NOT_APPLICABLE');

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "triggeredById" TEXT;

-- AlterTable
ALTER TABLE "risks" ADD COLUMN     "controlEffectiveness" "ControlEffectiveness" NOT NULL DEFAULT 'NOT_TESTED',
ADD COLUMN     "financialExposure" DECIMAL(15,2),
ADD COLUMN     "varValue" DECIMAL(15,2);

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
