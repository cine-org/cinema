// a bare trend line; the number it belongs to is always printed next to it
export const Sparkline = ({ values }: { values: number[] }) => {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 96},${30 - ((v - min) / span) * 26}`)
    .join(' ');
  return (
    <svg viewBox="0 0 96 32" className="h-8 w-24 text-muted-foreground/60" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
