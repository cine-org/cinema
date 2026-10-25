// the shapes the theaters screens work with; the admin api responses are mapped into these

export type TheaterStatus = 'draft' | 'active' | 'inactive' | 'closed';

export type Theater = {
  id: string;
  name: string;
  slug: string;
  clusterId: string;
  status: TheaterStatus;
  ward: string;
  address: string;
  phone: string;
  email: string;
  // shown as the cover of the theater page and on its card; null falls back to a placeholder
  coverImageUrl: string | null;
  rooms: number;
  // seats of every room by type, inactive seats included
  capacity: number;
  inactiveSeats: number;
};

export type Room = {
  id: string;
  theaterId: string;
  code: string;
  name: string;
  status: TheaterStatus;
  capacity: number;
  inactiveSeats: number;
  // version numbers; null when there is none
  layout: { published: number | null; draft: number | null };
};

export type Cluster = { id: string; name: string };

export type ClusterView = {
  cluster: Cluster;
  theaters: Theater[];
  rooms: number;
  capacity: number;
  inactiveSeats: number;
  byStatus: Record<TheaterStatus, number>;
};

export type Overview = { clusters: number; theaters: number; rooms: number; capacity: number };

// a catalog shared by every theater; width is in grid cells
export type SeatType = { code: string; name: string; width: number; maxOccupancy: number };

export type Seat = { x: number; y: number; type: string; active: boolean };
export type Layout = { rows: number; cols: number; seats: Seat[] };

export type LayoutStatus = 'draft' | 'published' | 'retired';
export type LayoutVersion = {
  version: number;
  status: LayoutStatus;
  publishedAt: string | null;
};

export type CatalogItem = { code: string; name: string; description: string };
export type CatalogColumn = { id: string; label: string };
export type CatalogRow = { code: string; values: Record<string, string> };
export type Catalog = {
  // also the permission prefix: "seat-types" gives seat-types:create and so on
  id: string;
  title: string;
  note: string;
  noun: string;
  columns: CatalogColumn[];
  rows: CatalogRow[];
};
