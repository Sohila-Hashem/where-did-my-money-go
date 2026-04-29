import type { CustomCategory } from "@/domain/custom-categories";
import { getTotalAmount, type Expense } from "@/domain/expense";
import { compareDesc, format, parseISO } from "date-fns";
import type { Currency } from "@/lib/constants";

export const EXPENSES_PAGE_SIZE = 15;

export interface PaginationResult {
    data: Expense[];
    nextCursor: string | null;
    previousCursor: string | null;
    hasNextPage: boolean;
    totalAmount: number;
    totalCount: number;
}

export const STORAGE_KEYS = Object.freeze({
    EXPENSES: "expenses",
    CURRENCY: "currency",
    CUSTOM_CATEGORIES: "custom_categories",
});

export interface ExpensesQueryOptions {
    month?: string;
    category?: string;
    cursorId?: string | null;
    limit?: number;
}

export const saveExpenses = (expenses: Expense[]) => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export const loadRawExpenses = (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.EXPENSES);
}

export const saveRawExpenses = (rawJson: string): void => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, rawJson);
}

export const mergeExpensesWithExisting = (newExpenses: Expense[]) => {
    const currentExpenses = loadExpenses();
    const updatedExpenses = newExpenses.reduce((acc, expense) => {
        const existingExpense = acc.find((e) => e.id === expense.id);
        if (existingExpense) {
            return acc.map((e) => (e.id === expense.id ? expense : e));
        }
        return [...acc, expense];
    }, currentExpenses);
    saveExpenses(updatedExpenses);
}

export function loadExpenses(): Expense[];
export function loadExpenses(options: Omit<ExpensesQueryOptions, 'cursorId' | 'limit'>): Expense[];
export function loadExpenses(options: ExpensesQueryOptions & { limit: number }): PaginationResult;
export function loadExpenses(options?: ExpensesQueryOptions): Expense[] | PaginationResult {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    let result: Expense[] = raw ? JSON.parse(raw) : [];

    const numberOfExpenses = result.length;
    console.log("🚀 ~ loadExpenses ~ numberOfExpenses:", numberOfExpenses)

    if (options?.month && options.month !== 'all') {
        const monthKey = format(parseISO(options.month + '-01'), 'yyyy-MM');
        result = result.filter(e => format(parseISO(e.date), 'yyyy-MM') === monthKey);
    }
    if (options?.category && options.category !== 'all') {
        result = result.filter(e => e.category === options.category);
    }

    if (options?.limit !== undefined) {
        const pageSize = options.limit;
        const sorted = [...result].sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

        const cursor = options.cursorId ?? null;
        let startIndex = 0;
        if (cursor !== null) {
            const cursorIndex = sorted.findIndex((e) => e.id === cursor);
            startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
        }

        const pageData = sorted.slice(startIndex, startIndex + pageSize);
        const hasNextPage = startIndex + pageSize < sorted.length;
        const nextCursor = pageData.length > 0 ? pageData[pageData.length - 1].id : null;

        return {
            data: pageData,
            nextCursor,
            previousCursor: cursor,
            hasNextPage,
            totalAmount: getTotalAmount(result),
            totalCount: numberOfExpenses,
        };
    }

    return result;
}

export const insertExpense = (expense: Expense): Expense[] => {
    const current = loadExpenses();
    const updated = [...current, expense];
    saveExpenses(updated);
    return updated;
}

export const deleteExpense = (id: string): Expense[] => {
    const current = loadExpenses();
    const updated = current.filter((e: Expense) => e.id !== id);
    saveExpenses(updated);
    return updated;
}

export const updateExpense = (expense: Expense): Expense[] => {
    const current = loadExpenses();
    const updated = current.map((e: Expense) => (e.id === expense.id ? expense : e));
    saveExpenses(updated);
    return updated;
}

export const loadCurrency = (): Currency | null => {
    const currency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    return currency ? JSON.parse(currency) : null;
}

export const saveCurrency = (currency: Currency) => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, JSON.stringify(currency));
}

export const loadCustomCategories = (): CustomCategory[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (!data) {
        return [];
    }
    try {
        const parsed = JSON.parse(data);
        return parsed as CustomCategory[];
    } catch {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
        return []
    }
}

export const saveCustomCategories = (categories: CustomCategory[]) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
}

export const mergeCustomCategoriesWithExisting = (newCategories: CustomCategory[]) => {
    const currentCategories = loadCustomCategories();
    const updatedCustomCategories = new Set([...currentCategories, ...newCategories])
    saveCustomCategories(Array.from(updatedCustomCategories));
}