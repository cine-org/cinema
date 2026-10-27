import { Injectable } from '@nestjs/common';
import type { Page } from '@repo/common';
import { DatabaseReadClient, type Prisma } from '@repo/database';
import type {
  ListTheatersQueryProps,
  TheaterListFilter,
  TheaterReadRepository,
  TheaterView,
} from '../../app';

const THEATER_VIEW_SELECT = {
  id: true,
  name: true,
  slug: true,
  streetAddress: true,
  ward: true,
  province: true,
  phoneNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TheaterSelect;

@Injectable()
export class PrismaTheaterReadRepository implements TheaterReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async findById(id: string): Promise<TheaterView | null> {
    return this.db.theater.findUnique({ where: { id }, select: THEATER_VIEW_SELECT });
  }

  async findBySlug(slug: string): Promise<TheaterView | null> {
    return this.db.theater.findUnique({ where: { slug }, select: THEATER_VIEW_SELECT });
  }

  async list({ filter, sort, page }: ListTheatersQueryProps): Promise<Page<TheaterView>> {
    const where = toWhere(filter);

    const [items, total] = await Promise.all([
      this.db.theater.findMany({
        where,
        select: THEATER_VIEW_SELECT,
        // id breaks ties so rows never shift between pages.
        orderBy: [{ [sort.field]: sort.order }, { id: 'asc' }],
        skip: (page.page - 1) * page.limit,
        take: page.limit,
      }),
      this.db.theater.count({ where }),
    ]);

    return { items, total, page: page.page, limit: page.limit };
  }
}

function toWhere({ status, province, q, within }: TheaterListFilter): Prisma.TheaterWhereInput {
  return {
    OR: within
      ? [{ clusterId: { in: [...within.clusterIds] } }, { id: { in: [...within.theaterIds] } }]
      : undefined,
    status,
    province: province ? { equals: province, mode: 'insensitive' } : undefined,
    name: q ? { contains: q, mode: 'insensitive' } : undefined,
  };
}
