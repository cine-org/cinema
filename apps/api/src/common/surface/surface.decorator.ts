import { applyDecorators, Controller, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiExtension } from '@nestjs/swagger';

// Which API a controller belongs to; read by the OpenAPI split and, later, the access guard.
export const SURFACE = 'api:surface';
export const SURFACE_EXTENSION = 'x-surface';

export type ApiSurface = 'admin' | 'user';

// Every controller must pick one: an unmarked route fails generation instead of leaking.
function surfaceController(surface: ApiSurface, path: string): ClassDecorator {
  return applyDecorators(
    Controller(path),
    SetMetadata(SURFACE, surface),
    ApiExtension(SURFACE_EXTENSION, surface),
  );
}

// Routes under /admin so they never collide with a user route of the same resource. Closed by
// default: AdminAccessGuard requires an admin session (see admin-access.decorator).
export function AdminApi(path = ''): ClassDecorator {
  return applyDecorators(surfaceController('admin', `admin/${path}`), ApiBearerAuth('bearer'));
}

export function UserApi(path = ''): ClassDecorator {
  return surfaceController('user', path);
}
