import './FormButtons.css';

interface FormButtonsProps {
  onReset: () => void;
  onSave: () => void;
  isSaveDisabled?: boolean;
  isLoading?: boolean;
}

export const FormButtons = ({ onReset, onSave, isSaveDisabled = false, isLoading = false }: FormButtonsProps) => {
  return (
    <div className="form-buttons">
      <button 
        type="button" 
        className="form-buttons__btn form-buttons__btn--reset"
        onClick={onReset}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="form-buttons__icon"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Reiniciar
      </button>
      <button 
        type="button" 
        className="form-buttons__btn form-buttons__btn--save"
        onClick={onSave}
        disabled={isSaveDisabled || isLoading}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="form-buttons__icon"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        {isLoading ? 'Guardando...' : 'Guardar Inspeccion'}
      </button>
    </div>
  );
};
