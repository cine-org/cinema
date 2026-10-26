import { BackLink } from './back-link';

type Props = {
  back: { href: string; label: string };
  title: string;
  // shown beside the title, such as a status badge
  badge?: React.ReactNode;
  actions?: React.ReactNode;
};

export const PageHeader = ({ back, title, badge, actions }: Props) => (
  <div className="space-y-2">
    <BackLink href={back.href}>{back.label}</BackLink>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {badge}
      </div>
      {actions}
    </div>
  </div>
);
