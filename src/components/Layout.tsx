import React, { useState } from 'react';
import { LayoutDashboard, MessageSquare, Settings, HelpCircle, Pencil } from 'lucide-react';
import { HelpOverlay } from './HelpOverlay';

interface LayoutProps {
    children: React.ReactNode;
    currentTab: 'dashboard' | 'plans' | 'advisor' | 'settings';
    onTabChange: (tab: 'dashboard' | 'plans' | 'advisor' | 'settings') => void;
}

import { Settings as SettingsComponent } from './Settings';
import { AdBanner } from './AdBanner';

export const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange }) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="bg-surface shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="w-8" /> {/* Spacer for centering */}
                <h1 className="text-xl font-bold text-primary text-center">皮算用家計簿</h1>
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="text-gray-400 hover:text-primary transition-colors"
                >
                    <HelpCircle size={24} />
                </button>
            </header>

            <main className="flex-1 p-4 pb-32 max-w-md mx-auto w-full">
                {children}
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-40">
                <nav className="bg-surface border-t border-gray-200 px-6 py-3 flex justify-between items-center">
                    <button
                        onClick={() => onTabChange('dashboard')}
                        className={`flex flex-col items-center space-y-1 ${currentTab === 'dashboard' ? 'text-primary' : 'text-gray-400'
                            }`}
                    >
                        <LayoutDashboard size={24} />
                        <span className="text-[10px]">家計簿</span>
                    </button>
                    <button
                        onClick={() => onTabChange('plans')}
                        className={`flex flex-col items-center space-y-1 ${currentTab === 'plans' ? 'text-primary' : 'text-gray-400'
                            }`}
                    >
                        <Pencil size={24} />
                        <span className="text-[10px]">皮算用</span>
                    </button>
                    <button
                        onClick={() => onTabChange('advisor')}
                        className={`flex flex-col items-center space-y-1 ${currentTab === 'advisor' ? 'text-primary' : 'text-gray-400'
                            }`}
                    >
                        <MessageSquare size={24} />
                        <span className="text-[10px]">相談</span>
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className={`flex flex-col items-center space-y-1 ${isSettingsOpen ? 'text-primary' : 'text-gray-400'
                            }`}
                    >
                        <Settings size={24} />
                        <span className="text-xs">設定</span>
                    </button>
                </nav>
                <AdBanner />
            </div>

            <HelpOverlay
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />

            {isSettingsOpen && (
                <SettingsComponent onClose={() => setIsSettingsOpen(false)} />
            )}
        </div>
    );
};
