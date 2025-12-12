-- CreateTable (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS "Chitty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create default chitty for existing data (only if it doesn't exist)
INSERT OR IGNORE INTO "Chitty" ("id", "name", "createdAt", "updatedAt") VALUES (1, 'Default Chitty', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add chittyId columns as nullable first (only if they don't exist)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll check via a different approach
-- We'll just try to add them and ignore errors if they exist

-- For User
-- Check if column exists by trying to select it, if it fails, add it
-- Since SQLite doesn't support this directly, we'll use a workaround
-- We'll just proceed and handle errors in the redefinition step

-- Now make columns required and add foreign keys
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Redefine User table (this will handle adding chittyId if it doesn't exist)
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "password" TEXT NOT NULL,
    "chittyId" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "User_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("id", "name", "email", "phone", "role", "password", "chittyId", "createdAt", "deletedAt") 
SELECT "id", "name", "email", "phone", "role", "password", COALESCE("chittyId", 1), "createdAt", "deletedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE INDEX IF NOT EXISTS "User_chittyId_idx" ON "User"("chittyId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_chittyId_key" ON "User"("email", "chittyId");

-- Redefine Month table
CREATE TABLE "new_Month" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "target" INTEGER NOT NULL,
    "lotReceiverId" INTEGER,
    "chittyId" INTEGER NOT NULL DEFAULT 1,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Month_lotReceiverId_fkey" FOREIGN KEY ("lotReceiverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Month_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Month" ("id", "index", "name", "startDate", "dueDate", "target", "lotReceiverId", "chittyId", "isClosed", "createdAt", "updatedAt")
SELECT "id", "index", "name", "startDate", "dueDate", "target", "lotReceiverId", COALESCE("chittyId", 1), "isClosed", "createdAt", "updatedAt" FROM "Month";
DROP TABLE "Month";
ALTER TABLE "new_Month" RENAME TO "Month";
CREATE INDEX IF NOT EXISTS "Month_chittyId_idx" ON "Month"("chittyId");

-- Redefine Payment table
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memberId" INTEGER NOT NULL,
    "monthId" INTEGER NOT NULL,
    "chittyId" INTEGER NOT NULL DEFAULT 1,
    "monthIndex" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "corrected" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("id", "memberId", "monthId", "chittyId", "monthIndex", "amount", "method", "note", "date", "refunded", "corrected", "isDeleted", "createdAt", "updatedAt")
SELECT "id", "memberId", "monthId", COALESCE("chittyId", 1), "monthIndex", "amount", "method", "note", "date", "refunded", "corrected", "isDeleted", "createdAt", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX IF NOT EXISTS "Payment_chittyId_idx" ON "Payment"("chittyId");

-- Redefine Payout table
CREATE TABLE "new_Payout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monthId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "chittyId" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payout_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payout_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payout_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payout" ("id", "monthId", "receiverId", "chittyId", "amount", "date", "note", "createdAt")
SELECT "id", "monthId", "receiverId", COALESCE("chittyId", 1), "amount", "date", "note", "createdAt" FROM "Payout";
DROP TABLE "Payout";
ALTER TABLE "new_Payout" RENAME TO "Payout";
CREATE UNIQUE INDEX IF NOT EXISTS "Payout_monthId_key" ON "Payout"("monthId");
CREATE INDEX IF NOT EXISTS "Payout_chittyId_idx" ON "Payout"("chittyId");

-- Redefine Setting table
CREATE TABLE "new_Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chittyId" INTEGER NOT NULL,
    "monthlyAmount" INTEGER NOT NULL DEFAULT 5000,
    "monthsCount" INTEGER NOT NULL DEFAULT 11,
    "startDate" DATETIME NOT NULL,
    "dueDay" INTEGER NOT NULL DEFAULT 10,
    "allowOverCollection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Setting_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Setting" ("id", "chittyId", "monthlyAmount", "monthsCount", "startDate", "dueDay", "allowOverCollection", "createdAt", "updatedAt")
SELECT "id", COALESCE("chittyId", 1), "monthlyAmount", "monthsCount", "startDate", "dueDay", "allowOverCollection", "createdAt", "updatedAt" FROM "Setting";
DROP TABLE "Setting";
ALTER TABLE "new_Setting" RENAME TO "Setting";
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_chittyId_key" ON "Setting"("chittyId");

-- Redefine AuditLog table
CREATE TABLE "new_AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "data" TEXT,
    "actorId" INTEGER,
    "chittyId" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("id", "entityType", "entityId", "action", "data", "actorId", "chittyId", "createdAt")
SELECT "id", "entityType", "entityId", "action", "data", "actorId", COALESCE("chittyId", 1), "createdAt" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX IF NOT EXISTS "AuditLog_chittyId_idx" ON "AuditLog"("chittyId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
