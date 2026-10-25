import { LinkCard } from '@/components/link-card';

type Props = { title: string; names: string[]; href: string; canManage: boolean };

export const CatalogSummaryCard = ({ title, names, href, canManage }: Props) => (
  <LinkCard title={title} href={canManage ? href : null} className="h-full">
    <ul className="divide-y divide-border text-sm">
      {names.map((name) => (
        <li key={name} className="py-2 first:pt-0 last:pb-0">
          {name}
        </li>
      ))}
    </ul>
  </LinkCard>
);
