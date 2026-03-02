import React from 'react';
import { ChevronDown } from 'lucide-react';

interface StyledSelectProps {
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const StyledSelect: React.FC<StyledSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  className = '',
  disabled = false
}) => (
  <div className={`relative ${className}`}>
    <select
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className={`w-full p-3 pr-10 appearance-none bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-stone-500">
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
);
