import { describe, it, expect, beforeEach } from 'vitest';
import { saveExpenses, loadExpenses, deleteExpense, updateExpense } from '@/lib/storage';
import type { Expense } from '@/domain/expense';
import { format } from 'date-fns';

const mockExpenses: Expense[] = [
    { id: '1', description: 'Test 1', amount: 100, date: format(new Date(), 'yyyy-MM-dd'), category: 'Food' },
    { id: '2', description: 'Test 2', amount: 200, date: format(new Date(), 'yyyy-MM-dd'), category: 'Transport' }
];

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('saves and loads expenses', () => {
        // Need to serialize dates as localstorage stores strings, and JSON.parse won't auto-convert back to Date object without help
        // But loadExpenses implementation just does JSON.parse. 
        // Let's check how the app handles dates. The interface probably says Date | string or similar?
        // Actually the mockExpenses use Date objects above. JSON.stringify will convert to ISO string.
        // loadExpenses returns JSON.parse() result. So the date will be a string in the returned object.

        saveExpenses(mockExpenses);
        const loaded = loadExpenses();
        expect(loaded).toHaveLength(2);
        expect(loaded[0].description).toBe('Test 1');
        // Check loose equality or string matching for date
        expect(loaded[0].date).toBe(mockExpenses[0].date);
    });

    it('returns empty array if no expenses', () => {
        expect(loadExpenses()).toEqual([]);
    });

    it('deletes expense correctly', () => {
        const newExpenses = deleteExpense('1', mockExpenses);
        expect(newExpenses).toHaveLength(1);
        expect(newExpenses[0].id).toBe('2');
    });

    it('updates expense correctly', () => {
        const updated = { ...mockExpenses[0], amount: 150 };
        const newExpenses = updateExpense(updated, mockExpenses);
        expect(newExpenses[0].amount).toBe(150);
    });
});
