import './FormFields.css';

interface TextAreaFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  rows?: number;
}

export const TextAreaField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  icon,
  rows = 3
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
        className="form-field__textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
};
