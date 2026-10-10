import { PartialType } from '@nestjs/swagger';
import { AdminCreateTheaterRequestDto } from './admin-create-theater.request.dto';

// The slug can only change while the theater is a draft; phoneNumber: null clears it.
export class AdminUpdateTheaterRequestDto extends PartialType(AdminCreateTheaterRequestDto) {}
