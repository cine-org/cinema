import { Badge } from '@/components/ui/badge';

export type Tone = 'success' | 'warning' | 'danger' | 'muted';

const TONES: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  muted: 'bg-muted text-muted-foreground',
};

// every status badge picks one of these, so the same meaning has the same color on every page
export const ToneBadge = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <Badge className={TONES[tone]}>{children}</Badge>
);
