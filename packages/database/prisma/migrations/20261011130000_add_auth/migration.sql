-- CreateEnum
CREATE TYPE "AuthChallengePurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "AuthSessionRevokedReason" AS ENUM ('LOGOUT', 'LOGOUT_ALL', 'SESSION_DELETED', 'SESSION_LIMIT', 'REPLAY', 'PASSWORD_RESET', 'PASSWORD_CHANGED');

-- CreateTable
CREATE TABLE "auth_challenges" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "purpose" "AuthChallengePurpose" NOT NULL,
    "secret_digest" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id"),
    -- Not expressible in the Prisma schema; the 5-failure limit is enforced by the domain.
    CONSTRAINT "auth_challenges_failed_attempts_check" CHECK ("failed_attempts" BETWEEN 0 AND 5)
);

-- CreateIndex
CREATE INDEX "auth_challenges_account_id_purpose_created_at_id_idx" ON "auth_challenges"("account_id", "purpose", "created_at" DESC, "id" DESC);

-- At most one active (unconsumed, unrevoked) challenge per account and purpose.
-- Partial indexes are not expressible in the Prisma schema.
CREATE UNIQUE INDEX "auth_challenges_one_active_idx" ON "auth_challenges"("account_id", "purpose")
    WHERE "consumed_at" IS NULL AND "revoked_at" IS NULL;

-- AddForeignKey
ALTER TABLE "auth_challenges" ADD CONSTRAINT "auth_challenges_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_refreshed_at" TIMESTAMP(3) NOT NULL,
    "idle_expires_at" TIMESTAMP(3) NOT NULL,
    "absolute_expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" "AuthSessionRevokedReason",
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_refresh_tokens" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token_digest" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_sessions_account_id_revoked_at_idx" ON "auth_sessions"("account_id", "revoked_at");

-- CreateIndex
CREATE INDEX "auth_sessions_idle_expires_at_idx" ON "auth_sessions"("idle_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_tokens_token_digest_key" ON "auth_refresh_tokens"("token_digest");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_session_id_idx" ON "auth_refresh_tokens"("session_id");

-- At most one unconsumed refresh token per session, so the rotation chain cannot fork.
-- Partial indexes are not expressible in the Prisma schema.
CREATE UNIQUE INDEX "auth_refresh_tokens_one_active_idx" ON "auth_refresh_tokens"("session_id")
    WHERE "consumed_at" IS NULL;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
