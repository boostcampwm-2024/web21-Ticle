import { cva } from 'class-variance-authority';
import { FunctionComponent, HTMLAttributes, SVGProps } from 'react';

import cn from '@/utils/cn';

const BUTTON_TYPE = {
  default: 'default',
  exit: 'exit',
} as const;

const buttonVariants = cva('flex h-10 w-10 items-center justify-center rounded-lg', {
  variants: {
    type: {
      [BUTTON_TYPE.default]: 'bg-primary',
      [BUTTON_TYPE.exit]: 'bg-error',
    },
    active: {
      false: 'bg-darkAlt',
      true: 'bg-primary',
    },
  },
  compoundVariants: [
    {
      type: BUTTON_TYPE.exit,
      active: false,
      class: 'bg-error',
    },
    {
      type: BUTTON_TYPE.exit,
      active: true,
      class: 'bg-error',
    },
  ],
  defaultVariants: {
    type: BUTTON_TYPE.default,
    active: false,
  },
});

interface ToggleButtonProps extends HTMLAttributes<HTMLButtonElement> {
  ActiveIcon: FunctionComponent<SVGProps<SVGSVGElement>>;
  InactiveIcon: FunctionComponent<SVGProps<SVGSVGElement>>;
  isActivated?: boolean;
  type?: keyof typeof BUTTON_TYPE;
  onToggle?: (isActivated: boolean) => void;
}

const ToggleButton = ({
  ActiveIcon,
  InactiveIcon,
  className,
  type = 'default',
  isActivated = false,
  onToggle,
  ...rest
}: ToggleButtonProps) => {
  const handleClick = () => {
    onToggle?.(!isActivated);
  };

  return (
    <button
      className={cn(buttonVariants({ active: isActivated, type }), className)}
      onClick={handleClick}
      {...rest}
    >
      {isActivated ? (
        <ActiveIcon className="fill-white text-white" />
      ) : (
        <InactiveIcon className="fill-white text-white" />
      )}
    </button>
  );
};

export default ToggleButton;
