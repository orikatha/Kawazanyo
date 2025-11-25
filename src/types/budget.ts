export type ItemType = 'income' | 'expense';
export type FrequencyType = 'monthly' | 'yearly' | 'custom';

export interface BudgetItem {
    id: string;
    name: string;
    amount: number;
    type: ItemType;
    category: string;
    // Recurring Logic
    frequencyType: FrequencyType;
    interval: number; // 1 = monthly, 12 = yearly, n = custom
    startMonth: number; // 1-based index
    endMonth: number | null; // null = indefinite
}

export interface BaseScenario {
    id: string;
    name: string;
    items: BudgetItem[];
}

export interface SimScenario {
    id: string;
    name: string;
    overrides: BudgetItem[]; // Items modified or added in this simulation
    deletedItemIds: string[]; // IDs of items from Base that are "deleted" in this simulation
    itemOrder?: string[]; // Optional: Custom order of item IDs
}

export type Scenario = BaseScenario | SimScenario;

export interface MonthlyData {
    month: number;
    income: number;
    expense: number;
    balance: number;
    baseAsset: number; // Cumulative asset for Base
    simAsset: number; // Cumulative asset for Simulation
}
