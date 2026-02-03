const OPTIONS = [
  { value: 1, label: 'Just me', sublabel: '1 ticket' },
  { value: 2, label: 'Me + 1', sublabel: '2 tickets' },
  { value: 3, label: 'Small group', sublabel: '3 tickets' },
  { value: 4, label: 'Group of 4', sublabel: '4 tickets' },
  { value: 5, label: '5+ tickets', sublabel: '5 or more' },
] as const;

export type TicketQuantity = (typeof OPTIONS)[number]['value'];

interface TicketQuantityFilterProps {
  value: number;
  onChange: (quantity: number) => void;
}

export function TicketQuantityFilter({ value, onChange }: TicketQuantityFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex flex-col items-center rounded-xl border-2 px-4 py-3 min-w-[80px] text-left
            transition-all hover:shadow-md
            ${value === opt.value
              ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
            }
          `}
        >
          <span className="font-semibold text-sm">{opt.label}</span>
          <span className="text-xs text-slate-500 mt-0.5">{opt.sublabel}</span>
        </button>
      ))}
    </div>
  );
}

export { OPTIONS as TICKET_QUANTITY_OPTIONS };
