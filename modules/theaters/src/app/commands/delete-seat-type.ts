import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { SeatType, SeatTypeNotFoundException } from '../../domain';
import { SeatTypeWriteRepository } from '../port';

export class DeleteSeatTypeCommand {
  constructor(readonly code: string) {}
}

@Injectable()
export class DeleteSeatTypeHandler {
  constructor(private readonly seatTypes: SeatTypeWriteRepository) {}

  async execute(command: DeleteSeatTypeCommand): Promise<CommandResult<'code'>> {
    const code = SeatType.normalizeCode(command.code);
    const seatType = await this.seatTypes.findByCode(code);

    if (!seatType) {
      throw new SeatTypeNotFoundException();
    }

    seatType.assertDeletable(await this.seatTypes.isInUse(code));
    await this.seatTypes.delete(code);

    return { code };
  }
}
