import './FormFields.css';

interface InputFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  unit?: string;
  readOnly?: boolean;
  hasError?: boolean;
}

export const InputField = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  unit,
  readOnly = false,
  hasError = false
}: InputFieldProps) => {
  const inputClass = [
    'form-field__input',
    readOnly ? 'form-field__input--readonly' : '',
    hasError ? 'form-field__input--error' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-field__label">
        {icon && <span className="form-field__icon">{icon}</span>}
        {label}
        {unit && <span className="form-field__unit">({unit})</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === 'number' ? '0.01' : undefined}
        readOnly={readOnly}
      />
    </div>
  );
};
