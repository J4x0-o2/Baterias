import './Footer.css';

/** Componente de pie de página con mensaje informativo sobre almacenamiento local y sincronización automática. */
export const Footer = () => {
  return (
    <footer className="footer">
      <p className="footer__text">
        Los registros se guardarán localmente; luego se sincronizarán automáticamente.
      </p>
    </footer>
  );
};
