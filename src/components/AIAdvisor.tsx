import React, { useState, useMemo } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { X, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import type { BudgetItem } from '../types/budget';

// Removed Props as we don't need activeScenarioIndex passed down if we look at state,
// But for Advisor logic, we probably want to advise on the "Current Active" Plan?
// In Dashboard, there isn't a single "Active" plan...
// Let's assume Advisor talks about "Base vs Best Visible Sim" or just general advice.
// For now, let's keep it simple and just show general advice + stats if scenarios exist.

export const AIAdvisor: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const { scenarios, getMergedItems } = useBudgetStore();

    const calculateAnnualBalance = (items: BudgetItem[]) => {
        return items.reduce((total, item) => {
            let annualAmount = 0;
            if (item.frequencyType === 'monthly') {
                annualAmount = item.amount * 12;
            } else if (item.frequencyType === 'yearly') {
                annualAmount = item.amount;
            } else {
                annualAmount = item.amount * (12 / item.interval);
            }
            return total + (item.type === 'income' ? annualAmount : -annualAmount);
        }, 0);
    };

    const advice = useMemo(() => {
        const tips: { text: string; type: 'positive' | 'negative' | 'neutral'; icon?: React.ReactNode }[] = [];

        // 1. Sim vs Base Comparison (Take the last created Sim)
        if (scenarios.length > 1) {
            const baseItems = getMergedItems('base');
            const sim = scenarios[scenarios.length - 1]; // Compare latest
            const simItems = getMergedItems(sim.id);

            const baseBalance = calculateAnnualBalance(baseItems);
            const simBalance = calculateAnnualBalance(simItems);
            const diff = simBalance - baseBalance;

            if (diff > 0) {
                tips.push({
                    text: `最新のプラン「${sim.name}」なら、現在の家計より年間で約${(diff / 10000).toFixed(1)}万円の収支改善が見込めますよ！`,
                    type: 'positive',
                    icon: <TrendingUp className="text-green-500" size={20} />
                });
            } else if (diff < 0) {
                tips.push({
                    text: `プラン「${sim.name}」だと、年間で約${(Math.abs(diff) / 10000).toFixed(1)}万円、支出が増えそうです。無理のない範囲か確認してみましょう。`,
                    type: 'negative',
                    icon: <TrendingDown className="text-red-500" size={20} />
                });
            }
        } else {
            tips.push({ text: "家計簿へようこそ！「皮算用」タブで新しいプランを作って、未来の家計をシミュレーションしてみましょう。", type: 'neutral' });
        }

        // 2. General Budgeting Tips
        const generalTips = [
            "固定費（家賃、通信費）の見直しは、節約効果が長く続くのでおすすめです。",
            "1日1回財布を開く回数を減らすだけでも、無駄遣いは減らせますよ。",
            "ボーナスは「ないもの」として毎月の生活費を設計するのが貯蓄のコツです。",
            "「欲しい」と思ったら3日待ってみましょう。衝動買いを防げます。",
            "1000円単位でざっくり管理するのが長続きの秘訣です。"
        ];

        generalTips.forEach(tip => tips.push({ text: tip, type: 'neutral' }));

        return tips;
    }, [scenarios, getMergedItems]);

    const currentAdvice = advice[currentTipIndex % advice.length];

    const handleNext = () => {
        setCurrentTipIndex(prev => prev + 1);
    };

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Bubble */}
            {isOpen && (
                <div className="mb-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 w-80 pointer-events-auto animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Lightbulb size={18} className="text-yellow-500" />
                            たぬきのアドバイス
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex gap-3 mb-4">
                        {currentAdvice.icon && (
                            <div className="flex-shrink-0 mt-1">
                                {currentAdvice.icon}
                            </div>
                        )}
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {currentAdvice.text}
                        </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <span className="text-xs text-gray-400">
                            {currentTipIndex % advice.length + 1} / {advice.length}
                        </span>
                        <button
                            onClick={handleNext}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
                        >
                            次のアドバイス
                        </button>
                    </div>
                </div>
            )}

            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative"
            >
                {isOpen ? (
                    <X size={24} />
                ) : (
                    <>
                        <span className="text-2xl group-hover:animate-bounce">🦝</span>
                    </>
                )}
            </button>
        </div>
    );
};
