import { ALL_PERMISSION_CODES, PERMISSION_CODE, SYSTEM_ROLE_CODE } from '@repo/contracts';
import type { DatabaseClient } from '../../src/database.client';
import { IdentityType, RoleType, UserStatus } from '../../src/generated/prisma/client';

const customerPermissions = [
  PERMISSION_CODE.User.ReadOwn,
  PERMISSION_CODE.User.UpdateOwn,
  PERMISSION_CODE.User.DeleteOwn,
] as const;

export async function seedIam(db: DatabaseClient): Promise<void> {
  await db.$transaction(async (tx) => {
    for (const code of ALL_PERMISSION_CODES) {
      await tx.permission.upsert({ where: { code }, update: {}, create: { code } });
    }

    const superAdmin = await tx.role.upsert({
      where: { code: SYSTEM_ROLE_CODE.SUPER_ADMIN },
      update: { type: RoleType.SYSTEM, name: 'Super administrator' },
      create: {
        code: SYSTEM_ROLE_CODE.SUPER_ADMIN,
        name: 'Super administrator',
        type: RoleType.SYSTEM,
      },
    });
    const customer = await tx.role.upsert({
      where: { code: SYSTEM_ROLE_CODE.CUSTOMER },
      update: { type: RoleType.SYSTEM, name: 'Customer' },
      create: { code: SYSTEM_ROLE_CODE.CUSTOMER, name: 'Customer', type: RoleType.SYSTEM },
    });

    const permissions = await tx.permission.findMany({ select: { id: true, code: true } });
    const byCode = new Map(permissions.map((permission) => [permission.code, permission.id]));
    await tx.rolePermission.deleteMany({ where: { roleId: { in: [superAdmin.id, customer.id] } } });
    await tx.rolePermission.createMany({
      data: ALL_PERMISSION_CODES.map((code) => ({
        roleId: superAdmin.id,
        permissionId: byCode.get(code)!,
      })),
    });
    await tx.rolePermission.createMany({
      data: customerPermissions.map((code) => ({
        roleId: customer.id,
        permissionId: byCode.get(code)!,
      })),
    });

    const bootstrapEmail = process.env['BOOTSTRAP_SUPER_ADMIN_EMAIL']?.trim().toLowerCase();
    if (bootstrapEmail) {
      const identity = await tx.userIdentity.findUnique({
        where: {
          type_normalizedIdentifier: {
            type: IdentityType.EMAIL,
            normalizedIdentifier: bootstrapEmail,
          },
        },
        include: { user: { select: { status: true, deletedAt: true } } },
      });
      if (!identity || identity.user.status !== UserStatus.ACTIVE || identity.user.deletedAt) {
        throw new Error('BOOTSTRAP_SUPER_ADMIN_EMAIL must identify an active, verified user');
      }
      await tx.userRole.createMany({
        data: [{ userId: identity.userId, roleId: superAdmin.id }],
        skipDuplicates: true,
      });
    }
  });
}
