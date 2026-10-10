import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { SeatType, type SeatTypeDetails } from '../../domain';
import { SeatTypeWriteRepository } from '../port';

export type CreateSeatTypeCommandProps = {
  readonly code: string;
  readonly details: SeatTypeDetails;
};

export class CreateSeatTypeCommand {
  constructor(readonly props: CreateSeatTypeCommandProps) {}
}

@Injectable()
export class CreateSeatTypeHandler {
  constructor(private readonly seatTypes: SeatTypeWriteRepository) {}

  async execute({ props }: CreateSeatTypeCommand): Promise<CommandResult<'code'>> {
    const seatType = SeatType.create(props.code, props.details);

    await this.seatTypes.create(seatType);

    return { code: seatType.code };
  }
}
