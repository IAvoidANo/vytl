-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPETITE_BREACH', 'KRI_RED', 'KRI_AMBER', 'RISK_ASSIGNED', 'INCIDENT_CREATED', 'ACTION_OVERDUE', 'ASSESSMENT_COMPLETE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "kri_value_entries" (
    "id" TEXT NOT NULL,
    "kriId" TEXT NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "status" "KriStatus" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,

    CONSTRAINT "kri_value_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "kri_value_entries" ADD CONSTRAINT "kri_value_entries_kriId_fkey" FOREIGN KEY ("kriId") REFERENCES "kris"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
