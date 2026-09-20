import { Prisma } from './generated/prisma/client';

export const PRISMA_ERROR_CODE = {
  UNIQUE_CONSTRAINT_FAILED: 'P2002',
  FOREIGN_KEY_CONSTRAINT_FAILED: 'P2003',
  RECORD_REQUIRED_BUT_NOT_FOUND: 'P2025',
  VALUE_TOO_LONG_FOR_COLUMN: 'P2000',
  RECORD_NOT_FOUND_FOR_WHERE: 'P2001',
  CONSTRAINT_FAILED: 'P2004',
  NULL_CONSTRAINT_VIOLATION: 'P2011',
  MISSING_REQUIRED_VALUE: 'P2012',
  REQUIRED_RELATION_VIOLATION: 'P2014',
} as const;

export type PrismaErrorCode = (typeof PRISMA_ERROR_CODE)[keyof typeof PRISMA_ERROR_CODE];

export type PrismaErrorHandlerMap = Partial<Record<PrismaErrorCode, () => Error>>;

export function throwIfPrismaError(error: unknown, handlers: PrismaErrorHandlerMap): void {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return;
  }

  const createException = handlers[error.code as PrismaErrorCode];

  if (createException) {
    throw createException();
  }
}
