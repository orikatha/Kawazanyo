import React from 'react';
import { X, MoveVertical, Leaf, Trash2 } from 'lucide-react';

interface HelpOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-primary/5">
                    <h3 className="font-bold text-gray-800 text-lg">
                        皮算用家計簿の使い方
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Reordering */}
                    <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 mt-1">
                            <MoveVertical size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-1">項目の並べ替え</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                項目を<span className="font-bold text-primary">長押し</span>してドラッグ＆ドロップすることで、自由に並び順を変更できます。
                            </p>
                        </div>
                    </div>

                    {/* Simulation */}
                    <div className="flex items-start space-x-4">
                        <div className="bg-green-100 p-3 rounded-full text-green-600 mt-1">
                            <Leaf size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-1">シミュレーション（皮算用）</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                「未設定」タブを押して新しいプランを作成できます。
                                変更した項目には<span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mx-1"><Leaf size={10} className="mr-1" />マーク</span>がつきます。
                            </p>
                        </div>
                    </div>

                    {/* Deletion/Restore */}
                    <div className="flex items-start space-x-4">
                        <div className="bg-red-100 p-3 rounded-full text-red-600 mt-1">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-1">削除と復元</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                項目をタップして編集画面から削除できます。
                                削除された項目は取り消し線が表示され、いつでも復元可能です。
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
                    >
                        わかった！
                    </button>
                </div>
            </div>
        </div>
    );
};
