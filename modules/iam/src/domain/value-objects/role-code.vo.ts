import { IamInvalidException } from '../exceptions';

export class RoleCode {
  private constructor(private readonly code: string) {}

  static create(value: string): RoleCode {
    const code = value.trim();

    if (code.length === 0) {
      throw new IamInvalidException({ message: 'Role code is required' });
    }

    return new RoleCode(code);
  }

  get value(): string {
    return this.code;
  }

  equals(other: RoleCode): boolean {
    return this.code === other.code;
  }
}
