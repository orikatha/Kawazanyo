import React from 'react';
import { useBudgetStore } from '../store/budgetStore';

export const AdBanner: React.FC = () => {
    const isPro = useBudgetStore((state) => state.isPro);

    if (isPro) return null;

    return (
        <div className="w-full bg-gray-200 border-t border-gray-300 p-2 flex flex-col items-center justify-center text-xs text-gray-500 sticky bottom-0 z-50">
            <div className="font-bold mb-1">広告</div>
            <div className="w-[320px] h-[50px] bg-white border border-gray-400 flex items-center justify-center">
                バナー広告スペース (320x50)
            </div>
            <div className="mt-1 text-[10px]">
                Pro版にアップグレードして広告を非表示
            </div>
        </div>
    );
};
