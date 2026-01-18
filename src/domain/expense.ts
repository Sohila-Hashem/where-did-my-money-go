export type ExpenseCategory = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Health' | 'Other';

export interface Expense {
    id: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    description: string;
}

export enum ExpenseCategoryEnum {
    Food = 'Food',
    Transport = 'Transport',
    Utilities = 'Utilities',
    Entertainment = 'Entertainment',
    Health = 'Health',
    Other = 'Other',
}