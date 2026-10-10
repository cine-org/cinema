import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { InvalidPhoneNumberException } from '../exceptions';

export class PhoneNumber {
  private constructor(readonly value: string) {}

  // Strict: must already be E.164.
  static create(value: string): PhoneNumber {
    const parsed = parsePhoneNumberFromString(value);

    if (!parsed?.isValid() || parsed.number !== value) {
      throw new InvalidPhoneNumberException();
    }

    return new PhoneNumber(value);
  }

  // Lenient: accepts local formats for the given country.
  static parse(input: string, defaultCountry: CountryCode): PhoneNumber {
    const parsed = parsePhoneNumberFromString(input, defaultCountry);

    if (!parsed?.isValid()) {
      throw new InvalidPhoneNumberException();
    }

    return new PhoneNumber(parsed.number);
  }
}
