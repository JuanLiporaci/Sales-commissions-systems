import React, { useState, useRef, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';

type ColumnFilterProps = {
  values: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
};

const ColumnFilter: React.FC<ColumnFilterProps> = ({ values, selected, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => setOpen((prev) => !prev);
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };
  const handleClear = () => onChange([]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${selected.length > 0 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
        aria-label={`Filtrar por ${label}`}
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleToggle()}
      >
        <FiFilter className="w-5 h-5" />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-2 min-w-[180px] max-w-[320px] bg-white border border-gray-200 rounded shadow-lg p-2"
          style={{ maxHeight: 320, overflowY: 'auto' }}
          role="menu"
          aria-label={`Opciones de filtro para ${label}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-gray-700">{label}</span>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline ml-2"
              onClick={handleClear}
              tabIndex={0}
              aria-label="Limpiar filtro"
            >
              Limpiar
            </button>
          </div>
          <ul className="space-y-1">
            {values.length === 0 && (
              <li className="text-gray-400 text-xs">Sin opciones</li>
            )}
            {values.map((value) => (
              <li key={value}>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(value)}
                    onChange={() => handleSelect(value)}
                    className="accent-blue-600"
                    tabIndex={0}
                    aria-checked={selected.includes(value)}
                  />
                  <span className="truncate" title={value}>{value || <span className="italic text-gray-400">(vacío)</span>}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ColumnFilter; 