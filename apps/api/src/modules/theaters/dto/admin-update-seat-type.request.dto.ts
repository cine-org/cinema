import { OmitType, PartialType } from '@nestjs/swagger';
import { AdminCreateSeatTypeRequestDto } from './admin-create-seat-type.request.dto';

// The code is the key, so it is not editable; width is locked while seats use the type.
export class AdminUpdateSeatTypeRequestDto extends PartialType(
  OmitType(AdminCreateSeatTypeRequestDto, ['code'] as const),
) {}
