'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from '@/components/search-input';

type Props = Omit<React.ComponentProps<typeof SearchInput>, 'value' | 'onChange'> & {
  // the search the list currently shows
  value: string;
  onSearch: (text: string) => void;
};

export const DebouncedSearch = ({ value, onSearch, ...props }: Props) => {
  const [text, setText] = useState(value);

  // wait for a pause in typing before asking for new data
  useEffect(() => {
    if (text.trim() === value) return;
    const id = setTimeout(() => onSearch(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text, value, onSearch]);

  return <SearchInput {...props} value={text} onChange={(e) => setText(e.target.value)} />;
};
