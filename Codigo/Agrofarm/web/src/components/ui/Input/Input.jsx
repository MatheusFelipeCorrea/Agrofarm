import { cn } from "../../../lib/utils.js";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  inputMode,
  wrapperClassName = "w-full",
  labelClassName = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={wrapperClassName}>
      {label ? <label className={labelClassName}>{label}</label> : null}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        className={cn(
          "flex h-11 w-full rounded-md border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 shadow-sm transition-colors placeholder:text-gray-400 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e5b47]/20 focus-visible:border-[#2e5b47] disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}
