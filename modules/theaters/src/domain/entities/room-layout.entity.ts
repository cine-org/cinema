import {
  RoomLayoutEmptyException,
  RoomLayoutInvalidGridException,
  RoomLayoutNotDraftException,
  RoomLayoutNotPublishedException,
} from '../exceptions';
import type { Room } from './room.entity';
import type { Theater } from './theater.entity';

export const ROOM_LAYOUT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  RETIRED: 'RETIRED',
} as const;

export type RoomLayoutStatus = (typeof ROOM_LAYOUT_STATUS)[keyof typeof ROOM_LAYOUT_STATUS];

export const MAX_GRID_ROWS = 30;
export const MAX_GRID_COLS = 50;

export type RoomLayoutProps = {
  readonly id: string;
  readonly roomId: string;
  readonly version: number;
  gridRows: number;
  gridCols: number;
  status: RoomLayoutStatus;
  publishedAt: Date | null;
  // Set by the database; null until saved. Detects concurrent writes.
  readonly updatedAt: Date | null;
};

export type RoomLayoutGrid = Pick<RoomLayoutProps, 'gridRows' | 'gridCols'>;

// Only drafts change; a published version stays frozen for the showtimes using it.
export class RoomLayout {
  private constructor(private readonly props: RoomLayoutProps) {}

  static createDraft(
    room: Room,
    theater: Theater,
    version: number,
    grid: RoomLayoutGrid,
  ): RoomLayout {
    room.assertEditable(theater);

    return new RoomLayout({
      id: crypto.randomUUID(),
      roomId: room.id,
      version,
      ...RoomLayout.normalizeGrid(grid),
      status: ROOM_LAYOUT_STATUS.DRAFT,
      publishedAt: null,
      updatedAt: null,
    });
  }

  static restore(props: RoomLayoutProps): RoomLayout {
    return new RoomLayout({ ...props });
  }

  // Callers check room.assertEditable once per command.
  resize(grid: RoomLayoutGrid): void {
    this.assertDraft();
    Object.assign(this.props, RoomLayout.normalizeGrid(grid));
  }

  // The caller retires the previous version in the same transaction.
  publish(seatCount: number): void {
    this.assertDraft();

    if (seatCount < 1) {
      throw new RoomLayoutEmptyException();
    }

    this.props.status = ROOM_LAYOUT_STATUS.PUBLISHED;
    this.props.publishedAt = new Date();
  }

  retire(): void {
    if (this.props.status !== ROOM_LAYOUT_STATUS.PUBLISHED) {
      throw new RoomLayoutNotPublishedException();
    }

    this.props.status = ROOM_LAYOUT_STATUS.RETIRED;
  }

  assertDraft(): void {
    if (this.props.status !== ROOM_LAYOUT_STATUS.DRAFT) {
      throw new RoomLayoutNotDraftException();
    }
  }

  private static normalizeGrid(grid: RoomLayoutGrid): RoomLayoutGrid {
    const { gridRows, gridCols } = grid;

    if (
      !RoomLayout.isGridSize(gridRows, MAX_GRID_ROWS) ||
      !RoomLayout.isGridSize(gridCols, MAX_GRID_COLS)
    ) {
      throw new RoomLayoutInvalidGridException();
    }

    return { gridRows, gridCols };
  }

  private static isGridSize(value: number, max: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= max;
  }

  get isDraft(): boolean {
    return this.props.status === ROOM_LAYOUT_STATUS.DRAFT;
  }

  get id(): string {
    return this.props.id;
  }

  get roomId(): string {
    return this.props.roomId;
  }

  get version(): number {
    return this.props.version;
  }

  get gridRows(): number {
    return this.props.gridRows;
  }

  get gridCols(): number {
    return this.props.gridCols;
  }

  get status(): RoomLayoutStatus {
    return this.props.status;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }
}
