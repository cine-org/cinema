import { MOCK_SEAT_TYPES } from './mock-layout';
import type { Catalog, CatalogColumn, CatalogItem, CatalogRow, SeatType } from './types';

// TODO: replace with the admin api; seat types already have endpoints, the other two do not yet

// what a room offers on screen
const EXPERIENCE_TYPES: CatalogItem[] = [
  { code: 'STANDARD', name: 'Standard', description: 'Regular digital projection' },
  { code: 'IMAX', name: 'IMAX', description: 'Large format screen with laser projection' },
  { code: 'FOURDX', name: '4DX', description: 'Motion seats and environmental effects' },
  {
    code: 'DOLBY_CINEMA',
    name: 'Dolby Cinema',
    description: 'Dolby Vision picture with Atmos sound',
  },
];

// what a room supports for sound
const AUDIO_FORMATS: CatalogItem[] = [
  { code: 'STEREO', name: 'Stereo', description: 'Two channel sound' },
  { code: 'SURROUND_51', name: '5.1 Surround', description: 'Five speakers and a subwoofer' },
  {
    code: 'DOLBY_ATMOS',
    name: 'Dolby Atmos',
    description: 'Object based sound with overhead speakers',
  },
  {
    code: 'DTS_X',
    name: 'DTS:X',
    description: 'Object based sound without a fixed speaker layout',
  },
];

const NAME_AND_DESCRIPTION: CatalogColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'description', label: 'Description' },
];

const fromItems = (items: CatalogItem[]): CatalogRow[] =>
  items.map(({ code, name, description }) => ({ code, values: { name, description } }));

export const getSeatTypes = async (): Promise<SeatType[]> => MOCK_SEAT_TYPES;

export const getCatalogs = async (): Promise<Catalog[]> => [
  {
    id: 'seat-types',
    title: 'Seat types',
    note: 'Drawn on every room layout. Width is counted in grid cells.',
    noun: 'seat type',
    columns: [
      { id: 'name', label: 'Name' },
      { id: 'width', label: 'Width' },
      { id: 'occupancy', label: 'Max occupancy' },
    ],
    rows: (await getSeatTypes()).map(({ code, name, width, maxOccupancy }) => ({
      code,
      values: { name, width: String(width), occupancy: String(maxOccupancy) },
    })),
  },
  {
    id: 'experience-types',
    title: 'Experience types',
    note: 'What a room offers on screen. Each room has one.',
    noun: 'experience type',
    columns: NAME_AND_DESCRIPTION,
    rows: fromItems(EXPERIENCE_TYPES),
  },
  {
    id: 'audio-formats',
    title: 'Audio formats',
    note: 'The sound formats a room supports. A room can have several.',
    noun: 'audio format',
    columns: NAME_AND_DESCRIPTION,
    rows: fromItems(AUDIO_FORMATS),
  },
];
