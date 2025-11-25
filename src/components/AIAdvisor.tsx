import React, { useState, useMemo, useEffect } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { X, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import type { BudgetItem } from '../types/budget';

interface AIAdvisorProps {
    activeScenarioIndex: 0 | 1 | 2;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ activeScenarioIndex }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const { scenarios, getMergedItems } = useBudgetStore();

    // Reset tip index when scenario changes
    useEffect(() => {
        setCurrentTipIndex(0);
    }, [activeScenarioIndex]);

    const calculateAnnualBalance = (items: BudgetItem[]) => {
        return items.reduce((total, item) => {
            let annualAmount = 0;
            if (item.frequencyType === 'monthly') {
                annualAmount = item.amount * 12;
            } else if (item.frequencyType === 'yearly') {
                annualAmount = item.amount;
            } else {
                // Custom interval (e.g., every 2 months)
                annualAmount = item.amount * (12 / item.interval);
            }
            return total + (item.type === 'income' ? annualAmount : -annualAmount);
        }, 0);
    };

    const advice = useMemo(() => {
        const tips: { text: string; type: 'positive' | 'negative' | 'neutral'; icon?: React.ReactNode }[] = [];

        const activeScenario = scenarios[activeScenarioIndex];
        const isSimActive = activeScenarioIndex !== 0;

        // 1. Scenario Specific Advice
        if (isSimActive && activeScenario) {
            const baseItems = getMergedItems(0);
            const simItems = getMergedItems(activeScenarioIndex);

            const baseBalance = calculateAnnualBalance(baseItems);
            const simBalance = calculateAnnualBalance(simItems);
            const diff = simBalance - baseBalance;

            if (diff > 0) {
                tips.push({
                    text: `おめでとうございます！このプランなら、年間で約${(diff / 10000).toFixed(1)}万円の収支改善が見込めますよ！`,
                    type: 'positive',
                    icon: <TrendingUp className="text-green-500" size={20} />
                });
            } else if (diff < 0) {
                tips.push({
                    text: `むむっ…このプランだと、年間で約${(Math.abs(diff) / 10000).toFixed(1)}万円、収支が悪化してしまいます。支出を見直してみませんか？`,
                    type: 'negative',
                    icon: <TrendingDown className="text-red-500" size={20} />
                });
            } else {
                tips.push({
                    text: `現在の家計と収支は変わりません。項目を並べ替えたりして、シミュレーションを楽しんでくださいね！`,
                    type: 'neutral'
                });
            }
        } else {
            tips.push({ text: "家計簿へようこそ！まずは「＋」ボタンから、現在の収入と支出を入力して現状を把握しましょう。", type: 'neutral' });
        }

        // 2. General Budgeting Tips (Randomized or cycled)
        const generalTips = [
            "固定費（家賃、通信費、サブスク）の見直しは、一度やるだけでずっと節約効果が続くのでおすすめです！",
            "「使途不明金」を減らすだけで、年間数万円の節約になることも。レシートを撮る習慣をつけてみましょう。",
            "1000円単位でざっくり管理するのが長続きのコツです。1円単位で合わせようとすると疲れちゃいますからね。",
            "ボーナスは「ないもの」として生活費を組み立てると、貯蓄スピードが格段に上がりますよ！",
            "コンビニに寄る回数を週1回減らすだけでも、年間では大きな節約になります。",
            "欲しいものがあったら、3日間だけ待ってみましょう。「本当に必要か？」を考える良い冷却期間になります。"
        ];

        // Add a few general tips
        generalTips.forEach(tip => tips.push({ text: tip, type: 'neutral' }));

        return tips;
    }, [scenarios, activeScenarioIndex, getMergedItems]);

    const currentAdvice = advice[currentTipIndex % advice.length];

    const handleNext = () => {
        setCurrentTipIndex(prev => prev + 1);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
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
                        {/* Notification Dot - Show if it's a simulation and we have a positive result? Maybe later. */}
                    </>
                )}
            </button>
        </div>
    );
};
