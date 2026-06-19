import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ClockIcon } from "./icons.jsx";
import AgroPickerFooter from "./pickers/AgroPickerFooter.jsx";
import AgroPickerIcon from "./pickers/AgroPickerIcon.jsx";
import AgroPickerScrollList from "./pickers/AgroPickerScrollList.jsx";
import {
  AGRO_PICKER_POPOVER_CLASS,
  AGRO_PICKER_TRIGGER_CLASS,
  formatTimeLabel,
  parseTimeValue,
} from "./pickers/agroPickerTheme.js";

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

function optionClass(isSelected) {
  return [
    "w-full rounded-md px-1.5 py-1 text-center text-xs transition-colors",
    isSelected
      ? "bg-[#2e5b47] font-semibold text-white"
      : "text-gray-700 hover:bg-[#e8f3ee] hover:text-[#2e5b47]",
  ].join(" ");
}

export default function TimePickerInput({
  value,
  onChange,
  placeholder = "Selecione a hora",
  className = "",
  id,
}) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");
  const skipCommitOnCloseRef = useRef(false);

  useEffect(() => {
    if (open) return;
    const parsed = parseTimeValue(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
  }, [open, value]);

  const label = formatTimeLabel(value, placeholder);

  const applyTime = (nextHour, nextMinute) => {
    onChange?.(`${nextHour}:${nextMinute}`);
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && open && !skipCommitOnCloseRef.current) {
      applyTime(hour, minute);
    }
    skipCommitOnCloseRef.current = false;
    setOpen(nextOpen);
  };

  const closePicker = () => handleOpenChange(false);

  const confirmSelection = () => closePicker();

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          className={`${AGRO_PICKER_TRIGGER_CLASS} ${className}`.trim()}
          aria-label={placeholder}
        >
          <AgroPickerIcon>
            <ClockIcon className="h-3.5 w-3.5" />
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
          className={`${AGRO_PICKER_POPOVER_CLASS} max-w-[11.5rem]`}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Hora</p>
              <AgroPickerScrollList>
                {HOURS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={optionClass(hour === option)}
                    onClick={() => setHour(option)}
                  >
                    {option}
                  </button>
                ))}
              </AgroPickerScrollList>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Minuto</p>
              <AgroPickerScrollList>
                {MINUTES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={optionClass(minute === option)}
                    onClick={() => setMinute(option)}
                  >
                    {option}
                  </button>
                ))}
              </AgroPickerScrollList>
            </div>
          </div>

          <AgroPickerFooter
            clearLabel="Limpar"
            todayLabel="Confirmar"
            onClear={() => {
              skipCommitOnCloseRef.current = true;
              onChange?.("");
              closePicker();
            }}
            onToday={confirmSelection}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
