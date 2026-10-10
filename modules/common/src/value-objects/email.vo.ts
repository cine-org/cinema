import { InvalidEmailException } from '../exceptions';

// Sanity check only; email verification proves the mailbox exists.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

export class Email {
  private constructor(readonly value: string) {}

  static create(input: string): Email {
    const value = input.trim().toLowerCase();

    if (value.length > MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
      throw new InvalidEmailException();
    }

    return new Email(value);
  }
}
