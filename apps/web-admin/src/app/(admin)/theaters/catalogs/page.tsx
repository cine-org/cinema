import { notFound } from 'next/navigation';
import { can } from '@/lib/access';
import { CURRENT_ACCESS } from '../../_data/mock-session';
import { PageHeader } from '@/components/page-header';
import { getCatalogs } from '../_data/mock-catalogs';
import { CatalogCard } from './_components/catalog-card';

export const metadata = { title: 'Catalogs' };

export default async function CatalogsPage() {
  const cards = (await getCatalogs()).map((catalog) => ({
    catalog,
    canCreate: can(CURRENT_ACCESS, `${catalog.id}:create`),
    canUpdate: can(CURRENT_ACCESS, `${catalog.id}:update`),
    canDelete: can(CURRENT_ACCESS, `${catalog.id}:delete`),
  }));
  // this page is for editing, so someone who can change none of them has nothing to do here
  if (!cards.some((c) => c.canCreate || c.canUpdate || c.canDelete)) notFound();

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: '/theaters', label: 'Back to theaters' }} title="Catalogs" />
      <div className="space-y-6">
        {cards.map(({ catalog, ...flags }) => (
          <CatalogCard key={catalog.id} catalog={catalog} {...flags} />
        ))}
      </div>
    </div>
  );
}
