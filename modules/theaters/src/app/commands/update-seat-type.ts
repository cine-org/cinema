import { Injectable } from '@nestjs/common';
import type { CommandResult } from '@repo/common';
import { SeatType, SeatTypeNotFoundException, type SeatTypeDetails } from '../../domain';
import { SeatTypeWriteRepository } from '../port';

export type UpdateSeatTypeCommandProps = {
  readonly code: string;
  readonly details: Partial<SeatTypeDetails>;
};

export class UpdateSeatTypeCommand {
  constructor(readonly props: UpdateSeatTypeCommandProps) {}
}

@Injectable()
export class UpdateSeatTypeHandler {
  constructor(private readonly seatTypes: SeatTypeWriteRepository) {}

  async execute({ props }: UpdateSeatTypeCommand): Promise<CommandResult<'code'>> {
    const code = SeatType.normalizeCode(props.code);
    const seatType = await this.seatTypes.findByCode(code);

    if (!seatType) {
      throw new SeatTypeNotFoundException();
    }

    seatType.update(props.details, await this.seatTypes.isInUse(code));
    await this.seatTypes.update(seatType);

    return { code: seatType.code };
  }
}
