import { THEATERS } from './mock-theaters';
import type { Cluster, ClusterView, Overview, Theater, TheaterStatus } from './types';

const CLUSTERS: Cluster[] = [
  { id: 'hcm', name: 'Ho Chi Minh City' },
  { id: 'hanoi', name: 'Hanoi' },
  { id: 'da-nang', name: 'Da Nang' },
  { id: 'can-tho', name: 'Can Tho' },
  { id: 'hai-phong', name: 'Hai Phong' },
  { id: 'dong-nai', name: 'Dong Nai' },
];

const STATUSES: TheaterStatus[] = ['draft', 'active', 'inactive', 'closed'];

const sum = (theaters: Theater[], pick: (t: Theater) => number) =>
  theaters.reduce((n, t) => n + pick(t), 0);

const view = (cluster: Cluster, theaters: Theater[]): ClusterView => ({
  cluster,
  theaters,
  rooms: sum(theaters, (t) => t.rooms),
  capacity: sum(theaters, (t) => t.capacity),
  inactiveSeats: sum(theaters, (t) => t.inactiveSeats),
  byStatus: Object.fromEntries(
    STATUSES.map((s) => [s, theaters.filter((t) => t.status === s).length]),
  ) as Record<TheaterStatus, number>,
});

export const getClusterViews = async (): Promise<ClusterView[]> =>
  CLUSTERS.map((c) =>
    view(
      c,
      THEATERS.filter((t) => t.clusterId === c.id),
    ),
  );

export const getClusterView = async (id: string) =>
  (await getClusterViews()).find((v) => v.cluster.id === id);

export const getOverview = async (): Promise<Overview> => {
  const views = await getClusterViews();
  const total = (pick: (v: ClusterView) => number) => views.reduce((n, v) => n + pick(v), 0);
  return {
    clusters: views.length,
    theaters: THEATERS.length,
    rooms: total((v) => v.rooms),
    capacity: total((v) => v.capacity),
  };
};
