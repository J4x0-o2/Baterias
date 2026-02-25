import './FormFields.css';

interface DateFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export const DateField = ({
  label,
  name,
  value,
  onChange,
  icon
}: DateFieldProps) => {
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-field__label">
        {icon && <span className="form-field__icon">{icon}</span>}
        {label}
      </label>
      <input
        type="date"
        id={name}
        name={name}
        className="form-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
