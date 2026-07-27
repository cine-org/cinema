import { SystemRoleImmutableException } from '../exceptions';
import { RoleCode, RoleType } from '../value-objects';

export type RoleProps = {
  readonly id: string;
  readonly code: RoleCode;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly type: RoleType;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateRoleProps = {
  readonly id: string;
  readonly code: RoleCode;
  readonly name?: string | null;
  readonly description?: string | null;
  readonly now: Date;
};

export class Role {
  private constructor(private readonly props: RoleProps) {}

  static create(props: CreateRoleProps): Role {
    return new Role({
      id: props.id,
      code: props.code,
      name: props.name ?? null,
      description: props.description ?? null,
      type: RoleType.custom(),
      createdAt: props.now,
      updatedAt: props.now,
    });
  }

  static restore(props: RoleProps): Role {
    return new Role(props);
  }

  assertCustom(): void {
    if (this.props.type.isSystem()) {
      throw new SystemRoleImmutableException();
    }
  }

  update(input: {
    readonly name?: string | null;
    readonly description?: string | null;
    readonly updatedAt: Date;
  }): Role {
    this.assertCustom();

    return new Role({
      ...this.props,
      name: input.name ?? null,
      description: input.description ?? null,
      updatedAt: input.updatedAt,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get code(): RoleCode {
    return this.props.code;
  }

  get name(): string | null | undefined {
    return this.props.name;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get type(): RoleType {
    return this.props.type;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
