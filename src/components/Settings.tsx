import React, { useRef } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { Download, Upload, Crown, ArrowLeft } from 'lucide-react';

interface SettingsProps {
    onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const state = useBudgetStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kawazanyo_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                // Basic validation could be added here
                if (json.scenarios) {
                    state.importData(json);
                    alert('データを復元しました。');
                } else {
                    alert('無効なデータ形式です。');
                }
            } catch (error) {
                console.error('Import failed:', error);
                alert('読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    };

    const handleProToggle = () => {
        if (state.isPro) {
            if (confirm('Pro版を解約しますか？（シミュレーション）')) {
                state.setPro(false);
            }
        } else {
            if (confirm('Pro版（広告非表示）を購入しますか？（シミュレーション）')) {
                state.setPro(true);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
            <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center">
                <button onClick={onClose} className="mr-4 p-1 rounded-full hover:bg-gray-100">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">設定</h1>
            </div>

            <div className="p-4 space-y-6 max-w-md mx-auto">
                {/* Monetization Section */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Crown className="mr-2 text-yellow-500" />
                        プラン設定
                    </h2>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="font-medium">現在のプラン</div>
                            <div className={`text-sm ${state.isPro ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>
                                {state.isPro ? 'Pro版 (広告なし)' : '無料版'}
                            </div>
                        </div>
                        <button
                            onClick={handleProToggle}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${state.isPro
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md hover:shadow-lg'
                                }`}
                        >
                            {state.isPro ? '解約する' : 'Proにアップグレード'}
                        </button>
                    </div>
                    {!state.isPro && (
                        <p className="text-xs text-gray-500">
                            ※これはシミュレーションです。実際の課金は発生しません。
                        </p>
                    )}
                </section>

                {/* Data Management Section */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Download className="mr-2 text-blue-500" />
                        データ管理
                    </h2>
                    <div className="space-y-3">
                        <button
                            onClick={handleExport}
                            className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                            <Download size={18} className="mr-2" />
                            データをバックアップ (保存)
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            <Upload size={18} className="mr-2" />
                            データを復元 (読み込み)
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".json"
                            className="hidden"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            ※バックアップファイル（.json）を読み込むと、現在のデータは上書きされます。
                        </p>
                    </div>
                </section>

                <div className="text-center text-xs text-gray-400 mt-8">
                    Kawazanyo App v0.1.0
                </div>
            </div>
        </div>
    );
};
