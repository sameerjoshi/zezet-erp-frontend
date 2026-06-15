'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export interface DateRange {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
}

// --- date helpers, all UTC so the calendar never drifts a day across timezones ---
const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayStr = () => iso(new Date());
const toUTC = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const addDays = (s: string, n: number) => {
  const d = toUTC(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
const firstOfMonth = (s: string) => s.slice(0, 8) + '01';
const startOfWeekMon = (s: string) => {
  const d = toUTC(s);
  const off = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(s, -off);
};

function presetRanges(): { key: string; range: DateRange }[] {
  const today = todayStr();
  const y = addDays(today, -1);
  const monthStart = firstOfMonth(today);
  const lastMonthEnd = addDays(monthStart, -1);
  const lastMonthStart = firstOfMonth(lastMonthEnd);
  return [
    { key: 'today', range: { from: today, to: today } },
    { key: 'yesterday', range: { from: y, to: y } },
    { key: 'thisWeek', range: { from: startOfWeekMon(today), to: today } },
    { key: 'thisMonth', range: { from: monthStart, to: today } },
    { key: 'lastMonth', range: { from: lastMonthStart, to: lastMonthEnd } },
  ];
}

const sameRange = (a: DateRange, b: DateRange) => a.from === b.from && a.to === b.to;

export function formatRange(r: DateRange, locale: string): string {
  const f = (s: string) =>
    toUTC(s).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return r.from === r.to ? f(r.from) : `${f(r.from)} – ${f(r.to)}`;
}

export function DateRangePicker({
  value,
  onChange,
  locale,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  locale: string;
}) {
  const t = useTranslations('range');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ from: string; to: string | null }>({ from: value.from, to: value.to });
  const [view, setView] = useState(firstOfMonth(value.from));
  const box = useRef<HTMLDivElement>(null);
  const today = todayStr();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const openPicker = () => {
    setDraft({ from: value.from, to: value.to });
    setView(firstOfMonth(value.from));
    setOpen(true);
  };

  const clickDay = (day: string) => {
    if (day > today) return;
    setDraft((d) => {
      if (!d.to && day >= d.from) return { from: d.from, to: day };
      return { from: day, to: null }; // start a fresh range
    });
  };

  const apply = () => {
    const r = { from: draft.from, to: draft.to ?? draft.from };
    onChange(r.from <= r.to ? r : { from: r.to, to: r.from });
    setOpen(false);
  };
  const choosePreset = (r: DateRange) => {
    onChange(r);
    setOpen(false);
  };

  const presets = useMemo(() => presetRanges(), []);
  const draftRange: DateRange = { from: draft.from, to: draft.to ?? draft.from };

  return (
    <div className="drp" ref={box}>
      <button type="button" className="drp-trigger" onClick={() => (open ? setOpen(false) : openPicker())}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span>{formatRange(value, locale)}</span>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="drp-pop">
          <div className="drp-presets">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`drp-preset ${sameRange(p.range, value) ? 'on' : ''}`}
                onClick={() => choosePreset(p.range)}
              >
                {t(p.key)}
              </button>
            ))}
          </div>

          <div className="drp-cal">
            <div className="drp-months">
              <CalMonth monthIso={view} sel={draftRange} today={today} onPick={clickDay} locale={locale} canPrev onPrev={() => setView(addMonths(view, -1))} />
              <CalMonth monthIso={addMonths(view, 1)} sel={draftRange} today={today} onPick={clickDay} locale={locale} canNext onNext={() => setView(addMonths(view, 1))} />
            </div>
            <div className="drp-foot">
              <span className="helper">{formatRange(draftRange, locale)}</span>
              <div className="spacer" />
              <button type="button" className="btn ghost sm" onClick={() => setDraft({ from: today, to: today })}>
                {t('reset')}
              </button>
              <button type="button" className="btn sm" onClick={apply}>
                {t('apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const addMonths = (s: string, n: number) => {
  const d = toUTC(firstOfMonth(s));
  d.setUTCMonth(d.getUTCMonth() + n);
  return iso(d).slice(0, 8) + '01';
};

function CalMonth({
  monthIso,
  sel,
  today,
  onPick,
  locale,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  monthIso: string;
  sel: DateRange;
  today: string;
  onPick: (day: string) => void;
  locale: string;
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const first = toUTC(monthIso);
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

  const dow = useMemo(() => {
    // localized Mon..Sun headers, generated from a known Monday (2024-01-01)
    return Array.from({ length: 7 }, (_, i) =>
      toUTC(addDays('2024-01-01', i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
    );
  }, [locale]);

  const title = first.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="cm">
      <div className="cm-head">
        {canPrev ? (
          <button type="button" className="cm-nav" onClick={onPrev} aria-label="Previous month">‹</button>
        ) : (
          <span className="cm-nav ph" />
        )}
        <b>{title}</b>
        {canNext ? (
          <button type="button" className="cm-nav" onClick={onNext} aria-label="Next month">›</button>
        ) : (
          <span className="cm-nav ph" />
        )}
      </div>
      <div className="cm-grid">
        {dow.map((d) => (
          <span key={d} className="cm-dow">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const future = day > today;
          const inRange = day >= sel.from && day <= sel.to;
          const edge = day === sel.from || day === sel.to;
          return (
            <button
              key={day}
              type="button"
              disabled={future}
              onClick={() => onPick(day)}
              className={`cm-day${edge ? ' edge' : ''}${inRange && !edge ? ' inr' : ''}${future ? ' off' : ''}`}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
