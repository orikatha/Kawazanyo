import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Plans } from './components/Plans';
import { Advisor } from './components/Advisor';
import { AIAdvisor } from './components/AIAdvisor';


function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'plans' | 'advisor' | 'settings'>('dashboard');

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard />}
      {currentTab === 'plans' && <Plans />}
      {currentTab === 'advisor' && <Advisor />}
      <AIAdvisor />
    </Layout>
  );
}

export default App;
