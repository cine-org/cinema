import { MOCK_CAPACITY } from './mock-layout';
import type { Room, Theater } from './types';

// TODO: replace with the admin api. Clusters are not stored yet: until they are, a cluster is the
// province a theater sits in. Every theater belongs to exactly one cluster.

// free photos from unsplash.com
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

type TheaterInit = Pick<Theater, 'id' | 'name' | 'slug' | 'clusterId' | 'status' | 'rooms'> &
  Partial<Omit<Theater, 'capacity'>>;

const theater = (init: TheaterInit): Theater => ({
  ward: 'Phường 1',
  address: '1 Đường Chính',
  phone: '028 3822 0000',
  email: `${init.slug}@cinema.example`,
  coverImageUrl: null,
  inactiveSeats: 0,
  ...init,
  capacity: 0,
});

const RAW: Theater[] = [
  theater({
    id: 't01',
    coverImageUrl: unsplash('1762541693135-fb989de961e1'),
    name: 'Cinema Quận 1',
    slug: 'q1-nguyen-hue',
    clusterId: 'hcm',
    status: 'active',
    rooms: 8,
    address: '12 Nguyễn Huệ',
    ward: 'Bến Nghé',
  }),
  theater({
    id: 't02',
    coverImageUrl: unsplash('1771574203200-0ec88f162fe0'),
    name: 'Cinema Thủ Đức',
    slug: 'thu-duc',
    clusterId: 'hcm',
    status: 'active',
    rooms: 4,
    inactiveSeats: 4,
    address: '88 Võ Văn Ngân',
    ward: 'Linh Chiểu',
  }),
  theater({
    id: 't03',
    coverImageUrl: unsplash('1761502479994-3a5e07ec243e'),
    name: 'Cinema Gò Vấp',
    slug: 'go-vap',
    clusterId: 'hcm',
    status: 'active',
    rooms: 6,
  }),
  theater({
    id: 't04',
    coverImageUrl: unsplash('1751823886813-0cfc86cb9478'),
    name: 'Cinema Cầu Giấy',
    slug: 'cau-giay',
    clusterId: 'hanoi',
    status: 'active',
    rooms: 6,
  }),
  theater({
    id: 't05',
    coverImageUrl: unsplash('1759230766134-e3ff1c27d20e'),
    name: 'Cinema Long Biên',
    slug: 'long-bien',
    clusterId: 'hanoi',
    status: 'active',
    rooms: 3,
  }),
  theater({
    id: 't06',
    coverImageUrl: unsplash('1774619755413-7c31ab3aabc3'),
    name: 'Cinema Đà Nẵng',
    slug: 'da-nang-hai-chau',
    clusterId: 'da-nang',
    status: 'active',
    rooms: 5,
  }),
  theater({
    id: 't07',
    coverImageUrl: unsplash('1759103570737-8485420df3a5'),
    name: 'Cinema Cần Thơ',
    slug: 'can-tho-ninh-kieu',
    clusterId: 'can-tho',
    status: 'inactive',
    rooms: 5,
  }),
  theater({
    id: 't08',
    coverImageUrl: unsplash('1775880307117-fea37dd1a144'),
    name: 'Cinema Hải Phòng',
    slug: 'hai-phong-le-chan',
    clusterId: 'hai-phong',
    status: 'closed',
    rooms: 4,
  }),
  theater({
    id: 't09',
    name: 'Cinema Biên Hòa',
    slug: 'bien-hoa',
    clusterId: 'dong-nai',
    status: 'draft',
    rooms: 0,
  }),
];

// broken seats per room; every other room has none
const INACTIVE: Record<string, number> = { 't02-r3': 4 };

const roomsOf = (t: Theater): Room[] =>
  Array.from({ length: t.rooms }, (_, i) => {
    const id = `${t.id}-r${i + 1}`;
    const idle = t.id === 't02' && i === 3;
    return {
      id,
      theaterId: t.id,
      code: `R${i + 1}`,
      name: `Room ${i + 1}`,
      status: t.status === 'closed' ? 'closed' : idle ? 'inactive' : 'active',
      capacity: MOCK_CAPACITY,
      inactiveSeats: INACTIVE[id] ?? 0,
      layout: { published: idle ? 1 : 2, draft: i === 0 ? 3 : null },
    };
  });

// a theater's capacity is the sum of its rooms
export const THEATERS: Theater[] = RAW.map((t) => ({
  ...t,
  capacity: roomsOf(t).reduce((n, r) => n + r.capacity, 0),
}));

export const getTheater = async (id: string): Promise<Theater | undefined> =>
  THEATERS.find((t) => t.id === id);

export const getRooms = async (theaterId: string): Promise<Room[]> => {
  const t = await getTheater(theaterId);
  return t ? roomsOf(t) : [];
};

export const getRoom = async (theaterId: string, roomId: string): Promise<Room | undefined> =>
  (await getRooms(theaterId)).find((r) => r.id === roomId);
