import { TooManyRequestsException } from '@repo/common';
import { type DatabaseWriteClient, Prisma } from '@repo/database';

// Another request holds the row: wait at most this long, then answer 429.
const LOCK_TIMEOUT = '1s';
const TRANSACTION_TIMEOUT_MS = 5_000;

// Runs `work` in a transaction whose lock waits give up after LOCK_TIMEOUT; `work` takes the locks
// itself. Lock contention becomes a 429.
export async function transactionWithLockTimeout<T>(
  db: DatabaseWriteClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT}'`);
        return work(tx);
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  } catch (error) {
    if (isLockContention(error)) {
      throw new TooManyRequestsException({ retryAfterSeconds: 1, cause: error });
    }
    throw error;
  }
}

// Lock wait over lock_timeout (Postgres 55P03) or the transaction itself timing out.
function isLockContention(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === 'P2028') return true;
  return JSON.stringify(error.meta ?? {}).includes('55P03');
}
