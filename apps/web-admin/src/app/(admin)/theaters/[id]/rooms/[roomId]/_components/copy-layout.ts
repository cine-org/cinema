import { toast } from 'sonner';

// there is no rollback: an old layout is restored by pasting its copy into the draft
export const copyLayout = async (json: string) => {
  try {
    await navigator.clipboard.writeText(json);
    toast.success('Layout copied');
  } catch {
    toast.error('Could not copy to the clipboard');
  }
};
