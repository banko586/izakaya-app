-- CreateTable
CREATE TABLE "Izakaya" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imagePath" TEXT,
    "rating" INTEGER NOT NULL,
    "genre" TEXT NOT NULL,
    "memo" TEXT,
    "mapUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
