type IconProps = { className?: string };

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="m3 8.5 3.2 3L13 4.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** The prism mark: an equilateral triangle, drawn as a single stroke. */
