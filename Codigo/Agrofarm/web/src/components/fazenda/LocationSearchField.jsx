import { useEffect, useId, useRef, useState } from "react";
import { useGeocodingSearch } from "../../hooks/useGeocodingSearch.js";

/**
 * Campo de localização com autocomplete (Nominatim).
 * value: { localizacao, latitude?, longitude? }
 */
export default function LocationSearchField({
  id: idProp,
  label = "Localização",
  value,
  onChange,
  disabled = false,
  placeholder = "Busque cidade, fazenda ou endereço…",
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listId = `${inputId}-suggestions`;
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, loading, reset } = useGeocodingSearch();

  useEffect(() => {
    setQuery(value?.localizacao ?? "");
  }, [value?.localizacao, setQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectResult(item) {
    onChange?.({
      localizacao: item.shortLabel || item.label,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setQuery(item.shortLabel || item.label);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <label className="agro-user-form-dialog__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        className="agro-user-form-dialog__input mt-1 w-full"
        value={query}
        disabled={disabled}
        placeholder={loading ? "Buscando…" : placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={open && results.length ? listId : undefined}
        aria-expanded={open && results.length > 0}
        onChange={(e) => {
          const text = e.target.value.slice(0, 255);
          setQuery(text);
          onChange?.({ localizacao: text, latitude: undefined, longitude: undefined });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.map((item) => (
            <li key={item.id} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectResult(item)}
              >
                <span className="block font-medium">{item.shortLabel}</span>
                <span className="block truncate text-xs text-gray-500">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {value?.latitude != null && value?.longitude != null ? (
        <p className="mt-1 text-xs text-gray-500 tabular-nums">
          Coordenadas: {Number(value.latitude).toFixed(5)}, {Number(value.longitude).toFixed(5)}
        </p>
      ) : null}
    </div>
  );
}
