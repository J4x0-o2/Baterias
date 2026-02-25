import './FormFields.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ReactNode;
}

export const SelectField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  options,
  icon
}: SelectFieldProps) => {
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-field__label">
        {icon && <span className="form-field__icon">{icon}</span>}
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="form-field__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {placeholder || 'Select an option...'}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
