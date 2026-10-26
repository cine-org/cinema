import { toast } from 'sonner';
import type { Result } from './result';

// shows how an admin api call ended; returns whether it worked
export const toastResult = (result: Result, done: string) => {
  if (result.ok) toast.success(done);
  else toast.error(result.message);
  return result.ok;
};
