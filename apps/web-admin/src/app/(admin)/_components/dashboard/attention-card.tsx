import { Armchair, Building2, ShieldCheck, UserPlus, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ATTENTION, type AttentionKind } from '../../_data/mock-dashboard';

const ICONS: Record<AttentionKind, LucideIcon> = {
  seats: Armchair,
  theater: Building2,
  users: UserPlus,
  role: ShieldCheck,
};

export const AttentionCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Needs attention</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-4">
        {ATTENTION.map(({ id, kind, text, when }) => {
          const Icon = ICONS[kind];
          return (
            <li key={id} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 text-sm">
                <div>{text}</div>
                <div className="text-muted-foreground">{when}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContent>
  </Card>
);
