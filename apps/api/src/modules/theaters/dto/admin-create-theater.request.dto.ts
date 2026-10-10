import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhoneNumber, SLUG_PATTERN } from '@repo/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, ValidateBy } from 'class-validator';

// Must not throw: an invalid value is passed through so the validator reports the field.
function toE164({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return PhoneNumber.parse(value, 'VN').value;
  } catch {
    return value;
  }
}

// Same check as the domain: class-validator's own list rejects valid VN landlines.
function IsPhoneNumber(): PropertyDecorator {
  return ValidateBy({
    name: 'isPhoneNumber',
    validator: {
      validate: (value: unknown) => {
        try {
          return typeof value === 'string' && !!PhoneNumber.create(value);
        } catch {
          return false;
        }
      },
      defaultMessage: () => '$property must be a valid phone number',
    },
  });
}

export class AdminCreateTheaterRequestDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  readonly name!: string;

  @ApiProperty({ pattern: SLUG_PATTERN.source, maxLength: 100, example: 'cinema-thu-duc' })
  @IsString()
  @Length(1, 100)
  @Matches(SLUG_PATTERN)
  readonly slug!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @Length(1, 255)
  readonly streetAddress!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  readonly ward!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @Length(1, 100)
  readonly province!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Local Vietnamese or E.164 format; stored as E.164.',
    example: '+842812345678',
  })
  @IsOptional()
  @Transform(toE164)
  @IsPhoneNumber()
  readonly phoneNumber?: string | null;
}
