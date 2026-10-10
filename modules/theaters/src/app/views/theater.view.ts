import type { TheaterStatus } from '../../domain';

export type TheaterView = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly streetAddress: string;
  readonly ward: string;
  readonly province: string;
  readonly phoneNumber: string | null; // E.164
  readonly status: TheaterStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
