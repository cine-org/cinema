-- CreateEnum
CREATE TYPE "AuthSessionSurface" AS ENUM ('USER', 'ADMIN');

-- AlterTable: sessions so far all came from the customer sign-in.
ALTER TABLE "auth_sessions" ADD COLUMN "surface" "AuthSessionSurface" NOT NULL DEFAULT 'USER';
