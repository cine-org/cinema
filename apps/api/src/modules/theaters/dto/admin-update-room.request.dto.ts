import { PartialType } from '@nestjs/swagger';
import { AdminCreateRoomRequestDto } from './admin-create-room.request.dto';

export class AdminUpdateRoomRequestDto extends PartialType(AdminCreateRoomRequestDto) {}
