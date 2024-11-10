import { forwardRef } from 'react';

import CloseIc from '@/assets/icons/close.svg?react';
import SearchIc from '@/assets/icons/search.svg?react';
import cn from '@/utils/cn';

import { inputVariants, inputWrapperVariants, SIZE_VARIANTS, VALIDATION_STATE } from '../TextInput';

import type { InputHTMLAttributes, KeyboardEvent, ChangeEvent, Ref } from 'react';

interface SearchInputProps
  extends Pick<InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'className'> {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSearch: (value: string) => void;
}

function SearchInput(
  { value, onChange, onClear, onSearch, className, ...props }: SearchInputProps,
  ref: Ref<HTMLInputElement>
) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
    }
  };

  return (
    <div
      role="search"
      className={cn(inputWrapperVariants({ size: SIZE_VARIANTS.md }), 'relative', className)}
    >
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(inputVariants({ validation: VALIDATION_STATE.default }), 'pr-10', className)}
        {...props}
      />
      <div className="absolute right-3 top-3">
        {value ? (
          <button type="button" onClick={onClear} aria-label="검색어 지우기">
            <CloseIc className="fill-main" aria-hidden />
          </button>
        ) : (
          <button type="button" onClick={() => onSearch(value)} aria-label="검색하기">
            <SearchIc className="fill-main" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

export default forwardRef<HTMLInputElement, SearchInputProps>(SearchInput);
