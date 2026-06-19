import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../../lib/utils.js";

const EMPTY_VALUE_TOKEN = "__agro_select_empty__";

/** Converte filhos de <option> (texto ou JSX) em string legível, sem vírgulas artificiais. */
function flattenOptionLabel(children) {
  if (children == null || children === false) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(flattenOptionLabel).join("");
  if (React.isValidElement(children)) return flattenOptionLabel(children.props.children);
  return "";
}

function normalizeOptions(children, placeholder) {
  const options = [];
  let placeholderLabel = placeholder;

  React.Children.toArray(children).forEach((child) => {
    if (!React.isValidElement(child)) return;
    if (child.type !== "option") return;

    const optionValue = child.props.value;
    const label = flattenOptionLabel(child.props.children).trim();

    if (optionValue === "" || optionValue === undefined || optionValue === null) {
      if (!placeholderLabel) placeholderLabel = label;
      return;
    }

    options.push({
      value: String(optionValue),
      label,
      disabled: Boolean(child.props.disabled),
    });
  });

  return { options, placeholderLabel: placeholderLabel || "Selecione" };
}

function SelectItem({ value, children, disabled }) {
  return (
    <SelectPrimitive.Item
      value={value}
      disabled={disabled}
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-3 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center justify-center">
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export default function Select({
  label,
  value,
  onChange,
  children,
  placeholder,
  wrapperClassName = "relative w-full",
  selectClassName = "",
  labelClassName = "",
  iconClassName = "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500",
  showChevron = true,
  disabled = false,
  includeEmptyOption = true,
  contentClassName = "",
}) {
  const { options, placeholderLabel } = normalizeOptions(children, placeholder);

  const isEmpty = value === "" || value === undefined || value === null;
  const currentValue = isEmpty ? EMPTY_VALUE_TOKEN : String(value);
  const selectedLabel = options.find((o) => o.value === String(value))?.label ?? null;

  function handleValueChange(nextValue) {
    const normalized = nextValue === EMPTY_VALUE_TOKEN ? "" : nextValue;
    if (typeof onChange === "function") {
      onChange({ target: { value: normalized } });
    }
  }

  return (
    <div className={wrapperClassName}>
      {label ? <label className={labelClassName}>{label}</label> : null}
      <SelectPrimitive.Root value={currentValue} onValueChange={handleValueChange} disabled={disabled}>
        <div className="relative">
          <SelectPrimitive.Trigger
            className={cn(
              "relative flex h-10 w-full items-center rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-left text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20 disabled:cursor-not-allowed disabled:opacity-50",
              selectClassName,
            )}
          >
            {isEmpty ? (
              <span className="truncate text-gray-400">{placeholderLabel}</span>
            ) : (
              <SelectPrimitive.Value className="truncate">
                {selectedLabel ?? placeholderLabel}
              </SelectPrimitive.Value>
            )}
          </SelectPrimitive.Trigger>
          {showChevron ? <ChevronDown className={cn("h-4 w-4 text-gray-500", iconClassName)} /> : null}
        </div>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            data-agro-select-content=""
            className={cn(
              "z-[250] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg",
              contentClassName,
            )}
            position="popper"
            sideOffset={6}
          >
            <SelectPrimitive.Viewport className="p-1">
              {includeEmptyOption ? <SelectItem value={EMPTY_VALUE_TOKEN}>{placeholderLabel}</SelectItem> : null}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
