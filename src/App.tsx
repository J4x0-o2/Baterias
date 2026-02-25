import { useEffect } from 'react';
import { Header, Footer, BatteryForm } from './components';
import { useOnlineStatus } from './pwa';
import { startAutoSync, stopAutoSync } from './modules/sync';
import { setCustomReferencesStorage } from './modules/references';
import { referencesDB } from './modules/database';
import './App.css';

// Inicializar storage de referencias personalizadas
setCustomReferencesStorage(referencesDB);

function App() {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    startAutoSync();
    return () => stopAutoSync();
  }, []);

  return (
    <div className="app">
      <Header isOnline={isOnline} />
      <main className="app__main">
        <BatteryForm />
      </main>
      <Footer />
    </div>
  );
}

export default App;
