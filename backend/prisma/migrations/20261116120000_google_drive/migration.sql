-- Stockage optionnel des documents dans le Google Drive de chaque organisation
ALTER TABLE "Tenant" ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'archivix';
ALTER TABLE "Tenant" ADD COLUMN "googleDriveEmail" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "googleDriveRefreshToken" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "googleDriveFolderId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "googleDriveConnectedAt" TIMESTAMP(3);

ALTER TABLE "Department" ADD COLUMN "googleDriveFolderId" TEXT;

ALTER TABLE "Document" ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'archivix';
ALTER TABLE "Document" ADD COLUMN "storageKey" TEXT;
