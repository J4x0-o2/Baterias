import './FormFields.css';

interface TextAreaFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon?: React.ReactNode;
  rows?: number;
  hasError?: boolean;
}

/** Campo de área de texto con etiqueta, icono, placeholder y configuración de filas. */
export const TextAreaField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  icon,
  rows = 3,
  hasError = false,
}: TextAreaFieldProps) => {
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-field__label">
        {icon && <span className="form-field__icon">{icon}</span>}
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className={`form-field__textarea${hasError ? ' form-field__textarea--error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        rows={rows}
      />
    </div>
  );
};
