import { IamInvalidException } from '../exceptions';

export class PermissionCode {
  private constructor(private readonly code: string) {}

  static create(value: string): PermissionCode {
    const code = value.trim();

    if (code.length === 0) {
      throw new IamInvalidException({ message: 'Permission code is required' });
    }

    return new PermissionCode(code);
  }

  get value(): string {
    return this.code;
  }

  equals(other: PermissionCode): boolean {
    return this.code === other.code;
  }
}
