import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker, useDayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "./icons.jsx";
import AgroPickerFooter from "./pickers/AgroPickerFooter.jsx";
import AgroPickerIcon from "./pickers/AgroPickerIcon.jsx";
import {
  AGRO_DAY_PICKER_COMPACT_CLASS,
  AGRO_PICKER_POPOVER_CLASS,
  AGRO_PICKER_TRIGGER_CLASS,
  dayPickerClassNames,
  dayPickerFormatters,
  dayPickerStyle,
  formatDateLabel,
  parseIsoDate,
} from "./pickers/agroPickerTheme.js";
import "react-day-picker/style.css";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 41 }, (_, i) => CURRENT_YEAR - 20 + i);
const MONTHS_PT = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2000, i, 1), "MMMM", { locale: ptBR }),
);

const SELECT_CLASS =
  "cursor-pointer rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-medium capitalize text-gray-800 hover:border-[#2e5b47] focus:outline-none focus:ring-1 focus:ring-[#2e5b47]";

function MonthYearCaption({ calendarMonth }) {
  const { goToMonth } = useDayPicker();
  const year = calendarMonth.date.getFullYear();
  const month = calendarMonth.date.getMonth();

  return (
    <div className="flex items-center justify-center gap-2 pb-1">
      <select
        value={month}
        className={SELECT_CLASS}
        onChange={(e) => goToMonth(new Date(year, Number(e.target.value)))}
      >
        {MONTHS_PT.map((m, i) => (
          <option key={i} value={i}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={year}
        className={SELECT_CLASS}
        onChange={(e) => goToMonth(new Date(Number(e.target.value), month))}
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = "Selecione a data",
  className = "",
  id,
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const label = formatDateLabel(value, placeholder);

  const handleSelect = (date) => {
    if (!date) {
      onChange?.("");
      return;
    }
    onChange?.(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          className={`${AGRO_PICKER_TRIGGER_CLASS} ${className}`.trim()}
          aria-label={placeholder}
        >
          <AgroPickerIcon>
            <CalendarIcon className="h-3.5 w-3.5" />
          </AgroPickerIcon>
          <span className={`min-w-0 flex-1 truncate ${value ? "text-gray-800" : "text-gray-500"}`}>
            {label}
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          data-agro-picker-popover="true"
          className={AGRO_PICKER_POPOVER_CLASS}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DayPicker
            mode="single"
            locale={ptBR}
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate}
            hideNavigation
            formatters={dayPickerFormatters}
            classNames={dayPickerClassNames}
            style={dayPickerStyle}
            className={AGRO_DAY_PICKER_COMPACT_CLASS}
            components={{ MonthCaption: MonthYearCaption }}
          />

          <AgroPickerFooter
            onClear={() => {
              onChange?.("");
              setOpen(false);
            }}
            onToday={() => {
              onChange?.(format(new Date(), "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
