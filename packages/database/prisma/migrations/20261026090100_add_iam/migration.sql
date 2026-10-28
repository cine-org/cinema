-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('GLOBAL', 'CLUSTER', 'THEATER', 'SELF');

-- CreateTable
CREATE TABLE "permissions" (
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deprecated_at" TIMESTAMP(3),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" "RoleScope"[],
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_key")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "scope" "RoleScope" NOT NULL,
    "cluster_id" TEXT,
    "theater_id" TEXT,
    "granted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE INDEX "role_permissions_permission_key_idx" ON "role_permissions"("permission_key");

-- CreateIndex
CREATE INDEX "role_assignments_user_id_idx" ON "role_assignments"("user_id");

-- CreateIndex
CREATE INDEX "role_assignments_role_id_idx" ON "role_assignments"("role_id");

-- CreateIndex
CREATE INDEX "role_assignments_cluster_id_idx" ON "role_assignments"("cluster_id");

-- CreateIndex
CREATE INDEX "role_assignments_theater_id_idx" ON "role_assignments"("theater_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "permissions"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_theater_id_fkey" FOREIGN KEY ("theater_id") REFERENCES "theaters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A role assignment points at the place its scope names, and nowhere else.
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_scope_target_check" CHECK (
    ("scope" = 'CLUSTER' AND "cluster_id" IS NOT NULL AND "theater_id" IS NULL)
    OR ("scope" = 'THEATER' AND "theater_id" IS NOT NULL AND "cluster_id" IS NULL)
    OR ("scope" IN ('GLOBAL', 'SELF') AND "cluster_id" IS NULL AND "theater_id" IS NULL)
);

-- At most one active role per account. Partial indexes are not expressible in the Prisma schema.
CREATE UNIQUE INDEX "role_assignments_one_active_per_user" ON "role_assignments"("user_id")
    WHERE "revoked_at" IS NULL;

-- System roles. Their permissions come from the catalog sync on startup, which runs after the
-- migration: a permission seen for the first time is granted to its default roles.
INSERT INTO "roles" ("id", "key", "name", "scopes", "is_system", "is_locked", "updated_at") VALUES
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'Super admin', '{GLOBAL}', true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'CONTENT_MANAGER', 'Content manager', '{GLOBAL}', true, false, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'CUSTOMER_SUPPORT', 'Customer support', '{GLOBAL,CLUSTER,THEATER}', true, false, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'CLUSTER_MANAGER', 'Cluster manager', '{CLUSTER}', true, false, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'THEATER_MANAGER', 'Theater manager', '{THEATER}', true, false, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'BOX_OFFICE', 'Box office', '{THEATER}', true, false, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'USHER', 'Usher', '{THEATER}', true, false, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'CUSTOMER', 'Customer', '{SELF}', true, false, CURRENT_TIMESTAMP);

-- Every account so far registered as a customer.
INSERT INTO "role_assignments" ("id", "user_id", "role_id", "scope")
SELECT gen_random_uuid()::text, "users"."id", "roles"."id", 'SELF'
FROM "users" CROSS JOIN "roles"
WHERE "roles"."key" = 'CUSTOMER';
