import React, { useMemo, useState, useEffect } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Plus, TrendingUp, BarChart3, Leaf, Pencil, Check, GripVertical } from 'lucide-react';
import type { BudgetItem } from '../types/budget';
import { ItemEditorModal } from './ItemEditorModal';
import { AIAdvisor } from './AIAdvisor';

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor,
    MouseSensor
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
interface SortableItemProps {
    item: BudgetItem;
    status: 'base' | 'modified' | 'added' | 'deleted';
    original?: BudgetItem;
    onEdit: (item: BudgetItem, isDeleted: boolean) => void;
}

const SortableItem = ({ item, status, original, onEdit }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const isDeleted = status === 'deleted';
    const isModified = status === 'modified';
    const isAdded = status === 'added';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex justify-between items-center p-3 rounded-lg transition-colors touch-manipulation ${isDeleted ? 'bg-gray-100 opacity-70' : 'bg-gray-50 hover:bg-gray-100'
                }`}
        >
            {/* Drag Handle & Content Wrapper */}
            <div className="flex items-center flex-1 space-x-3 overflow-hidden">
                <div
                    {...attributes}
                    {...listeners}
                    className="text-gray-300 cursor-grab active:cursor-grabbing p-1 hover:text-gray-500 touch-none"
                >
                    <GripVertical size={18} />
                </div>

                <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onEdit(item, isDeleted)}
                >
                    <div className="flex items-center space-x-2">
                        {(isModified || isAdded || isDeleted) && <Leaf size={14} className={isDeleted ? 'text-gray-400' : 'text-green-500'} />}

                        <span className={`font-medium truncate ${isDeleted ? 'line-through text-gray-500' : ''}`}>
                            {item.name}
                        </span>

                        {!isDeleted && (
                            <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 whitespace-nowrap">
                                {item.frequencyType === 'monthly' ? '毎月' :
                                    item.frequencyType === 'yearly' ? '毎年' :
                                        `${item.interval}ヶ月毎`}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{item.category}</div>
                </div>
            </div>

            {/* Amount */}
            <div className="text-right pl-2 cursor-pointer" onClick={() => onEdit(item, isDeleted)}>
                <div className={`font-medium whitespace-nowrap ${isDeleted ? 'line-through text-gray-400' : item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'income' ? '+' : '-'}¥{item.amount.toLocaleString()}
                </div>
                {(isModified || isDeleted) && original && (
                    <div className="text-[10px] text-gray-400 whitespace-nowrap">
                        Ref: ¥{original.amount.toLocaleString()}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const {
        scenarios, comparisonSpan, addItem, removeItem, restoreItem, updateItem,
        addScenario, updateScenarioName, getMergedItems, getDashboardItems, reorderItems
    } = useBudgetStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | undefined>(undefined);
    const [isDeletedItem, setIsDeletedItem] = useState(false);
    const [activeScenarioIndex, setActiveScenarioIndex] = useState<0 | 1 | 2>(0);
    const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');

    // UI State
    const [isTanukiFilterOn, setIsTanukiFilterOn] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    const activeScenario = scenarios[activeScenarioIndex];

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Long press to drag on touch devices
                tolerance: 5,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10, // Drag distance for mouse
            },
        })
    );

    useEffect(() => {
        if (activeScenario) {
            setTempName(activeScenario.name);
            setIsEditingName(false); // Reset editing state when switching tabs
        }
    }, [activeScenarioIndex, activeScenario]);

    const handleAddItem = () => {
        if (!activeScenario) return;
        setEditingItem(undefined);
        setIsDeletedItem(false);
        setIsModalOpen(true);
    };

    const handleEditItem = (item: BudgetItem, isDeleted: boolean) => {
        setEditingItem(item);
        setIsDeletedItem(isDeleted);
        setIsModalOpen(true);
    };

    const handleSaveItem = (itemData: Omit<BudgetItem, 'id'>) => {
        if (editingItem) {
            updateItem(activeScenarioIndex, editingItem.id, itemData);
        } else {
            addItem(activeScenarioIndex, itemData);
        }
    };

    const handleDeleteItem = () => {
        if (editingItem) {
            removeItem(activeScenarioIndex, editingItem.id);
            setIsModalOpen(false);
        }
    };

    const handleRestoreItem = () => {
        if (editingItem && activeScenarioIndex !== 0) {
            restoreItem(activeScenarioIndex as 1 | 2, editingItem.id);
            setIsModalOpen(false);
        }
    };

    const handleCreateScenario = (index: 1 | 2) => {
        const name = index === 1 ? '皮算用プランA' : '皮算用プランB';
        addScenario(index, name);
        setActiveScenarioIndex(index);
    };

    const handleNameSave = () => {
        if (tempName.trim()) {
            updateScenarioName(activeScenarioIndex, tempName);
        }
        setIsEditingName(false);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const items = dashboardItems.map(i => i.item.id);
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over.id as string);

            const newOrder = arrayMove(items, oldIndex, newIndex);
            reorderItems(activeScenarioIndex, newOrder);
        }
    };

    const calculateMonthlyData = (items: BudgetItem[], monthIndex: number): number => {
        const currentMonth = monthIndex + 1;
        return items.reduce((total, item) => {
            if (currentMonth < item.startMonth) return total;
            if (item.endMonth !== null && currentMonth > item.endMonth) return total;
            if ((currentMonth - item.startMonth) % item.interval !== 0) return total;
            return total + (item.type === 'income' ? item.amount : -item.amount);
        }, 0);
    };

    const graphData = useMemo(() => {
        const data: any[] = [];
        let assets = [0, 0, 0];

        for (let i = 0; i < comparisonSpan; i++) {
            const monthLabel = `${i + 1}ヶ月`;
            const row: any = { month: monthLabel };

            [0, 1, 2].forEach((index) => {
                if (!scenarios[index as 0 | 1 | 2]) return;
                const items = getMergedItems(index as 0 | 1 | 2);
                const flow = calculateMonthlyData(items, i);
                assets[index] += flow;

                if (viewMode === 'monthly') {
                    row[`balance${index}`] = flow;
                } else {
                    row[`asset${index}`] = assets[index];
                }
            });

            data.push(row);
        }
        return data;
    }, [scenarios, comparisonSpan, viewMode, getMergedItems]);

    const dashboardItems = useMemo(() => {
        let items = getDashboardItems(activeScenarioIndex);
        if (isTanukiFilterOn && activeScenarioIndex !== 0) {
            items = items.filter(i => i.status !== 'base');
        }
        return items;
    }, [activeScenarioIndex, scenarios, isTanukiFilterOn, getDashboardItems]);

    return (
        <div className="space-y-6">
            <div className="space-y-6">
                {/* Graph Section */}
                <div className="bg-surface p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            {viewMode === 'monthly' ? '月次収支推移' : '資産推移シミュレーション'}
                        </h2>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
                            >
                                <BarChart3 size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('cumulative')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'cumulative' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
                            >
                                <TrendingUp size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {viewMode === 'monthly' ? (
                                <BarChart data={graphData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `¥${value / 10000}万`} />
                                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="balance0" name="現在の家計" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                                    {scenarios[1] && <Bar dataKey="balance1" name={scenarios[1].name} fill="#4F46E5" radius={[4, 4, 0, 0]} />}
                                    {scenarios[2] && <Bar dataKey="balance2" name={scenarios[2].name} fill="#10B981" radius={[4, 4, 0, 0]} />}
                                </BarChart>
                            ) : (
                                <LineChart data={graphData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `¥${value / 10000}万`} />
                                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="asset0" name="現在の家計" stroke="#9CA3AF" strokeWidth={2} dot={false} />
                                    {scenarios[1] && <Line type="monotone" dataKey="asset1" name={scenarios[1].name} stroke="#4F46E5" strokeWidth={2} dot={false} />}
                                    {scenarios[2] && <Line type="monotone" dataKey="asset2" name={scenarios[2].name} stroke="#10B981" strokeWidth={2} dot={false} />}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Scenario Tabs */}
                <div className="flex space-x-2 border-b border-gray-200 pb-1 overflow-x-auto">
                    {[0, 1, 2].map((index) => {
                        const scenario = scenarios[index as 0 | 1 | 2];
                        const isActive = activeScenarioIndex === index;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (scenario) setActiveScenarioIndex(index as 0 | 1 | 2);
                                    else if (index !== 0) handleCreateScenario(index as 1 | 2);
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${isActive
                                    ? 'bg-white text-primary border-b-2 border-primary'
                                    : scenario
                                        ? 'text-gray-700 hover:bg-gray-50'
                                        : 'text-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                {scenario ? scenario.name : '未設定'}
                            </button>
                        );
                    })}
                </div>

                {/* Items List */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-surface p-4 rounded-xl shadow-sm border border-gray-100">
                        {activeScenario ? (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center space-x-2">
                                        {isEditingName ? (
                                            <div className="flex items-center space-x-1">
                                                <input
                                                    type="text"
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    className="border rounded px-2 py-1 text-sm"
                                                    autoFocus
                                                />
                                                <button onClick={handleNameSave} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-semibold text-gray-700">{activeScenario.name}</h3>
                                                {activeScenarioIndex !== 0 && (
                                                    <button
                                                        onClick={() => setIsEditingName(true)}
                                                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {activeScenarioIndex !== 0 && (
                                            <button
                                                onClick={() => setIsTanukiFilterOn(!isTanukiFilterOn)}
                                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${isTanukiFilterOn
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-gray-100 text-gray-500 border border-transparent'
                                                    }`}
                                            >
                                                <Leaf size={12} />
                                                <span>皮算用のみ</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={handleAddItem}
                                            className="text-primary hover:bg-primary/10 p-1 rounded"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={dashboardItems.map(i => i.item.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {dashboardItems.map((data) => (
                                                <SortableItem
                                                    key={data.item.id}
                                                    {...data}
                                                    onEdit={handleEditItem}
                                                />
                                            ))}
                                            {dashboardItems.length === 0 && (
                                                <div className="text-center text-gray-400 py-4 text-sm">
                                                    {isTanukiFilterOn ? '皮算用（変更・追加）項目はありません。' : '項目がありません。'}
                                                </div>
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 py-8 text-sm">
                                このプランは未設定です。<br />
                                タブをクリックして新しい皮算用プランを作成してください。
                            </div>
                        )}
                    </div>
                </div>

                <ItemEditorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveItem}
                    onDelete={handleDeleteItem}
                    onRestore={handleRestoreItem}
                    initialItem={editingItem}
                    isDeleted={isDeletedItem}
                />

                <AIAdvisor activeScenarioIndex={activeScenarioIndex} />
            </div>
        </div>
    );
};
