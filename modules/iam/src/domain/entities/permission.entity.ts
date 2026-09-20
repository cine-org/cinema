import { PermissionCode } from '../value-objects';

export type PermissionProps = {
  readonly id: string;
  readonly code: PermissionCode;
  readonly description?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreatePermissionProps = {
  readonly id: string;
  readonly code: PermissionCode;
  readonly description?: string | null;
  readonly now: Date;
};

export class Permission {
  private constructor(private readonly props: PermissionProps) {}

  static create(props: CreatePermissionProps): Permission {
    return new Permission({
      id: props.id,
      code: props.code,
      description: props.description ?? null,
      createdAt: props.now,
      updatedAt: props.now,
    });
  }

  static restore(props: PermissionProps): Permission {
    return new Permission(props);
  }

  update(input: { readonly description?: string | null; readonly updatedAt: Date }): Permission {
    return new Permission({
      ...this.props,
      description: input.description === undefined ? this.props.description : input.description,
      updatedAt: input.updatedAt,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get code(): PermissionCode {
    return this.props.code;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
