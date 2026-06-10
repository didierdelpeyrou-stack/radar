// Primitives de formulaire accessibles (RGAA / WCAG AA, §5) : libellés liés,
// gros corps de texte, navigation clavier, info-bulle « pourquoi on demande ça »
// (coéducation administrative — posture du guide d'entretien).

import { useId, useState, type ReactNode } from 'react';

export function Pourquoi({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <span className="relative ml-1 inline-block align-middle">
      <button
        type="button"
        aria-label="Pourquoi on demande ça"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
        className="h-6 w-6 rounded-full border border-teal text-sm font-bold text-teal hover:bg-teal hover:text-white"
      >
        ?
      </button>
      {ouvert && (
        <span className="absolute left-0 top-7 z-10 block w-72 rounded-lg border border-teal bg-white p-3 text-sm shadow-lg">
          {children}
        </span>
      )}
    </span>
  );
}

function Label({ label, pourquoi, htmlFor }: { label: string; pourquoi?: ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block font-semibold">
      {label}
      {pourquoi && <Pourquoi>{pourquoi}</Pourquoi>}
    </label>
  );
}

export function Champ({
  label,
  pourquoi,
  children,
}: {
  label: string;
  pourquoi?: ReactNode;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="mb-4">
      <Label label={label} pourquoi={pourquoi} htmlFor={id} />
      {children(id)}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-marine/30 bg-white px-3 py-2 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40';

export function TexteInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

export function NombreInput({
  value,
  onChange,
  suffix,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={inputCls}
        {...rest}
      />
      {suffix && <span className="shrink-0 text-marine/70">{suffix}</span>}
    </div>
  );
}

export function Selecteur<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={inputCls}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Bascule({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="mb-2 flex cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-teal"
      />
      <span>{label}</span>
    </label>
  );
}

export function EncadreBleu({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 rounded-lg border-l-4 border-teal bg-lave-bleu p-3 text-sm">{children}</div>
  );
}

export function EncadreVigilance({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 rounded-lg border-l-4 border-dore bg-lave-dore p-3 text-sm">
      ⚠️ {children}
    </div>
  );
}
