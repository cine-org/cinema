import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// TODO: export the dashboard figures once the api can produce a report
export const ExportReportButton = () => (
  <Button variant="outline" className="h-10">
    <Download />
    Export report
  </Button>
);
