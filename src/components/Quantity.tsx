"use client";
import { Minus, Plus } from "lucide-react";
import type { Translate } from "@/types/i18n";

export default function Quantity({
  value,
  max,
  onChange,
  t,
}: {
  value: number;
  max?: number;
  onChange: (n: number) => void;
  t: Translate;
}) {
  return (
    <div className="quantity">
      <button
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label={t("decrease")}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={t("increase")}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
