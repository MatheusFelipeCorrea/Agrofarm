import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../../lib/utils.js";
import { CalendarIcon } from "./icons.jsx";
import AgroPickerIcon from "./pickers/AgroPickerIcon.jsx";
import {
  AGRO_DAY_PICKER_COMPACT_CLASS,
  AGRO_PICKER_POPOVER_RANGE_CLASS,
  dayPickerClassNames,
  dayPickerFormatters,
  dayPickerStyle,
  formatDateLabel,
  parseIsoDate,
} from "./pickers/agroPickerTheme.js";
import "react-day-picker/style.css";

function formatRangeTriggerLabel(from, to, fromPlaceholder, toPlaceholder) {
  if (from && to) return `${formatDateLabel(from)} – ${formatDateLabel(to)}`;
  if (from) return `${formatDateLabel(from)} – ${toPlaceholder}`;
  if (to) return `${fromPlaceholder} – ${formatDateLabel(to)}`;
  return "Período";
}

function rangeFromProps(from, to) {
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  if (!fromDate && !toDate) return undefined;
  return { from: fromDate, to: toDate };
}

function toIsoDate(date) {
  return format(date, "yyyy-MM-dd");
}

export default function DateRangeFilter({
  from,
  to,
  onChangeFrom,
  onChangeTo,
  fromPlaceholder = "Data inicial",
  toPlaceholder = "Data final",
  className = "",
  compact = false,
  showClearButton = true,
}) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(undefined);

  useEffect(() => {
    if (open) {
      setDraftRange(rangeFromProps(from, to));
    }
  }, [open, from, to]);

  function applyRange(next) {
    setDraftRange(next);
    if (!next?.from) {
      onChangeFrom("");
      onChangeTo("");
      return;
    }
    onChangeFrom(toIsoDate(next.from));
    if (next.to) {
      onChangeTo(toIsoDate(next.to));
      setOpen(false);
    } else {
      onChangeTo("");
    }
  }

  function handleDayClick(day) {
    if (!day) return;

    const hasFrom = Boolean(draftRange?.from);
    const hasTo = Boolean(draftRange?.to);

    if (!hasFrom || (hasFrom && hasTo)) {
      applyRange({ from: day, to: undefined });
      return;
    }

    let start = draftRange.from;
    let end = day;
    if (end < start) {
      [start, end] = [end, start];
    }
    applyRange({ from: start, to: end });
  }

  function handleClear(e) {
    e?.stopPropagation?.();
    applyRange(undefined);
    setOpen(false);
  }

  const temPeriodo = Boolean(from || to);
  const triggerLabel = formatRangeTriggerLabel(from, to, fromPlaceholder, toPlaceholder);
  const pickerMonth =
    draftRange?.from ?? draftRange?.to ?? parseIsoDate(from) ?? parseIsoDate(to) ?? new Date();

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
      <Popover.Trigger asChild>
        {compact ? (
          <button
            type="button"
            className={cn(
              "inline-flex h-8 max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-gray-300",
              temPeriodo && "border-[var(--agro-brand)]/30 text-[var(--agro-brand)]",
              className,
            )}
            aria-label="Selecionar período"
            aria-expanded={open}
          >
            <AgroPickerIcon>
              <CalendarIcon className="h-3.5 w-3.5" />
            </AgroPickerIcon>
            <span className="truncate">{triggerLabel}</span>
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "relative flex h-10 w-full items-center rounded-lg border border-gray-200 bg-white shadow-sm",
              className,
            )}
            aria-label="Selecionar período"
            aria-expanded={open}
          >
            <span className="inline-flex min-w-0 flex-1 items-center gap-2 px-3 text-sm text-gray-700">
              <AgroPickerIcon>
                <CalendarIcon className="h-3.5 w-3.5" />
              </AgroPickerIcon>
              <span className={`truncate ${from ? "text-gray-700" : "text-gray-400"}`}>
                {formatDateLabel(from, fromPlaceholder)}
              </span>
            </span>
            <span className="h-5 w-px shrink-0 bg-gray-200" aria-hidden="true" />
            <span className="inline-flex min-w-0 flex-1 items-center gap-2 px-3 text-sm text-gray-700">
              <AgroPickerIcon>
                <CalendarIcon className="h-3.5 w-3.5" />
              </AgroPickerIcon>
              <span className={`truncate ${to ? "text-gray-700" : "text-gray-400"}`}>
                {formatDateLabel(to, toPlaceholder)}
              </span>
            </span>
          </button>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          data-agro-picker-popover="true"
          className={cn(AGRO_PICKER_POPOVER_RANGE_CLASS, "z-[250]")}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("[data-agro-picker-popover]")) {
              event.preventDefault();
            }
          }}
        >
          <p className="mb-2 text-[11px] text-gray-500">
            {!draftRange?.from || draftRange?.to
              ? "Clique no dia inicial e depois no dia final"
              : "Clique no dia final do período"}
          </p>
          <DayPicker
            mode="range"
            required={false}
            numberOfMonths={1}
            selected={draftRange}
            onDayClick={handleDayClick}
            defaultMonth={pickerMonth}
            locale={ptBR}
            formatters={dayPickerFormatters}
            classNames={{
              ...dayPickerClassNames,
              range_start: "rounded-md bg-[#2e5b47] text-white",
              range_end: "rounded-md bg-[#2e5b47] text-white",
              range_middle: "bg-[#a8d4bc] text-[#163d2e] font-medium",
            }}
            style={{
              ...dayPickerStyle,
              "--rdp-range_start-date-background-color": "#2e5b47",
              "--rdp-range_end-date-background-color": "#2e5b47",
            }}
            className={AGRO_DAY_PICKER_COMPACT_CLASS}
          />

          {showClearButton ? (
            <div className="mt-2 flex justify-end border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={!temPeriodo && !draftRange?.from}
                className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Limpar
              </button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
