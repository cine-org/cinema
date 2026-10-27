import { Module } from '@nestjs/common';
import { IamModule as IamDomainModule } from '@repo/iam';
import { AdminEmployeesController } from './admin-employees.controller';
import { AdminPermissionsController } from './admin-permissions.controller';
import { AdminRolesController } from './admin-roles.controller';
import { IamService } from './iam.service';

@Module({
  // Syncs the permission catalog on startup.
  imports: [IamDomainModule],
  controllers: [AdminPermissionsController, AdminRolesController, AdminEmployeesController],
  providers: [IamService],
})
export class IamModule {}
