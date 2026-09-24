import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Page } from '@repo/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseEnvelopeInterceptor } from '@/common/interceptors';
import {
  ApiPaginated,
  ApiSuccess,
  PaginatedResponse,
  RawResponse,
  SuccessResponse,
} from '@/common/responses';

class ItemDto {}

class SampleController {
  plain() {}

  @ApiSuccess(ItemDto)
  success() {}

  @ApiPaginated(ItemDto)
  paginated() {}
}

@RawResponse()
class RawController {
  plain() {}
}

function run(controller: object, handler: () => void, result: unknown) {
  const context = {
    getHandler: () => handler,
    getClass: () => controller,
  } as unknown as ExecutionContext;
  const next: CallHandler = { handle: () => of(result) };

  return lastValueFrom(new ResponseEnvelopeInterceptor(new Reflector()).intercept(context, next));
}

describe('ResponseEnvelopeInterceptor', () => {
  const { prototype } = SampleController;

  it.each([
    ['without metadata', prototype.plain],
    ['@ApiSuccess', prototype.success],
  ])('wraps %s routes in SuccessResponse', async (_, handler) => {
    const result = await run(SampleController, handler, { id: 'user-1' });

    expect(result).toBeInstanceOf(SuccessResponse);
    expect(result).toMatchObject({ success: true, data: { id: 'user-1' } });
  });

  it('maps a Page into PaginatedResponse for @ApiPaginated routes', async () => {
    const page: Page<{ id: string }> = { items: [{ id: 'user-1' }], total: 21, page: 2, limit: 10 };

    const result = await run(SampleController, prototype.paginated, page);

    expect(result).toBeInstanceOf(PaginatedResponse);
    expect(result).toMatchObject({
      success: true,
      data: [{ id: 'user-1' }],
      meta: {
        total: 21,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    });
  });

  it('leaves @RawResponse() controllers untouched', async () => {
    await expect(
      run(RawController, RawController.prototype.plain, { status: 'ok' }),
    ).resolves.toEqual({
      status: 'ok',
    });
  });
});
