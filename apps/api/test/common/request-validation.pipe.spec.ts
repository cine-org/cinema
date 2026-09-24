import { BadRequestException } from '@nestjs/common';
import { COMMON_ERROR_CODE, type ErrorDetail } from '@repo/common';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, Min, ValidateNested } from 'class-validator';
import { RequestValidationPipe } from '@/common/pipes';

class AddressDto {
  @IsInt()
  @Min(1)
  readonly floor!: number;
}

class SampleDto {
  @IsEmail()
  readonly email!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  readonly address!: AddressDto;
}

describe('RequestValidationPipe', () => {
  const pipe = new RequestValidationPipe();
  const metadata = { type: 'body', metatype: SampleDto } as const;

  it('returns the transformed DTO when input is valid', async () => {
    const result: unknown = await pipe.transform(
      { email: 'a@b.co', address: { floor: 2 } },
      metadata,
    );

    expect(result).toBeInstanceOf(SampleDto);
  });

  it('reports every failing field, with nested paths and unknown fields', async () => {
    const error: unknown = await pipe
      .transform({ email: 'nope', address: { floor: 0 }, role: 'admin' }, metadata)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    const response = (error as BadRequestException).getResponse() as {
      code: string;
      errors: ErrorDetail[];
    };
    expect(response.code).toBe(COMMON_ERROR_CODE.VALIDATION);
    expect(response.errors.map(({ field, code }) => `${field}:${code}`)).toEqual(
      expect.arrayContaining(['email:isEmail', 'address.floor:min', 'role:whitelistValidation']),
    );
  });
});
