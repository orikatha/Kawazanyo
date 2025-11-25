import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Advisor } from './components/Advisor';


function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'advisor' | 'settings'>('dashboard');

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard />}
      {currentTab === 'advisor' && <Advisor />}
    </Layout>
  );
}

export default App;
