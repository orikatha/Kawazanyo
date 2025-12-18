import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { BudgetItem } from '../types/budget';

interface ActualInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (amount: number) => void;
    item?: BudgetItem;
    month: string; // YYYY-MM
    plannedAmount: number;
    initialActual?: number;
}

export const ActualInputModal: React.FC<ActualInputModalProps> = ({
    isOpen,
    onClose,
    onSave,
    item,
    month,
    plannedAmount,
    initialActual
}) => {
    const [amount, setAmount] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setAmount(initialActual !== undefined ? initialActual.toString() : '');
        }
    }, [isOpen, initialActual]);

    if (!isOpen || !item) return null;

    const [year, monthNum] = month.split('-').map(Number);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount === '' ? plannedAmount.toString() : amount, 10);
        onSave(isNaN(numAmount) ? 0 : numAmount);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">実績入力</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <div className="text-sm text-gray-500">{year}年{monthNum}月</div>
                        <div className="text-lg font-bold text-primary flex items-center">
                            {item.name}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-medium mb-1">皮算用プラン (予定)</div>
                        <div className="text-lg font-bold text-blue-700">¥{plannedAmount.toLocaleString()}</div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            今月の実際額 (実績)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={plannedAmount.toString()}
                                className="w-full pl-8 pr-4 py-3 text-lg font-bold border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-gray-400">
                            ※未入力の場合は、プランの金額（¥{plannedAmount.toLocaleString()}）が適用されます。
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            <Save size={18} />
                            <span>保存する</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
