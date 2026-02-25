import './Header.css';

interface HeaderProps {
  isOnline: boolean;
}

export const Header = ({ isOnline }: HeaderProps) => {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            className="header__icon"
          >
            <path d="M17 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2h2v2h6V2h2v2zM5 8v12h14V8H5zm2 3h4v4H7v-4z"/>
          </svg>
        </div>
        <div className="header__title">
          <h1 className="header__name">Baterias</h1>
          <span className="header__subtitle">Inspeccion de Baterias</span>
        </div>
      </div>
      <div className={`header__status ${isOnline ? 'header__status--online' : 'header__status--offline'}`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="header__status-icon"
        >
          {isOnline ? (
            <path d="M12 3C7.46 3 3.34 4.78.29 7.67l1.41 1.41C4.42 6.45 8.04 5 12 5s7.58 1.45 10.29 4.08l1.41-1.41C20.66 4.78 16.54 3 12 3zm0 4c-3.07 0-5.86 1.18-7.94 3.1l1.41 1.42C7.28 9.96 9.5 9 12 9s4.72.96 6.53 2.52l1.41-1.42C17.86 8.18 15.07 7 12 7zm0 4c-1.62 0-3.1.59-4.23 1.57l1.41 1.41C10.02 13.38 10.97 13 12 13s1.98.38 2.82.98l1.41-1.41C15.1 11.59 13.62 11 12 11zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
          ) : (
            <path d="M21.64 15.36l1.41-1.41-2.12-2.12 2.12-2.12-1.41-1.42-2.12 2.12-2.12-2.12-1.41 1.42 2.12 2.12-2.12 2.12 1.41 1.41 2.12-2.12 2.12 2.12zM12 3C7.46 3 3.34 4.78.29 7.67l1.41 1.41C4.42 6.45 8.04 5 12 5c1.83 0 3.58.36 5.18 1l1.52-1.52C16.72 3.54 14.43 3 12 3zm0 4c-3.07 0-5.86 1.18-7.94 3.1l1.41 1.42C7.28 9.96 9.5 9 12 9c.96 0 1.88.14 2.75.41l1.53-1.53C15.06 7.32 13.57 7 12 7zm0 4c-1.62 0-3.1.59-4.23 1.57l1.41 1.41C10.02 13.38 10.97 13 12 13c.35 0 .69.04 1.02.11l1.64-1.64C13.88 11.17 12.96 11 12 11zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
          )}
        </svg>
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </header>
  );
};
