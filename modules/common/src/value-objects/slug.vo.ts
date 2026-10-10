import { InvalidSlugException } from '../exceptions';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class Slug {
  private constructor(readonly value: string) {}

  // Strict: must already be a slug.
  static create(value: string): Slug {
    if (!SLUG_PATTERN.test(value)) {
      throw new InvalidSlugException();
    }

    return new Slug(value);
  }

  // Lenient: builds a slug from free text.
  static fromText(text: string): Slug {
    const value = text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      // NFD does not split đ.
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return Slug.create(value);
  }
}
