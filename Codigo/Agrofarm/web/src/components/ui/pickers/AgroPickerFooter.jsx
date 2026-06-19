export default function AgroPickerFooter({
  onClear,
  onToday,
  clearLabel = "Limpar",
  todayLabel = "Hoje",
}) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5">
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-medium text-[#2e5b47] transition-colors hover:text-[#244a3a]"
      >
        {clearLabel}
      </button>
      <button
        type="button"
        onClick={onToday}
        className="text-xs font-medium text-[#2e5b47] transition-colors hover:text-[#244a3a]"
      >
        {todayLabel}
      </button>
    </div>
  );
}
