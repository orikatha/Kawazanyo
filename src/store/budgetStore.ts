import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { BaseScenario, SimScenario, BudgetItem, Scenario } from '../types/budget';

interface BudgetState {
    // Scenarios: List. Index 0 is always Base.
    scenarios: Scenario[];
    comparisonSpan: number;

    setComparisonSpan: (span: number) => void;

    // Scenario Actions
    addScenario: (name: string) => void;
    removeScenario: (id: string) => void;
    updateScenarioName: (id: string, name: string) => void;

    // Item Actions
    addItem: (scenarioId: string, item: Omit<BudgetItem, 'id'>) => void;
    removeItem: (scenarioId: string, itemId: string) => void;
    restoreItem: (scenarioId: string, itemId: string) => void;
    updateItem: (scenarioId: string, itemId: string, updates: Partial<BudgetItem>) => void;
    reorderItems: (scenarioId: string, newOrderIds: string[]) => void;

    // Monetization & Data Management
    isPro: boolean;
    setPro: (isPro: boolean) => void;
    importData: (data: BudgetState) => void;

    // Selectors
    getMergedItems: (scenarioId: string) => BudgetItem[];
    getDashboardItems: (scenarioId: string) => { item: BudgetItem; status: 'base' | 'modified' | 'added' | 'deleted'; original?: BudgetItem }[];

    // Actuals
    monthlyActuals: Record<string, number>; // Key: "${scenarioId}-${itemId}-${month(YYYY-MM)}" -> amount
    setMonthlyActual: (scenarioId: string, itemId: string, month: string, amount: number) => void;
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
    scenarios: [initialBase],
    comparisonSpan: 24,

    setComparisonSpan: (span) => set({ comparisonSpan: span }),

    addScenario: (name) =>
        set((state) => {
            const newScenario: SimScenario = {
                id: `sim-${Date.now()}`,
                name: name,
                overrides: [],
                deletedItemIds: [],
            };
            return { scenarios: [...state.scenarios, newScenario] };
        }),

    removeScenario: (id) =>
        set((state) => {
            if (id === 'base') return {}; // Cannot remove base
            return { scenarios: state.scenarios.filter(s => s.id !== id) };
        }),

    updateScenarioName: (id, name) =>
        set((state) => {
            return {
                scenarios: state.scenarios.map(s => s.id === id ? { ...s, name } : s)
            };
        }),

    addItem: (scenarioId, item) =>
        set((state) => {
            const newItem = { ...item, id: uuidv4() };
            const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
            if (scenarioIndex === -1) return {};

            const scenario = state.scenarios[scenarioIndex];
            const newScenarios = [...state.scenarios];

            if (scenarioId === 'base') {
                const base = scenario as BaseScenario;
                newScenarios[scenarioIndex] = { ...base, items: [...base.items, newItem] };
            } else {
                const sim = scenario as SimScenario;
                newScenarios[scenarioIndex] = { ...sim, overrides: [...sim.overrides, newItem] };
            }
            return { scenarios: newScenarios };
        }),

    removeItem: (scenarioId, itemId) =>
        set((state) => {
            const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
            if (scenarioIndex === -1) return {};
            const scenario = state.scenarios[scenarioIndex];
            const newScenarios = [...state.scenarios];

            if (scenarioId === 'base') {
                const base = scenario as BaseScenario;
                newScenarios[scenarioIndex] = { ...base, items: base.items.filter(i => i.id !== itemId) };
            } else {
                const sim = scenario as SimScenario;
                const isOverride = sim.overrides.some(i => i.id === itemId);
                if (isOverride) {
                    const baseItem = (state.scenarios[0] as BaseScenario).items.find(i => i.id === itemId);
                    const newOverrides = sim.overrides.filter(i => i.id !== itemId);
                    let newDeleted = sim.deletedItemIds;
                    if (baseItem) {
                        newDeleted = [...sim.deletedItemIds, itemId];
                    }
                    newScenarios[scenarioIndex] = {
                        ...sim,
                        overrides: newOverrides,
                        deletedItemIds: newDeleted
                    };
                } else {
                    newScenarios[scenarioIndex] = {
                        ...sim,
                        deletedItemIds: [...sim.deletedItemIds, itemId]
                    };
                }
            }
            return { scenarios: newScenarios };
        }),

    restoreItem: (scenarioId, itemId) =>
        set((state) => {
            const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
            if (scenarioIndex === -1) return {};
            const sim = state.scenarios[scenarioIndex] as SimScenario;

            const newScenarios = [...state.scenarios];
            newScenarios[scenarioIndex] = {
                ...sim,
                deletedItemIds: sim.deletedItemIds.filter(id => id !== itemId)
            };
            return { scenarios: newScenarios };
        }),

    updateItem: (scenarioId, itemId, updates) =>
        set((state) => {
            const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
            if (scenarioIndex === -1) return {};
            const scenario = state.scenarios[scenarioIndex];
            const newScenarios = [...state.scenarios];

            if (scenarioId === 'base') {
                const base = scenario as BaseScenario;
                newScenarios[scenarioIndex] = {
                    ...base,
                    items: base.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
                };
            } else {
                const sim = scenario as SimScenario;
                const existingOverride = sim.overrides.find(i => i.id === itemId);
                if (existingOverride) {
                    newScenarios[scenarioIndex] = {
                        ...sim,
                        overrides: sim.overrides.map(i => i.id === itemId ? { ...i, ...updates } : i)
                    };
                } else {
                    const baseItem = (state.scenarios[0] as BaseScenario).items.find(i => i.id === itemId);
                    if (baseItem) {
                        const newItem = { ...baseItem, ...updates };
                        newScenarios[scenarioIndex] = {
                            ...sim,
                            overrides: [...sim.overrides, newItem]
                        };
                    }
                }
            }
            return { scenarios: newScenarios };
        }),

    reorderItems: (scenarioId, newOrderIds) =>
        set((state) => {
            const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
            if (scenarioIndex === -1) return {};
            const scenario = state.scenarios[scenarioIndex];
            const newScenarios = [...state.scenarios];

            if (scenarioId === 'base') {
                const base = scenario as BaseScenario;
                const itemMap = new Map(base.items.map(i => [i.id, i]));
                const newItems = newOrderIds.map(id => itemMap.get(id)).filter((i): i is BudgetItem => !!i);
                const missedItems = base.items.filter(i => !newOrderIds.includes(i.id));
                newScenarios[scenarioIndex] = { ...base, items: [...newItems, ...missedItems] };
            } else {
                const sim = scenario as SimScenario;
                newScenarios[scenarioIndex] = { ...sim, itemOrder: newOrderIds };
            }
            return { scenarios: newScenarios };
        }),

    isPro: false,
    setPro: (isPro) => set({ isPro }),
    importData: (data) => set(data),

    monthlyActuals: {},
    setMonthlyActual: (scenarioId, itemId, month, amount) =>
        set((state) => {
            const key = `${scenarioId}-${itemId}-${month}`;
            return {
                monthlyActuals: {
                    ...state.monthlyActuals,
                    [key]: amount
                }
            };
        }),

    getMergedItems: (scenarioId) => {
        const state = get();
        const base = state.scenarios[0] as BaseScenario;
        if (scenarioId === 'base') return base.items;

        const sim = state.scenarios.find(s => s.id === scenarioId) as SimScenario;
        if (!sim) return [];

        const activeBaseItems = base.items.filter(i => !sim.deletedItemIds.includes(i.id));
        const mergedBaseItems = activeBaseItems.map(i => {
            const override = sim.overrides.find(o => o.id === i.id);
            return override || i;
        });
        const newItems = sim.overrides.filter(o => !base.items.some(b => b.id === o.id));
        const allItems = [...mergedBaseItems, ...newItems];

        if (sim.itemOrder && sim.itemOrder.length > 0) {
            const itemMap = new Map(allItems.map(i => [i.id, i]));
            const orderedItems = sim.itemOrder.map(id => itemMap.get(id)).filter((i): i is BudgetItem => !!i);
            const remainingItems = allItems.filter(i => !sim.itemOrder!.includes(i.id));
            return [...orderedItems, ...remainingItems];
        }
        return allItems;
    },

    getDashboardItems: (scenarioId) => {
        const state = get();
        const base = state.scenarios[0] as BaseScenario;

        if (scenarioId === 'base') {
            return base.items.map(i => ({ item: i, status: 'base' as const }));
        }

        const sim = state.scenarios.find(s => s.id === scenarioId) as SimScenario;
        if (!sim) return [];

        const result: { item: BudgetItem; status: 'base' | 'modified' | 'added' | 'deleted'; original?: BudgetItem }[] = [];

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

        sim.overrides.forEach(override => {
            if (!base.items.some(b => b.id === override.id)) {
                result.push({ item: override, status: 'added' });
            }
        });

        if (sim.itemOrder && sim.itemOrder.length > 0) {
            const resultMap = new Map(result.map(r => [r.item.id, r]));
            const orderedResult = sim.itemOrder.map(id => resultMap.get(id)).filter((r): r is typeof result[0] => !!r);
            const remainingResult = result.filter(r => !sim.itemOrder!.includes(r.item.id));
            return [...orderedResult, ...remainingResult];
        }

        return result;
    }
}));
