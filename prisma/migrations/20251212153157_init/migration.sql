-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "data" TEXT,
    "actorId" INTEGER,
    "chittyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "actorId", "chittyId", "createdAt", "data", "entityId", "entityType", "id") SELECT "action", "actorId", "chittyId", "createdAt", "data", "entityId", "entityType", "id" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_chittyId_idx" ON "AuditLog"("chittyId");
CREATE TABLE "new_Chitty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Chitty" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Chitty";
DROP TABLE "Chitty";
ALTER TABLE "new_Chitty" RENAME TO "Chitty";
CREATE TABLE "new_Month" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "target" INTEGER NOT NULL,
    "lotReceiverId" INTEGER,
    "chittyId" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Month_lotReceiverId_fkey" FOREIGN KEY ("lotReceiverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Month_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Month" ("chittyId", "createdAt", "dueDate", "id", "index", "isClosed", "lotReceiverId", "name", "startDate", "target", "updatedAt") SELECT "chittyId", "createdAt", "dueDate", "id", "index", "isClosed", "lotReceiverId", "name", "startDate", "target", "updatedAt" FROM "Month";
DROP TABLE "Month";
ALTER TABLE "new_Month" RENAME TO "Month";
CREATE INDEX "Month_chittyId_idx" ON "Month"("chittyId");
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memberId" INTEGER NOT NULL,
    "monthId" INTEGER NOT NULL,
    "chittyId" INTEGER NOT NULL,
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
INSERT INTO "new_Payment" ("amount", "chittyId", "corrected", "createdAt", "date", "id", "isDeleted", "memberId", "method", "monthId", "monthIndex", "note", "refunded", "updatedAt") SELECT "amount", "chittyId", "corrected", "createdAt", "date", "id", "isDeleted", "memberId", "method", "monthId", "monthIndex", "note", "refunded", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_chittyId_idx" ON "Payment"("chittyId");
CREATE TABLE "new_Payout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monthId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "chittyId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payout_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payout_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payout_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payout" ("amount", "chittyId", "createdAt", "date", "id", "monthId", "note", "receiverId") SELECT "amount", "chittyId", "createdAt", "date", "id", "monthId", "note", "receiverId" FROM "Payout";
DROP TABLE "Payout";
ALTER TABLE "new_Payout" RENAME TO "Payout";
CREATE UNIQUE INDEX "Payout_monthId_key" ON "Payout"("monthId");
CREATE INDEX "Payout_chittyId_idx" ON "Payout"("chittyId");
CREATE TABLE "new_Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chittyId" INTEGER NOT NULL,
    "adminId" INTEGER,
    "monthlyAmount" INTEGER NOT NULL DEFAULT 5000,
    "monthsCount" INTEGER NOT NULL DEFAULT 11,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "dueDay" INTEGER NOT NULL DEFAULT 10,
    "allowOverCollection" BOOLEAN NOT NULL DEFAULT false,
    "maxMembers" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Setting_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Setting_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Setting" ("allowOverCollection", "chittyId", "createdAt", "dueDay", "id", "monthlyAmount", "monthsCount", "startDate", "updatedAt") SELECT "allowOverCollection", "chittyId", "createdAt", "dueDay", "id", "monthlyAmount", "monthsCount", "startDate", "updatedAt" FROM "Setting";
DROP TABLE "Setting";
ALTER TABLE "new_Setting" RENAME TO "Setting";
CREATE UNIQUE INDEX "Setting_adminId_key" ON "Setting"("adminId");
CREATE INDEX "Setting_chittyId_idx" ON "Setting"("chittyId");
CREATE INDEX "Setting_adminId_idx" ON "Setting"("adminId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "password" TEXT NOT NULL,
    "chittyId" INTEGER NOT NULL,
    "parentAdminId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "User_chittyId_fkey" FOREIGN KEY ("chittyId") REFERENCES "Chitty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_parentAdminId_fkey" FOREIGN KEY ("parentAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("chittyId", "createdAt", "deletedAt", "email", "id", "name", "password", "phone", "role") SELECT "chittyId", "createdAt", "deletedAt", "email", "id", "name", "password", "phone", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE INDEX "User_chittyId_idx" ON "User"("chittyId");
CREATE INDEX "User_parentAdminId_idx" ON "User"("parentAdminId");
CREATE UNIQUE INDEX "User_email_chittyId_key" ON "User"("email", "chittyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
