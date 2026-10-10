import { Module } from '@nestjs/common';
import { TheatersModule as TheatersDomainModule } from '@repo/theaters';
import { AdminRoomLayoutsController } from './admin-room-layouts.controller';
import { AdminRoomsController } from './admin-rooms.controller';
import { AdminSeatTypesController } from './admin-seat-types.controller';
import { AdminSeatsController } from './admin-seats.controller';
import { AdminTheatersController } from './admin-theaters.controller';
import { RoomLayoutsService } from './room-layouts.service';
import { RoomsService } from './rooms.service';
import { SeatTypesController } from './seat-types.controller';
import { SeatTypesService } from './seat-types.service';
import { SeatsService } from './seats.service';
import { TheatersController } from './theaters.controller';
import { TheatersService } from './theaters.service';

@Module({
  imports: [TheatersDomainModule],
  controllers: [
    AdminTheatersController,
    AdminRoomsController,
    AdminRoomLayoutsController,
    AdminSeatsController,
    AdminSeatTypesController,
    TheatersController,
    SeatTypesController,
  ],
  providers: [TheatersService, RoomsService, RoomLayoutsService, SeatsService, SeatTypesService],
})
export class TheatersModule {}
