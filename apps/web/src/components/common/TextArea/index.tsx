import { cva } from 'class-variance-authority';
import { ChangeEvent, forwardRef, Ref, TextareaHTMLAttributes, useRef } from 'react';

import ExclamationIc from '@/assets/icons/exclamation.svg?react';
import cn from '@/utils/cn';

const VALIDATION_STATE = {
  default: 'default',
  error: 'error',
} as const;

const SIZE_VARIANTS = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const;

const textAreaVariants = cva(
  'w-full resize-none rounded-base border bg-white px-3.5 py-2.5 text-body1 text-main placeholder:text-weak',
  {
    variants: {
      validation: {
        [VALIDATION_STATE.default]: 'border-main focus:border-primary',
        [VALIDATION_STATE.error]: 'focus:border-error',
      },
      size: {
        [SIZE_VARIANTS.sm]: 'h-24',
        [SIZE_VARIANTS.md]: 'h-72',
        [SIZE_VARIANTS.lg]: 'h-[40rem]',
      },
    },
    defaultVariants: {
      validation: 'default',
    },
  }
);

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'defaultValue'> {
  defaultValue?: string;
  label?: string;
  description?: string;
  errorMessage?: string;
  required?: boolean;
  maxLength?: number;
  size: keyof typeof SIZE_VARIANTS;
}

function TextArea(
  {
    defaultValue,
    label,
    description,
    errorMessage,
    required,
    maxLength,
    size,
    className,
    onChange,
    ...props
  }: TextAreaProps,
  ref: Ref<HTMLTextAreaElement>
) {
  const textAreaValidation = errorMessage ? VALIDATION_STATE.error : VALIDATION_STATE.default;
  const counterRef = useRef<HTMLParagraphElement>(null);

  const handleCounter = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (maxLength && counterRef.current) {
      counterRef.current.textContent = `${e.target.value.length}/${maxLength}`;
    }
    onChange?.(e);
  };

  return (
    <div className={cn('flex flex-col gap-1.5')}>
      {label && (
        <label htmlFor={label} className="text-title2 text-main">
          {label}
          {required && (
            <span className="text-error" aria-hidden>
              {' *'}
            </span>
          )}
        </label>
      )}
      {description && (
        <p className="text-body2 text-alt" id={`${label}-description`}>
          {description}
        </p>
      )}
      <textarea
        id={label}
        ref={ref}
        required={required}
        onChange={handleCounter}
        className={cn(textAreaVariants({ validation: textAreaValidation, size: size }), className)}
        aria-invalid={!!errorMessage}
        aria-describedby={
          errorMessage ? `${label}-error` : description ? `${label}-description` : undefined
        }
        {...props}
      />
      <div className="relative">
        {errorMessage && (
          <p className="flex items-center gap-1 text-label1 text-error" id={`${label}-error`}>
            <ExclamationIc className="fill-error" width={9} />
            {errorMessage}
          </p>
        )}
        {maxLength && (
          <p
            ref={counterRef}
            className="absolute right-0 top-0 text-body4 text-weak"
          >{`${defaultValue?.length ?? 0}/${maxLength}`}</p>
        )}
      </div>
    </div>
  );
}

export default forwardRef<HTMLTextAreaElement, TextAreaProps>(TextArea);