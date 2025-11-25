import React, { useState, useEffect } from 'react';
import { X, Trash2, RotateCcw } from 'lucide-react';
import type { BudgetItem, ItemType, FrequencyType } from '../types/budget';
import { useBudgetStore } from '../store/budgetStore';

interface ItemEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<BudgetItem, 'id'>) => void;
    onDelete?: () => void;
    onRestore?: () => void;
    initialItem?: BudgetItem;
    isDeleted?: boolean;
}

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({
    isOpen, onClose, onSave, onDelete, onRestore, initialItem, isDeleted = false
}) => {
    const { comparisonSpan } = useBudgetStore();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [type, setType] = useState<ItemType>('expense');
    const [category, setCategory] = useState('');
    const [frequencyType, setFrequencyType] = useState<FrequencyType>('monthly');
    const [interval, setInterval] = useState<number>(1);
    const [startMonth, setStartMonth] = useState<number>(1);
    const [endMonth, setEndMonth] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialItem) {
                setName(initialItem.name);
                setAmount(initialItem.amount);
                setType(initialItem.type);
                setCategory(initialItem.category);
                setFrequencyType(initialItem.frequencyType);
                setInterval(initialItem.interval);
                setStartMonth(initialItem.startMonth);
                setEndMonth(initialItem.endMonth);
            } else {
                // Defaults for new item
                setName('');
                setAmount(0);
                setType('expense');
                setCategory('');
                setFrequencyType('monthly');
                setInterval(1);
                setStartMonth(1);
                setEndMonth(null);
            }
        }
    }, [isOpen, initialItem]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            amount,
            type,
            category,
            frequencyType,
            interval,
            startMonth,
            endMonth
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-800">
                        {isDeleted ? '項目の復元' : initialItem ? '項目の編集' : '新規項目の追加'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`py-2 rounded-md text-sm font-medium transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            disabled={isDeleted}
                        >
                            収入
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`py-2 rounded-md text-sm font-medium transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            disabled={isDeleted}
                        >
                            支出
                        </button>
                    </div>

                    {/* Name & Amount & Category */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">項目名</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="例: 給与、家賃"
                                disabled={isDeleted}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">金額</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                                    disabled={isDeleted}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">カテゴリ</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="例: 食費、固定費"
                                disabled={isDeleted}
                            />
                        </div>
                    </div>

                    {/* Frequency Settings */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-500">頻度設定</label>
                        <div className="flex space-x-2">
                            {(['monthly', 'yearly', 'custom'] as const).map((ft) => (
                                <button
                                    key={ft}
                                    type="button"
                                    onClick={() => {
                                        setFrequencyType(ft);
                                        if (ft === 'monthly') setInterval(1);
                                        if (ft === 'yearly') setInterval(12);
                                    }}
                                    className={`flex-1 py-1.5 text-xs rounded-md border ${frequencyType === ft
                                        ? 'bg-primary/5 border-primary text-primary'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    disabled={isDeleted}
                                >
                                    {ft === 'monthly' ? '毎月' : ft === 'yearly' ? '毎年' : 'カスタム'}
                                </button>
                            ))}
                        </div>

                        {frequencyType === 'custom' && (
                            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                                <span className="text-xs text-gray-600">頻度:</span>
                                <select
                                    value={interval}
                                    onChange={(e) => setInterval(Number(e.target.value))}
                                    className="bg-white border border-gray-200 rounded px-2 py-1 text-sm"
                                    disabled={isDeleted}
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}ヶ月ごと</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">開始月</label>
                                <select
                                    value={startMonth}
                                    onChange={(e) => setStartMonth(Number(e.target.value))}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    disabled={isDeleted}
                                >
                                    {[...Array(comparisonSpan)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}ヶ月目</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">終了月</label>
                                <select
                                    value={endMonth === null ? 'null' : endMonth}
                                    onChange={(e) => setEndMonth(e.target.value === 'null' ? null : Number(e.target.value))}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    disabled={isDeleted}
                                >
                                    <option value="null">指定しない</option>
                                    {[...Array(comparisonSpan)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}ヶ月目</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
                        <div>
                            {isDeleted ? (
                                <button
                                    type="button"
                                    onClick={onRestore}
                                    className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                                >
                                    <RotateCcw size={16} />
                                    <span>項目を復元</span>
                                </button>
                            ) : initialItem && onDelete ? (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                                >
                                    <Trash2 size={16} />
                                    <span>項目を削除</span>
                                </button>
                            ) : (
                                <div /> // Spacer
                            )}
                        </div>

                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                            >
                                キャンセル
                            </button>
                            {!isDeleted && (
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm shadow-primary/30"
                                >
                                    保存する
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
