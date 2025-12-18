import React, { useMemo, useState, useEffect } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { Plus, Leaf, Pencil, Check, GripVertical, AlertCircle, Trash2 } from 'lucide-react';
import type { BudgetItem } from '../types/budget';
import { ItemEditorModal } from './ItemEditorModal';

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
            className={`flex justify-between items-center p-3 rounded-lg transition-colors touch-manipulation ${isDeleted ? 'bg-gray-100 opacity-70' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'
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

                        <span className={`font-medium truncate ${isDeleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            {item.name}
                        </span>

                        {!isDeleted && (
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 whitespace-nowrap">
                                {item.frequencyType === 'monthly' ? '毎月' :
                                    item.frequencyType === 'yearly' ? '毎年' :
                                        `${item.interval}ヶ月毎`}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{item.category}</div>
                </div>
            </div>

            {/* Amount */}
            <div className="text-right pl-2 cursor-pointer" onClick={() => onEdit(item, isDeleted)}>
                <div className={`font-medium whitespace-nowrap ${isDeleted ? 'line-through text-gray-400' : item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
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

export const Plans: React.FC = () => {
    const {
        scenarios, addItem, removeItem, restoreItem, updateItem,
        addScenario, removeScenario, updateScenarioName, getDashboardItems, reorderItems
    } = useBudgetStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | undefined>(undefined);
    const [isDeletedItem, setIsDeletedItem] = useState(false);
    // Use ID instead of index
    const [activeScenarioId, setActiveScenarioId] = useState<string>('base');

    // UI State
    const [isTanukiFilterOn, setIsTanukiFilterOn] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    const activeScenario = scenarios.find(s => s.id === activeScenarioId);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );

    useEffect(() => {
        if (activeScenario) {
            setTempName(activeScenario.name);
            setIsEditingName(false);
        } else if (scenarios.length > 0) {
            // If active scenario was deleted, default to base
            setActiveScenarioId('base');
        }
    }, [activeScenarioId, activeScenario, scenarios]);

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
            updateItem(activeScenarioId, editingItem.id, itemData);
        } else {
            addItem(activeScenarioId, itemData);
        }
    };

    const handleDeleteItem = () => {
        if (editingItem) {
            removeItem(activeScenarioId, editingItem.id);
            setIsModalOpen(false);
        }
    };

    const handleRestoreItem = () => {
        if (editingItem && activeScenarioId !== 'base') {
            restoreItem(activeScenarioId, editingItem.id);
            setIsModalOpen(false);
        }
    };

    const handleCreateScenario = () => {
        const name = `皮算用プラン ${scenarios.length}`; // Simple naming
        addScenario(name);
        // We need to wait for state to update to switch to it, but standard flow is robust enough
        // Ideally we'd get the ID back but for now user can click it
    };

    const handleDeleteScenario = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeScenarioId === 'base') return;

        // Use a small timeout to ensure UI is responsive before blocking properly? 
        // Or just standard confirm.
        if (window.confirm(`「${activeScenario?.name}」を削除してもよろしいですか？`)) {
            // Calculate next safe ID before removing
            const index = scenarios.findIndex(s => s.id === activeScenarioId);
            const nextId = 'base'; // Default fallback

            removeScenario(activeScenarioId);
            setActiveScenarioId(nextId);
        }
    };

    const handleNameSave = () => {
        if (tempName.trim()) {
            updateScenarioName(activeScenarioId, tempName);
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
            reorderItems(activeScenarioId, newOrder);
        }
    };

    const dashboardItems = useMemo(() => {
        let items = getDashboardItems(activeScenarioId);
        if (isTanukiFilterOn && activeScenarioId !== 'base') {
            items = items.filter(i => i.status !== 'base');
        }
        return items;
    }, [activeScenarioId, scenarios, isTanukiFilterOn, getDashboardItems]);

    // Drag to Scroll Logic
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };


    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3 mb-2">
                <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-700">
                    <p className="font-bold mb-1">皮算用（プラン）の作成</p>
                    <p>ここで家計のプランを作成・編集します。</p>
                </div>
            </div>

            {/* Scenario Tabs (Dynamic List) with Drag Scroll */}
            <div
                ref={scrollRef}
                className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {scenarios.map((scenario) => {
                    const isActive = activeScenarioId === scenario.id;
                    return (
                        <button
                            key={scenario.id}
                            onClick={() => !isDragging && setActiveScenarioId(scenario.id)} // Prevent click when dragging
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 ${isActive
                                ? 'bg-white text-primary border-b-2 border-primary'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                        >
                            {scenario.name}
                        </button>
                    );
                })}
                <button
                    onClick={handleCreateScenario}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-t-lg transition-colors flex-shrink-0"
                >
                    <Plus size={16} />
                    <span>新規プラン</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="">
                {activeScenario ? (
                    <>
                        <div className="flex justify-between items-center mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 backdrop-blur-sm">
                            <div className="flex items-center space-x-2">
                                {isEditingName ? (
                                    <div className="flex items-center space-x-1">
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-40"
                                            autoFocus
                                        />
                                        <button onClick={handleNameSave} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                            <Check size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-gray-800 text-lg max-w-[150px] truncate">{activeScenario.name}</h3>
                                        {activeScenarioId !== 'base' && (
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
                                {activeScenarioId !== 'base' && (
                                    <>
                                        <button
                                            onClick={handleDeleteScenario}
                                            className="text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors mr-1"
                                            title="プランを削除"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => setIsTanukiFilterOn(!isTanukiFilterOn)}
                                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isTanukiFilterOn
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-gray-100 text-gray-500 border border-transparent'
                                                }`}
                                        >
                                            <Leaf size={12} />
                                            <span>皮算用のみ</span>
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleAddItem}
                                    className="bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
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
                                <div className="space-y-2 pb-20">
                                    {dashboardItems.map((data) => (
                                        <SortableItem
                                            key={data.item.id}
                                            {...data}
                                            onEdit={handleEditItem}
                                        />
                                    ))}
                                    {dashboardItems.length === 0 && (
                                        <div className="text-center text-gray-400 py-10 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            {isTanukiFilterOn ? '皮算用（変更・追加）項目はありません。' : '項目がありません。\n「＋」ボタンから追加してください。'}
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </>
                ) : (
                    <div className="text-center text-gray-400 py-12 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6">
                        <p className="mb-2">プランが見つかりません。</p>
                    </div>
                )}
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
        </div>
    );
};
