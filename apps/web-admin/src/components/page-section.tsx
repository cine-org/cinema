export const PageSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
    {children}
  </section>
);
