const ROW_HEIGHT = 56; // h-14
const HEAD_HEIGHT = 40; // h-10

// fixed height for a full page of rows keeps the layout still while the data changes
export const listMinHeight = (limit: number) =>
  `${Math.min(limit, 10) * ROW_HEIGHT + HEAD_HEIGHT}px`;
