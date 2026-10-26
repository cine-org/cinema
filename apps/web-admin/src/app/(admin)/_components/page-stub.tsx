import { Card, CardContent } from '@/components/ui/card';

// placeholder until the page is designed; replace it, do not grow it
export const PageStub = ({ title, summary }: { title: string; summary: string }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <Card>
      <CardContent className="py-16 text-center text-sm text-muted-foreground">
        {summary}
      </CardContent>
    </Card>
  </div>
);
