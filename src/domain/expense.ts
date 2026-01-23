export const CATEGORIES = [
    { category: 'Food' },
    { category: 'Transport' },
    { category: 'Utilities' },
    { category: 'Entertainment' },
    { category: 'Health' },
    { category: 'Wearables' },
    { category: 'Travel' },
    { category: 'Subscriptions' },
    { category: 'Self Care' },
    { category: 'Gifts' },
    { category: 'Medical' },
    { category: 'Education' },
    { category: 'Installments' },
    { category: 'Debt Payment' },
    { category: 'Withdrawals' },
    { category: 'Bills' },
    { category: 'Donations' },
    { category: 'Bank Fees' },
    { category: 'Fees' },
    { category: 'Investments' },
    { category: 'Savings' },
    { category: 'Loans' },
    { category: 'Taxes' },
    { category: 'Insurance' },
    { category: 'Transfers' },
    { category: 'Other' },
] as const

export type ExpenseCategories = (typeof CATEGORIES)[number]['category'];

export interface Expense {
    id: string;
    amount: number;
    date: string;
    category: ExpenseCategories;
    description: string;
}