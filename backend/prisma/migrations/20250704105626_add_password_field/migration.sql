/*
  Warnings:

  - The `authStatus` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AuthStatus" AS ENUM ('anonymous', 'authenticated');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'moderator');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT,
DROP COLUMN "authStatus",
ADD COLUMN     "authStatus" "AuthStatus" NOT NULL DEFAULT 'anonymous',
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_sessionId_idx" ON "users"("sessionId");
