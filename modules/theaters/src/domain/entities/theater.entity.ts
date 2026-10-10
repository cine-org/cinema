import { omitUndefined, PhoneNumber, Slug } from '@repo/common';
import {
  TheaterClosedException,
  TheaterInvalidStatusTransitionException,
  TheaterNotDraftException,
} from '../exceptions';

export const THEATER_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CLOSED: 'CLOSED',
} as const;

export type TheaterStatus = (typeof THEATER_STATUS)[keyof typeof THEATER_STATUS];

const THEATER_STATUS_TRANSITIONS: Record<TheaterStatus, readonly TheaterStatus[]> = {
  DRAFT: [THEATER_STATUS.ACTIVE],
  ACTIVE: [THEATER_STATUS.INACTIVE, THEATER_STATUS.CLOSED],
  INACTIVE: [THEATER_STATUS.ACTIVE, THEATER_STATUS.CLOSED],
  CLOSED: [],
};

export type TheaterProps = {
  readonly id: string;
  name: string;
  slug: Slug;
  streetAddress: string;
  ward: string;
  province: string;
  phoneNumber: PhoneNumber | null;
  status: TheaterStatus;
};

export type TheaterDetails = {
  readonly name: string;
  readonly slug: string;
  readonly streetAddress: string;
  readonly ward: string;
  readonly province: string;
  readonly phoneNumber?: string | null;
};

export class Theater {
  private constructor(private readonly props: TheaterProps) {}

  static create(details: TheaterDetails): Theater {
    return new Theater({
      id: crypto.randomUUID(),
      ...Theater.normalize(details),
      status: THEATER_STATUS.DRAFT,
    });
  }

  static restore(props: TheaterProps): Theater {
    return new Theater({ ...props });
  }

  activate(): void {
    this.transitionTo(THEATER_STATUS.ACTIVE);
  }

  deactivate(): void {
    this.transitionTo(THEATER_STATUS.INACTIVE);
  }

  close(): void {
    this.transitionTo(THEATER_STATUS.CLOSED);
  }

  update(details: Partial<TheaterDetails>): void {
    this.assertNotClosed();
    const normalized = Theater.normalize({ ...this.toDetails(), ...omitUndefined(details) });

    // Public URLs stay stable once the theater has opened.
    if (!this.isDraft && normalized.slug.value !== this.props.slug.value) {
      throw new TheaterNotDraftException({
        message: 'Slug can only change while the theater is a draft',
      });
    }

    Object.assign(this.props, normalized);
  }

  // Opened theaters are closed instead, so their history stays.
  assertDeletable(): void {
    if (!this.isDraft) {
      throw new TheaterNotDraftException();
    }
  }

  private static normalize(details: TheaterDetails): Omit<TheaterProps, 'id' | 'status'> {
    return {
      name: details.name.trim(),
      slug: Slug.create(details.slug),
      streetAddress: details.streetAddress.trim(),
      ward: details.ward.trim(),
      province: details.province.trim(),
      phoneNumber: details.phoneNumber ? PhoneNumber.create(details.phoneNumber) : null,
    };
  }

  private toDetails(): TheaterDetails {
    const { id: _id, status: _status, slug, phoneNumber, ...details } = this.props;
    return { ...details, slug: slug.value, phoneNumber: phoneNumber?.value ?? null };
  }

  private transitionTo(status: TheaterStatus): void {
    this.assertNotClosed();

    if (status === this.props.status) {
      return;
    }

    if (!THEATER_STATUS_TRANSITIONS[this.props.status].includes(status)) {
      throw new TheaterInvalidStatusTransitionException();
    }

    this.props.status = status;
  }

  private assertNotClosed(): void {
    if (this.props.status === THEATER_STATUS.CLOSED) {
      throw new TheaterClosedException();
    }
  }

  get isDraft(): boolean {
    return this.props.status === THEATER_STATUS.DRAFT;
  }

  get isClosed(): boolean {
    return this.props.status === THEATER_STATUS.CLOSED;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): Slug {
    return this.props.slug;
  }

  get streetAddress(): string {
    return this.props.streetAddress;
  }

  get ward(): string {
    return this.props.ward;
  }

  get province(): string {
    return this.props.province;
  }

  get phoneNumber(): PhoneNumber | null {
    return this.props.phoneNumber;
  }

  get status(): TheaterStatus {
    return this.props.status;
  }
}
