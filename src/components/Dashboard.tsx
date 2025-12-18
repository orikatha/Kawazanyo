import React, { useMemo, useState } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { BudgetItem } from '../types/budget';
import { ActualInputModal } from './ActualInputModal';

export const Dashboard: React.FC = () => {
    const {
        scenarios, getMergedItems,
        monthlyActuals, setMonthlyActual
    } = useBudgetStore();

    // Month Selection State
    const [currentDate, setCurrentDate] = useState(new Date()); // The selected month
    const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');

    // Scenario Comparison State (Slot 1, Slot 2)
    // Default: Slot 1 is the first available Sim if exists
    const [comparisonSlots, setComparisonSlots] = useState<[string | null, string | null]>([
        scenarios.length > 1 ? scenarios[1].id : null,
        null
    ]);

    // Update slots if scenarios are deleted
    // UseEffect to clean up slots if the selected scenario no longer exists?
    // Doing it in render logic is safer or useEffect.
    // Let's just rely on robust map logic.

    // Actual Input Modal State
    const [isActualModalOpen, setIsActualModalOpen] = useState(false);
    const [selectedItemForActual, setSelectedItemForActual] = useState<{ item: BudgetItem, monthlyPlan: number } | undefined>(undefined);

    // Helpers for Date
    const getMonthStr = (date: Date) => {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        return `${y}-${m.toString().padStart(2, '0')}`;
    };

    const formatMonthDisplay = (date: Date) => {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    };

    const addMonths = (date: Date, months: number) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    };

    const currentMonthStr = getMonthStr(currentDate);

    // --- Calculation Logic ---

    // Calculate the "Effective Amount" for a specific item in a specific month
    // Returns { amount: number, isActual: boolean }
    const getEffectiveAmount = (scenarioId: string, item: BudgetItem, monthStr: string) => {
        // 1. Check if there is an Actual
        const actualKey = `${scenarioId}-${item.id}-${monthStr}`;
        if (monthlyActuals[actualKey] !== undefined) {
            return { amount: monthlyActuals[actualKey], isActual: true };
        }

        // 2. Calculate Plan amount
        const [, m] = monthStr.split('-').map(Number);

        if (item.frequencyType === 'monthly') {
            return { amount: item.type === 'income' ? item.amount : -item.amount, isActual: false };
        } else if (item.frequencyType === 'yearly') {
            if (m === item.startMonth) {
                return { amount: item.type === 'income' ? item.amount : -item.amount, isActual: false };
            }
        } else {
            // Interval based logic
            // Simple logic: if (m - startMonth) % interval === 0
            // Handling wrap around simply for MVP:
            let diff = m - item.startMonth;
            if (diff < 0) diff += 12;
            if ((m - item.startMonth) % item.interval === 0) {
                return { amount: item.type === 'income' ? item.amount : -item.amount, isActual: false };
            }
        }

        return { amount: 0, isActual: false };
    };

    // --- Graph Data Generation ---
    const graphData = useMemo(() => {
        const data: any[] = [];
        // Generate range: 1 Year View
        const startOffset = -2;
        const endOffset = 9;

        // Initialize cumulative assets map for all involved scenarios
        // Include Base + Slot1 + Slot2 (Use Set to dedup in case of logic errors, though UI blocks it)
        const activeIds = Array.from(new Set(['base', comparisonSlots[0], comparisonSlots[1]].filter(Boolean))) as string[];
        let cumulativeAssets: Record<string, number> = {};
        activeIds.forEach(id => cumulativeAssets[id] = 0);

        for (let i = startOffset; i <= endOffset; i++) {
            const date = addMonths(currentDate, i);
            const mStr = getMonthStr(date);
            const row: any = {
                month: mStr, // 2025-01
                displayMonth: `${date.getFullYear()}年${date.getMonth() + 1}月`, // Axis Label
                isCurrent: i === 0, // Marker for Red Line
            };

            activeIds.forEach((id) => {
                const items = getMergedItems(id);
                // Simple optimization: check if scenarios actually exist (e.g. if deleted)
                const scenarioExists = scenarios.some(s => s.id === id);
                if (!scenarioExists) return;

                const monthlyTotal = items.reduce((sum, item) => {
                    return sum + getEffectiveAmount(id, item, mStr).amount;
                }, 0);

                cumulativeAssets[id] += monthlyTotal;

                if (viewMode === 'monthly') {
                    row[`balance_${id}`] = monthlyTotal;
                } else {
                    row[`asset_${id}`] = cumulativeAssets[id];
                }
            });

            data.push(row);
        }
        return data;
    }, [currentDate, scenarios, monthlyActuals, comparisonSlots, viewMode, getMergedItems]);

    // --- Current Month Items List ---
    const currentMonthItems = useMemo(() => {
        // Logic: Show items for the "Most Significant" visible scenario.
        // Priority: Slot 2 > Slot 1 > Base
        let targetId = 'base';
        if (comparisonSlots[0]) targetId = comparisonSlots[0];
        if (comparisonSlots[1]) targetId = comparisonSlots[1];

        // Ensure it still exists
        if (!scenarios.some(s => s.id === targetId)) targetId = 'base';

        const items = getMergedItems(targetId);
        const mStr = currentMonthStr;

        return items.map(item => {
            const { amount, isActual } = getEffectiveAmount(targetId, item, mStr);
            const planned = item.type === 'income' ? item.amount : -item.amount;
            const isRelevant = amount !== 0 || (item.frequencyType === 'monthly');

            if (!isRelevant) return null;

            return {
                item,
                scenarioId: targetId,
                scenarioName: scenarios.find(s => s.id === targetId)?.name,
                displayAmount: amount,
                plannedAmount: planned,
                isActual
            };
        }).filter(Boolean); // Remove nulls
    }, [currentDate, comparisonSlots, scenarios, getMergedItems, monthlyActuals]);


    // Handlers
    const handlePrevMonth = () => setCurrentDate(addMonths(currentDate, -1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleItemClick = (data: any) => {
        setSelectedItemForActual({
            item: data.item,
            monthlyPlan: Math.abs(data.plannedAmount) // Pass absolute value for input
        });
        setIsActualModalOpen(true);
    };

    const handleActualSave = (amount: number) => {
        if (!selectedItemForActual) return;
        const { item } = selectedItemForActual;
        const signedAmount = item.type === 'income' ? amount : -amount;

        // Find target scenario same as list logic
        let targetId = 'base';
        if (comparisonSlots[0]) targetId = comparisonSlots[0];
        if (comparisonSlots[1]) targetId = comparisonSlots[1];
        if (!scenarios.some(s => s.id === targetId)) targetId = 'base';

        setMonthlyActual(targetId, item.id, currentMonthStr, signedAmount);
    };


    return (
        <div className="space-y-6">
            {/* Top Bar: Selector & Month */}
            <div className="flex flex-col space-y-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ChevronLeft />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">
                        {formatMonthDisplay(currentDate)}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ChevronRight />
                    </button>
                </div>

                {/* Scenario Comparison Selectors */}
                <div className="flex flex-col space-y-2">
                    {/* Fixed Base */}
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-3 h-3 rounded-full bg-gray-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-gray-700">現在の家計</span>
                        <span className="text-xs text-gray-400 ml-auto">固定</span>
                    </div>

                    {/* Comparison Slot 1 */}
                    <div className="flex items-center space-x-2 p-1 rounded-lg border border-gray-100">
                        <div className="w-3 h-3 rounded-full bg-indigo-600 flex-shrink-0 ml-1" />
                        <select
                            value={comparisonSlots[0] || ''}
                            onChange={(e) => {
                                const val = e.target.value || null;
                                setComparisonSlots(prev => [val, prev[1]]);
                            }}
                            className="w-full bg-transparent text-sm p-1 focus:outline-none text-gray-700 font-medium"
                        >
                            <option value="">(未選択)</option>
                            {scenarios.filter(s => s.id !== 'base').map(s => (
                                <option
                                    key={s.id}
                                    value={s.id}
                                    disabled={s.id === comparisonSlots[1]}
                                    className={s.id === comparisonSlots[1] ? 'text-gray-400' : ''}
                                >
                                    {s.name} {s.id === comparisonSlots[1] ? '(選択済)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Comparison Slot 2 */}
                    <div className="flex items-center space-x-2 p-1 rounded-lg border border-gray-100">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0 ml-1" />
                        <select
                            value={comparisonSlots[1] || ''}
                            onChange={(e) => {
                                const val = e.target.value || null;
                                setComparisonSlots(prev => [prev[0], val]);
                            }}
                            className="w-full bg-transparent text-sm p-1 focus:outline-none text-gray-700 font-medium"
                        >
                            <option value="">(未選択)</option>
                            {scenarios.filter(s => s.id !== 'base').map(s => (
                                <option
                                    key={s.id}
                                    value={s.id}
                                    disabled={s.id === comparisonSlots[0]}
                                    className={s.id === comparisonSlots[0] ? 'text-gray-400' : ''}
                                >
                                    {s.name} {s.id === comparisonSlots[0] ? '(選択済)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Graph Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold text-gray-500">推移グラフ</h2>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
                        >
                            <BarChart3 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('cumulative')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'cumulative' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
                        >
                            <TrendingUp size={18} />
                        </button>
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {viewMode === 'monthly' ? (
                            <BarChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="displayMonth" tick={{ fontSize: 10 }} interval={2} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `¥${value / 10000}万`} />
                                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                {/* Red Cursor Line for Current Selected Month */}
                                <ReferenceLine x={formatMonthDisplay(currentDate)} stroke="red" strokeWidth={2} {...{ isFront: true } as any} />

                                <Bar dataKey="balance_base" name="現在の家計" fill="#6B7280" radius={[4, 4, 0, 0]} />
                                {comparisonSlots[0] && <Bar dataKey={`balance_${comparisonSlots[0]}`} name={scenarios.find(s => s.id === comparisonSlots[0])?.name || ''} fill="#4F46E5" radius={[4, 4, 0, 0]} />}
                                {comparisonSlots[1] && <Bar dataKey={`balance_${comparisonSlots[1]}`} name={scenarios.find(s => s.id === comparisonSlots[1])?.name || ''} fill="#10B981" radius={[4, 4, 0, 0]} />}
                            </BarChart>
                        ) : (
                            <LineChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="displayMonth" tick={{ fontSize: 10 }} interval={2} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `¥${value / 10000}万`} />
                                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                <Legend />
                                <ReferenceLine x={formatMonthDisplay(currentDate)} stroke="red" strokeWidth={2} />

                                <Line type="monotone" dataKey="asset_base" name="現在の家計" stroke="#6B7280" strokeWidth={2} dot={false} />
                                {comparisonSlots[0] && <Line type="monotone" dataKey={`asset_${comparisonSlots[0]}`} name={scenarios.find(s => s.id === comparisonSlots[0])?.name || ''} stroke="#4F46E5" strokeWidth={2} dot={false} />}
                                {comparisonSlots[1] && <Line type="monotone" dataKey={`asset_${comparisonSlots[1]}`} name={scenarios.find(s => s.id === comparisonSlots[1])?.name || ''} stroke="#10B981" strokeWidth={2} dot={false} />}
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Items List (Actuals Entry) */}
            <div className="space-y-3 pb-20">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-gray-700">今月の収支・実績</h3>
                    <p className="text-xs text-gray-400">タップして実績を入力</p>
                </div>

                {currentMonthItems.length > 0 ? (
                    currentMonthItems.map((data: any) => (
                        <div
                            key={data.item.id}
                            onClick={() => handleItemClick(data)}
                            className={`flex justify-between items-center p-4 rounded-xl border transition-all active:scale-98 cursor-pointer ${data.isActual
                                ? 'bg-white border-green-200 shadow-sm ring-1 ring-green-100'
                                : 'bg-white border-gray-100 hover:border-blue-200'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                {data.isActual ? (
                                    <div className="text-green-500"><CheckCircle2 size={20} /></div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                                )}
                                <div>
                                    <div className="font-bold text-gray-800">{data.item.name}</div>
                                    <div className="text-xs text-gray-400">{data.item.category}</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`font-bold text-lg ${data.item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                    {data.item.type === 'income' ? '+' : '-'}¥{Math.abs(data.displayAmount).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {data.isActual ? (
                                        <span className="text-green-600 font-medium">実績確定</span>
                                    ) : (
                                        <span>予定: ¥{Math.abs(data.plannedAmount).toLocaleString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl">
                        この月の項目はありません。
                    </div>
                )}
            </div>

            <ActualInputModal
                isOpen={isActualModalOpen}
                onClose={() => setIsActualModalOpen(false)}
                onSave={handleActualSave}
                item={selectedItemForActual?.item}
                month={currentMonthStr}
                plannedAmount={selectedItemForActual?.monthlyPlan || 0}
                initialActual={selectedItemForActual?.item ? monthlyActuals[selectedItemForActual.item.id] : undefined}
            />
        </div>
    );
};
