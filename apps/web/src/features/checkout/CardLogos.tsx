import type { CardBrand } from './card';

export function VisaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" width="48" height="32" aria-label="Visa" role="img">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <text
        x="24"
        y="21"
        textAnchor="middle"
        fill="#fff"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
        fontSize="14"
        fontStyle="italic"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      width="48"
      height="32"
      aria-label="Mastercard"
      role="img"
    >
      <rect width="48" height="32" rx="4" fill="#252525" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <path
        d="M24 10.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function BrandLogo({ brand, className }: { brand: CardBrand; className?: string }) {
  if (brand === 'visa') return <VisaLogo className={className} />;
  if (brand === 'mastercard') return <MastercardLogo className={className} />;
  return null;
}
