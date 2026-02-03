import { useState, useMemo } from 'react';
import type { Seat } from '../types';
import type { VenueSection } from '../types';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/** Price tier for seat color (cheap -> mid -> expensive) */
function getPriceTier(price: number, min: number, max: number): 'low' | 'mid' | 'high' {
  const range = max - min;
  if (range <= 0) return 'mid';
  const p = (price - min) / range;
  if (p < 0.33) return 'low';
  if (p > 0.66) return 'high';
  return 'mid';
}

interface SeatMapProps {
  seats: Seat[];
  sections: VenueSection[];
}

export function SeatMap({ seats, sections }: SeatMapProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const sectionsByTier = useMemo(() => {
    const floor = sections.filter((s) => s.tier === 'floor');
    const lower = sections.filter((s) => s.tier === 'lower').sort((a, b) => a.order - b.order);
    const upper = sections.filter((s) => s.tier === 'upper').sort((a, b) => a.order - b.order);
    return { floor, lower, upper };
  }, [sections]);

  const selectedSection = selectedSectionId ? sections.find((s) => s.id === selectedSectionId) : null;
  const selectedSeats = useMemo(() => {
    if (!selectedSection) return [];
    return seats.filter((s) => s.section === selectedSection.name);
  }, [seats, selectedSection]);

  const seatGrid = useMemo(() => {
    if (selectedSeats.length === 0) return { rows: [] as string[], byRow: {} as Record<string, Seat[]> };
    const byRow: Record<string, Seat[]> = {};
    selectedSeats.forEach((seat) => {
      if (!byRow[seat.row]) byRow[seat.row] = [];
      byRow[seat.row].push(seat);
    });
    const rows = Object.keys(byRow).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    rows.forEach((r) => byRow[r].sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10)));
    return { rows, byRow };
  }, [selectedSeats]);

  const priceRange = useMemo(() => {
    if (selectedSeats.length === 0) return { min: 0, max: 0 };
    const prices = selectedSeats.map((s) => s.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [selectedSeats]);

  if (sections.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900">Venue seat map</h3>
        <p className="text-slate-500 text-sm mt-0.5">
          Click a section to see seats and prices. Green = available, gray = sold.
        </p>
      </div>

      {/* Arena layout: stage at bottom, then sections by tier */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Upper tier */}
          {sectionsByTier.upper.length > 0 && (
            <div className="flex justify-center gap-1.5 mb-2 flex-wrap">
              {sectionsByTier.upper.map((sec) => (
                <SectionBlock
                  key={sec.id}
                  section={sec}
                  isSelected={selectedSectionId === sec.id}
                  onClick={() => setSelectedSectionId(selectedSectionId === sec.id ? null : sec.id)}
                />
              ))}
            </div>
          )}
          {/* Lower tier */}
          {sectionsByTier.lower.length > 0 && (
            <div className="flex justify-center gap-2 mb-2 flex-wrap">
              {sectionsByTier.lower.map((sec) => (
                <SectionBlock
                  key={sec.id}
                  section={sec}
                  isSelected={selectedSectionId === sec.id}
                  onClick={() => setSelectedSectionId(selectedSectionId === sec.id ? null : sec.id)}
                />
              ))}
            </div>
          )}
          {/* Floor */}
          {sectionsByTier.floor.length > 0 && (
            <div className="flex justify-center gap-2 mb-2 flex-wrap">
              {sectionsByTier.floor.map((sec) => (
                <SectionBlock
                  key={sec.id}
                  section={sec}
                  isSelected={selectedSectionId === sec.id}
                  onClick={() => setSelectedSectionId(selectedSectionId === sec.id ? null : sec.id)}
                  wide
                />
              ))}
            </div>
          )}
          {/* Stage */}
          <div className="rounded-lg bg-slate-700 text-white text-center py-3 mt-4 text-sm font-medium">
            STAGE
          </div>
        </div>

        {/* Selected section: seat grid with prices */}
        {selectedSection && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900">
                Section {selectedSection.name} — From {formatPrice(selectedSection.priceMin)} to {formatPrice(selectedSection.priceMax)}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedSectionId(null)}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                Close
              </button>
            </div>
            {selectedSeats.length === 0 ? (
              <p className="text-slate-500 text-sm">No seat data for this section.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {seatGrid.rows.map((rowLabel) => (
                      <div key={rowLabel} className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-slate-500 w-6 shrink-0 font-medium">Row {rowLabel}</span>
                        <div className="flex gap-0.5 flex-wrap">
                          {(seatGrid.byRow[rowLabel] ?? []).map((seat) => {
                            const tier = getPriceTier(seat.price, priceRange.min, priceRange.max);
                            return (
                              <button
                                key={seat.id}
                                type="button"
                                disabled={!seat.available}
                                title={`Section ${seat.section} Row ${seat.row} Seat ${seat.number} — ${formatPrice(seat.price)}${!seat.available ? ' (sold)' : ''}`}
                                className={`w-7 h-7 rounded text-[10px] font-semibold flex items-center justify-center transition-transform hover:scale-110 disabled:cursor-not-allowed ${
                                  seat.available
                                    ? tier === 'low'
                                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                      : tier === 'high'
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 'bg-teal-500 text-white hover:bg-teal-600'
                                    : 'bg-slate-300 text-slate-500'
                                }`}
                              >
                                {seat.number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                  <span className="text-slate-500">Price:</span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-500" /> Low {formatPrice(priceRange.min)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-teal-500" /> Mid
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-500" /> High {formatPrice(priceRange.max)}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-slate-300" /> Sold
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  isSelected,
  onClick,
  wide,
}: {
  section: VenueSection;
  isSelected: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-lg border-2 font-semibold text-slate-900 transition-all text-center
        hover:shadow-md hover:scale-105
        ${wide ? 'px-6 py-2.5 min-w-[120px]' : 'px-4 py-2 min-w-[56px]'}
        ${isSelected ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/30' : 'border-slate-300 bg-white hover:border-teal-400'}
      `}
    >
      <span className="block text-sm">{section.name}</span>
      <span className="block text-xs font-medium text-teal-600 mt-0.5">
        {formatPrice(section.priceMin)}
      </span>
    </button>
  );
}
