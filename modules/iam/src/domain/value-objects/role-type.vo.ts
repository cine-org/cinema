import { IamInvalidException } from '../exceptions';

export const ROLE_TYPE = {
  SYSTEM: 'SYSTEM',
  CUSTOM: 'CUSTOM',
} as const;

export type RoleTypeValue = (typeof ROLE_TYPE)[keyof typeof ROLE_TYPE];

export class RoleType {
  private constructor(private readonly type: RoleTypeValue) {}

  static system(): RoleType {
    return new RoleType(ROLE_TYPE.SYSTEM);
  }

  static custom(): RoleType {
    return new RoleType(ROLE_TYPE.CUSTOM);
  }

  static create(value: string): RoleType {
    if (value === ROLE_TYPE.SYSTEM) {
      return RoleType.system();
    }

    if (value === ROLE_TYPE.CUSTOM) {
      return RoleType.custom();
    }

    throw new IamInvalidException({ message: 'Invalid role type' });
  }

  get value(): RoleTypeValue {
    return this.type;
  }

  isSystem(): boolean {
    return this.type === ROLE_TYPE.SYSTEM;
  }

  isCustom(): boolean {
    return this.type === ROLE_TYPE.CUSTOM;
  }
}
