-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "context" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "snapshot" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "aiConfig" TEXT NOT NULL,
    "actualModel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "leaseToken" TEXT,
    "leaseUntil" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "main" INTEGER NOT NULL,
    "followup" BOOLEAN NOT NULL DEFAULT false,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "evaluation" TEXT,
    CONSTRAINT "Turn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Weakness" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'perlu dilatih',
    "note" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Weakness_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Weakness_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Weakness_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "Turn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Target" (
    "sessionId" TEXT NOT NULL,
    "weaknessId" TEXT NOT NULL,
    "main" INTEGER NOT NULL,

    PRIMARY KEY ("sessionId", "weaknessId"),
    CONSTRAINT "Target_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Target_weaknessId_fkey" FOREIGN KEY ("weaknessId") REFERENCES "Weakness" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Turn_sessionId_ordinal_key" ON "Turn"("sessionId", "ordinal");
