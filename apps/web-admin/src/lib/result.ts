// what a change to the admin api reports back; every mutations file returns this
export type Result = { ok: true } | { ok: false; message: string };

// stands in for an api call until it is wired
export const notWired = (call: string): Result => ({
  ok: false,
  message: `Not done: ${call} is not wired to the admin api yet`,
});
