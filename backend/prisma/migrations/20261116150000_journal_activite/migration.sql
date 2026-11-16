-- Journal d'activité (traçabilité des consultations, modifications, partages et suppressions)
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "documentId" TEXT,
    "documentTitle" TEXT,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_tenantId_createdAt_idx" ON "ActivityLog"("tenantId", "createdAt");
CREATE INDEX "ActivityLog_documentId_idx" ON "ActivityLog"("documentId");
