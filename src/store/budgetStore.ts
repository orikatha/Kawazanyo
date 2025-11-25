import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { BaseScenario, SimScenario, BudgetItem } from '../types/budget';

interface BudgetState {
    // Index 0 is Base. Index 1 and 2 are Sim.
    scenarios: [BaseScenario, SimScenario | null, SimScenario | null];
    comparisonSpan: number;

    setComparisonSpan: (span: number) => void;

    // Scenario Actions
    addScenario: (index: 1 | 2, name: string) => void;
    removeScenario: (index: 1 | 2) => void;
    updateScenarioName: (index: 0 | 1 | 2, name: string) => void;

    // Item Actions
    addItem: (scenarioIndex: 0 | 1 | 2, item: Omit<BudgetItem, 'id'>) => void;
    removeItem: (scenarioIndex: 0 | 1 | 2, itemId: string) => void;
    restoreItem: (scenarioIndex: 1 | 2, itemId: string) => void;
    updateItem: (scenarioIndex: 0 | 1 | 2, itemId: string, updates: Partial<BudgetItem>) => void;
    reorderItems: (scenarioIndex: 0 | 1 | 2, newOrderIds: string[]) => void;

    // Monetization & Data Management
    isPro: boolean;
    setPro: (isPro: boolean) => void;
    importData: (data: BudgetState) => void;

    // Selectors
    getMergedItems: (index: 0 | 1 | 2) => BudgetItem[];
    getDashboardItems: (index: 0 | 1 | 2) => { item: BudgetItem; status: 'base' | 'modified' | 'added' | 'deleted'; original?: BudgetItem }[];
}

const initialBase: BaseScenario = {
    id: 'base',
    name: '現在の家計',
    items: [
        { id: '1', name: '給与', amount: 300000, type: 'income', category: '給与', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '2', name: '家賃', amount: 80000, type: 'expense', category: '住宅費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '3', name: '水道代', amount: 4000, type: 'expense', category: '水道光熱費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '4', name: '電気代', amount: 8000, type: 'expense', category: '水道光熱費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '5', name: 'ガス代', amount: 5000, type: 'expense', category: '水道光熱費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '6', name: '通信費', amount: 10000, type: 'expense', category: '通信費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '7', name: '食費', amount: 40000, type: 'expense', category: '食費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '8', name: '日用品費', amount: 10000, type: 'expense', category: '日用品費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '9', name: '医療費', amount: 5000, type: 'expense', category: '医療費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '10', name: '被服費', amount: 10000, type: 'expense', category: '被服費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '11', name: '交際費', amount: 15000, type: 'expense', category: '交際費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '12', name: '雑費', amount: 5000, type: 'expense', category: '雑費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '13', name: '交通費', amount: 10000, type: 'expense', category: '交通費', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
        { id: '14', name: '小遣い', amount: 30000, type: 'expense', category: '小遣い', frequencyType: 'monthly', interval: 1, startMonth: 1, endMonth: null },
    ],
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
    scenarios: [initialBase, null, null],
    comparisonSpan: 24,

    setComparisonSpan: (span) => set({ comparisonSpan: span }),

    addScenario: (index, name) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];
            newScenarios[index] = {
                id: `sim-${index}-${Date.now()}`,
                name: name,
                overrides: [],
                deletedItemIds: [],
            };
            return { scenarios: newScenarios };
        }),

    removeScenario: (index) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];
            newScenarios[index] = null;
            return { scenarios: newScenarios };
        }),

    updateScenarioName: (index, name) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];
            const target = newScenarios[index];
            if (target) {
                // We need to cast or construct a new object carefully to satisfy the union type
                if (index === 0) {
                    newScenarios[0] = { ...(target as BaseScenario), name };
                } else {
                    newScenarios[index] = { ...(target as SimScenario), name };
                }
            }
            return { scenarios: newScenarios };
        }),

    addItem: (scenarioIndex, item) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];
            const newItem = { ...item, id: uuidv4() };

            if (scenarioIndex === 0) {
                // Base: Add to items
                const base = newScenarios[0];
                newScenarios[0] = { ...base, items: [...base.items, newItem] };
            } else {
                // Sim: Add to overrides
                const sim = newScenarios[scenarioIndex];
                if (sim) {
                    newScenarios[scenarioIndex] = { ...sim, overrides: [...sim.overrides, newItem] };
                }
            }
            return { scenarios: newScenarios };
        }),

    removeItem: (scenarioIndex, itemId) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];

            if (scenarioIndex === 0) {
                // Base: Remove from items
                const base = newScenarios[0];
                newScenarios[0] = { ...base, items: base.items.filter(i => i.id !== itemId) };
            } else {
                // Sim: Add to deletedItemIds (if exists in Base) OR remove from overrides (if added in Sim)
                const sim = newScenarios[scenarioIndex];
                if (sim) {
                    const isOverride = sim.overrides.some(i => i.id === itemId);
                    if (isOverride) {
                        // It was added/modified in Sim
                        const baseItem = state.scenarios[0].items.find(i => i.id === itemId);
                        const newOverrides = sim.overrides.filter(i => i.id !== itemId);

                        let newDeleted = sim.deletedItemIds;
                        // If it was a modified Base item, we also need to add to deletedItemIds to actually delete it
                        if (baseItem) {
                            newDeleted = [...sim.deletedItemIds, itemId];
                        }

                        newScenarios[scenarioIndex] = {
                            ...sim,
                            overrides: newOverrides,
                            deletedItemIds: newDeleted
                        };
                    } else {
                        // It's a pure Base item (not in overrides), so just add to deletedItemIds
                        newScenarios[scenarioIndex] = {
                            ...sim,
                            deletedItemIds: [...sim.deletedItemIds, itemId]
                        };
                    }
                }
            }
            return { scenarios: newScenarios };
        }),

    restoreItem: (scenarioIndex, itemId) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];
            const sim = newScenarios[scenarioIndex];
            if (sim) {
                newScenarios[scenarioIndex] = {
                    ...sim,
                    deletedItemIds: sim.deletedItemIds.filter(id => id !== itemId)
                };
            }
            return { scenarios: newScenarios };
        }),

    updateItem: (scenarioIndex, itemId, updates) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];

            if (scenarioIndex === 0) {
                // Base: Update items
                const base = newScenarios[0];
                newScenarios[0] = {
                    ...base,
                    items: base.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
                };
            } else {
                // Sim: Update overrides
                const sim = newScenarios[scenarioIndex];
                if (sim) {
                    const existingOverride = sim.overrides.find(i => i.id === itemId);
                    if (existingOverride) {
                        // Already overridden, update the override
                        newScenarios[scenarioIndex] = {
                            ...sim,
                            overrides: sim.overrides.map(i => i.id === itemId ? { ...i, ...updates } : i)
                        };
                    } else {
                        // Not overridden yet (it's a Base item), create override
                        const baseItem = state.scenarios[0].items.find(i => i.id === itemId);
                        if (baseItem) {
                            const newItem = { ...baseItem, ...updates };
                            newScenarios[scenarioIndex] = {
                                ...sim,
                                overrides: [...sim.overrides, newItem]
                            };
                        }
                    }
                }
            }
            return { scenarios: newScenarios };
        }),

    reorderItems: (scenarioIndex, newOrderIds) =>
        set((state) => {
            const newScenarios = [...state.scenarios] as [BaseScenario, SimScenario | null, SimScenario | null];

            if (scenarioIndex === 0) {
                const base = newScenarios[0];
                const itemMap = new Map(base.items.map(i => [i.id, i]));
                const newItems = newOrderIds.map(id => itemMap.get(id)).filter((i): i is BudgetItem => !!i);
                const missedItems = base.items.filter(i => !newOrderIds.includes(i.id));
                newScenarios[0] = { ...base, items: [...newItems, ...missedItems] };
            } else {
                const sim = newScenarios[scenarioIndex];
                if (sim) {
                    newScenarios[scenarioIndex] = { ...sim, itemOrder: newOrderIds };
                }
            }
            return { scenarios: newScenarios };
        }),

    // Monetization & Data Management
    isPro: false,
    setPro: (isPro) => set({ isPro }),
    importData: (data) => set(data),

    getMergedItems: (index) => {
        const state = get();
        const base = state.scenarios[0];
        if (index === 0) return base.items;

        const sim = state.scenarios[index];
        if (!sim) return [];

        // 1. Start with Base items that are NOT deleted
        const activeBaseItems = base.items.filter(i => !sim.deletedItemIds.includes(i.id));

        // 2. Map to overrides if they exist
        const mergedBaseItems = activeBaseItems.map(i => {
            const override = sim.overrides.find(o => o.id === i.id);
            return override || i;
        });

        // 3. Add new items (overrides that don't exist in Base)
        const newItems = sim.overrides.filter(o => !base.items.some(b => b.id === o.id));

        const allItems = [...mergedBaseItems, ...newItems];

        // 4. Apply Custom Order if exists
        if (sim.itemOrder && sim.itemOrder.length > 0) {
            const itemMap = new Map(allItems.map(i => [i.id, i]));
            const orderedItems = sim.itemOrder.map(id => itemMap.get(id)).filter((i): i is BudgetItem => !!i);

            // Append any items not in the order list (e.g. newly added ones)
            const remainingItems = allItems.filter(i => !sim.itemOrder!.includes(i.id));

            return [...orderedItems, ...remainingItems];
        }

        return allItems;
    },

    getDashboardItems: (index) => {
        const state = get();
        const base = state.scenarios[0];
        if (index === 0) {
            return base.items.map(i => ({ item: i, status: 'base' as const }));
        }

        const sim = state.scenarios[index];
        if (!sim) return [];

        const result: { item: BudgetItem; status: 'base' | 'modified' | 'added' | 'deleted'; original?: BudgetItem }[] = [];

        // 1. Process Base Items
        base.items.forEach(baseItem => {
            const isDeleted = sim.deletedItemIds.includes(baseItem.id);
            const override = sim.overrides.find(o => o.id === baseItem.id);

            if (isDeleted) {
                result.push({ item: baseItem, status: 'deleted' });
            } else if (override) {
                result.push({ item: override, status: 'modified', original: baseItem });
            } else {
                result.push({ item: baseItem, status: 'base' });
            }
        });

        // 2. Process Added Items (Overrides not in Base)
        sim.overrides.forEach(override => {
            if (!base.items.some(b => b.id === override.id)) {
                result.push({ item: override, status: 'added' });
            }
        });

        // 3. Apply Custom Order if exists
        if (sim.itemOrder && sim.itemOrder.length > 0) {
            const resultMap = new Map(result.map(r => [r.item.id, r]));
            const orderedResult = sim.itemOrder.map(id => resultMap.get(id)).filter((r): r is typeof result[0] => !!r);

            // Append remaining
            const remainingResult = result.filter(r => !sim.itemOrder!.includes(r.item.id));

            return [...orderedResult, ...remainingResult];
        }

        return result;
    }
}));
