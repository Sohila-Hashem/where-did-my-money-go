import type { Expense } from "@/domain/expense";

const EXPENSES_KEY = 'expenses';

export const saveExpense = (expense: Expense) => {
    const expenses = loadExpenses();
    localStorage.setItem(EXPENSES_KEY, JSON.stringify([...expenses, expense]));
}

export const loadExpenses = () => {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
}

export const deleteExpense = (id: string) => {
    const expenses = loadExpenses();
    const updatedExpenses = expenses.filter((expense: Expense) => expense.id !== id);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(updatedExpenses));
}