// dd/mm/yyyy; UTC keeps server and client output identical
export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { timeZone: 'UTC' }) : '—';
