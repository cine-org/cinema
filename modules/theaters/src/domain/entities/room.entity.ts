import { omitUndefined } from '@repo/common';
import {
  RoomClosedException,
  RoomInvalidCodeException,
  RoomInvalidStatusTransitionException,
  RoomLayoutNotPublishedException,
  RoomNotDraftException,
  TheaterClosedException,
} from '../exceptions';
import { ROOM_LAYOUT_STATUS, type RoomLayout } from './room-layout.entity';
import type { Theater } from './theater.entity';

export const ROOM_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CLOSED: 'CLOSED',
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

const ROOM_STATUS_TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> = {
  DRAFT: [ROOM_STATUS.ACTIVE],
  ACTIVE: [ROOM_STATUS.INACTIVE, ROOM_STATUS.CLOSED],
  INACTIVE: [ROOM_STATUS.ACTIVE, ROOM_STATUS.CLOSED],
  CLOSED: [],
};

export const ROOM_CODE_PATTERN = /^[A-Z0-9-]{1,10}$/;

export type RoomProps = {
  readonly id: string;
  readonly theaterId: string;
  code: string;
  name: string;
  status: RoomStatus;
};

export type RoomDetails = Readonly<Omit<RoomProps, 'id' | 'theaterId' | 'status'>>;

export class Room {
  private constructor(private readonly props: RoomProps) {}

  static create(theater: Theater, details: RoomDetails): Room {
    Room.assertTheaterOpen(theater);

    return new Room({
      id: crypto.randomUUID(),
      theaterId: theater.id,
      ...Room.normalize(details),
      status: ROOM_STATUS.DRAFT,
    });
  }

  static restore(props: RoomProps): Room {
    return new Room({ ...props });
  }

  static normalizeCode(code: string): string {
    const normalized = code.trim().toUpperCase();

    if (!ROOM_CODE_PATTERN.test(normalized)) {
      throw new RoomInvalidCodeException();
    }

    return normalized;
  }

  update(theater: Theater, details: Partial<RoomDetails>): void {
    this.assertEditable(theater);
    const normalized = Room.normalize({ ...this.toDetails(), ...omitUndefined(details) });

    // An opened room keeps its code: staff and tickets know the room by it.
    if (!this.isDraft && normalized.code !== this.props.code) {
      throw new RoomNotDraftException({
        message: 'Code can only change while the room is a draft',
      });
    }

    Object.assign(this.props, normalized);
  }

  activate(theater: Theater, publishedLayout: RoomLayout | null): void {
    const hasPublishedLayout =
      publishedLayout?.roomId === this.props.id &&
      publishedLayout.status === ROOM_LAYOUT_STATUS.PUBLISHED;

    if (!hasPublishedLayout) {
      throw new RoomLayoutNotPublishedException();
    }

    this.transitionTo(theater, ROOM_STATUS.ACTIVE);
  }

  deactivate(theater: Theater): void {
    this.transitionTo(theater, ROOM_STATUS.INACTIVE);
  }

  close(theater: Theater): void {
    this.transitionTo(theater, ROOM_STATUS.CLOSED);
  }

  // Opened rooms are closed instead, so their history stays.
  assertDeletable(): void {
    if (!this.isDraft) {
      throw new RoomNotDraftException();
    }
  }

  // Read-only once the room or its theater is closed.
  assertEditable(theater: Theater): void {
    Room.assertTheaterOpen(theater);

    if (this.props.status === ROOM_STATUS.CLOSED) {
      throw new RoomClosedException();
    }
  }

  private static normalize(details: RoomDetails): RoomDetails {
    // Copied field by field so stray keys never reach props.
    return {
      code: Room.normalizeCode(details.code),
      name: details.name.trim(),
    };
  }

  private toDetails(): RoomDetails {
    const { id: _id, theaterId: _theaterId, status: _status, ...details } = this.props;
    return details;
  }

  private transitionTo(theater: Theater, status: RoomStatus): void {
    this.assertEditable(theater);

    if (status === this.props.status) {
      return;
    }

    if (!ROOM_STATUS_TRANSITIONS[this.props.status].includes(status)) {
      throw new RoomInvalidStatusTransitionException();
    }

    this.props.status = status;
  }

  private static assertTheaterOpen(theater: Theater): void {
    if (theater.isClosed) {
      throw new TheaterClosedException();
    }
  }

  get isDraft(): boolean {
    return this.props.status === ROOM_STATUS.DRAFT;
  }

  get isClosed(): boolean {
    return this.props.status === ROOM_STATUS.CLOSED;
  }

  get id(): string {
    return this.props.id;
  }

  get theaterId(): string {
    return this.props.theaterId;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get status(): RoomStatus {
    return this.props.status;
  }
}
