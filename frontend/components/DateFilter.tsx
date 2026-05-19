"use client";
import { useState } from "react";

export interface DateFilterValue {
  dateFrom: string;
  dateTo: string;
  period: "day" | "week" | "month" | "year" | "custom";
}

interface DateFilterProps {
  onChange: (value: DateFilterValue) => void;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getToday(): { dateFrom: string; dateTo: string } {
  const today = toISODate(new Date());
  return { dateFrom: today, dateTo: today };
}

function getThisWeek(): { dateFrom: string; dateTo: string } {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon  = new Date(now); mon.setDate(now.getDate() - diff);
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { dateFrom: toISODate(mon), dateTo: toISODate(sun) };
}

function getThisMonth(): { dateFrom: string; dateTo: string } {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { dateFrom: toISODate(start), dateTo: toISODate(end) };
}

function getThisYear(): { dateFrom: string; dateTo: string } {
  const y = new Date().getFullYear();
  return { dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` };
}

const PERIOD_LABELS: Record<DateFilterValue["period"], string> = {
  day:    "Ce jour",
  week:   "Cette semaine",
  month:  "Ce mois",
  year:   "Cette année",
  custom: "Période",
};

export default function DateFilter({ onChange }: DateFilterProps) {
  const [active, setActive]     = useState<DateFilterValue["period"]>("week");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  function emit(period: DateFilterValue["period"], range: { dateFrom: string; dateTo: string }) {
    onChange({ ...range, period });
  }

  function select(period: DateFilterValue["period"]) {
    setActive(period);
    if (period === "day")    emit(period, getToday());
    if (period === "week")   emit(period, getThisWeek());
    if (period === "month")  emit(period, getThisMonth());
    if (period === "year")   emit(period, getThisYear());
  }

  function applyCustom() {
    if (dateFrom && dateTo) emit("custom", { dateFrom, dateTo });
  }

  return (
    <div className="hf-date-filter">
      {(["day", "week", "month", "year", "custom"] as const).map((p) => (
        <button
          key={p}
          type="button"
          className={`hf-date-filter__btn${active === p ? " hf-date-filter__btn--active" : ""}`}
          onClick={() => select(p)}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}

      {active === "custom" && (
        <div className="hf-date-filter__custom">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            aria-label="Date de début"
          />
          <span className="text-muted small">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            aria-label="Date de fin"
          />
          <button
            type="button"
            className="hf-date-filter__custom-ok"
            onClick={applyCustom}
            disabled={!dateFrom || !dateTo}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
