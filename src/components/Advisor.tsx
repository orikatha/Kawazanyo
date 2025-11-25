import React from 'react';

export const Advisor: React.FC = () => {
    return (
        <div className="p-4 bg-surface rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">AIアドバイザー</h2>
            <p className="text-gray-500">
                ここにチャット画面が表示されます。<br />
                「ペットを飼いたい」「同棲したい」などの相談ができます。
            </p>
        </div>
    );
};
