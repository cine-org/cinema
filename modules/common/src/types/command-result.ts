// Commands return only the key of what they touched (CQS); callers query for the rest.
export type CommandResult<K extends string = 'id'> = Readonly<Record<K, string>>;
