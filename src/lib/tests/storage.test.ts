import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    saveExpenses,
    loadExpenses,
    insertExpense,
    deleteExpense,
    updateExpense,
    saveCustomCategories,
    loadCustomCategories,
    loadCurrency,
    saveCurrency,
    mergeExpensesWithExisting,
    mergeCustomCategoriesWithExisting,
} from '@/lib/storage';
import type { Expense } from '@/domain/expense';

// ─── localStorage mock ────────────────────────────────────────────────────────

const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem');

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockExpenses: Expense[] = [
    { id: '1', description: 'Groceries', amount: 50, date: '2026-03-01', category: 'Food' },
    { id: '2', description: 'Bus pass', amount: 20, date: '2026-03-02', category: 'Transport' },
];

// ─── saveExpenses ─────────────────────────────────────────────────────────────

describe('saveExpenses', () => {
    it('serializes and stores expenses under the correct key', () => {
        saveExpenses(mockExpenses);
        expect(mockSetItem).toHaveBeenCalledWith('expenses', JSON.stringify(mockExpenses));
    });

    it('stores an empty array when called with no items', () => {
        saveExpenses([]);
        expect(mockSetItem).toHaveBeenCalledWith('expenses', '[]');
    });
});

// ─── loadExpenses ─────────────────────────────────────────────────────────────

describe('loadExpenses', () => {
    it('parses and returns the stored expenses', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const result = loadExpenses();
        expect(mockGetItem).toHaveBeenCalledWith('expenses');
        expect(result).toEqual(mockExpenses);
    });

    it('returns an empty array when nothing is stored', () => {
        mockGetItem.mockReturnValue(null);
        expect(loadExpenses()).toEqual([]);
    });

    it('filters by month when the month option is provided', () => {
        const expenses: Expense[] = [
            { id: '1', description: 'March', amount: 10, date: '2026-03-15', category: 'Food' },
            { id: '2', description: 'April', amount: 20, date: '2026-04-10', category: 'Food' },
        ];
        mockGetItem.mockReturnValue(JSON.stringify(expenses));
        const result = loadExpenses({ month: '2026-03' });
        expect(result).toHaveLength(1);
        expect((result as Expense[])[0].id).toBe('1');
    });

    it('filters by category when the category option is provided', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const result = loadExpenses({ category: 'Food' });
        expect(result).toHaveLength(1);
        expect((result as Expense[])[0].id).toBe('1');
    });

    it('applies both month and category filters together', () => {
        const expenses: Expense[] = [
            { id: '1', description: 'March Food', amount: 10, date: '2026-03-15', category: 'Food' },
            { id: '2', description: 'March Transport', amount: 20, date: '2026-03-10', category: 'Transport' },
            { id: '3', description: 'April Food', amount: 30, date: '2026-04-01', category: 'Food' },
        ];
        mockGetItem.mockReturnValue(JSON.stringify(expenses));
        const result = loadExpenses({ month: '2026-03', category: 'Food' });
        expect(result).toHaveLength(1);
        expect((result as Expense[])[0].id).toBe('1');
    });

    it('treats "all" month value as no month filter', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const result = loadExpenses({ month: 'all' });
        expect(result).toHaveLength(mockExpenses.length);
    });

    it('treats "all" category value as no category filter', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const result = loadExpenses({ category: 'all' });
        expect(result).toHaveLength(mockExpenses.length);
    });

    describe('cursor-based pagination (with limit)', () => {
        const pagedExpenses: Expense[] = [
            { id: '1', description: 'A', amount: 10, date: '2026-03-05', category: 'Food' },
            { id: '2', description: 'B', amount: 20, date: '2026-03-04', category: 'Food' },
            { id: '3', description: 'C', amount: 30, date: '2026-03-03', category: 'Food' },
            { id: '4', description: 'D', amount: 40, date: '2026-03-02', category: 'Food' },
            { id: '5', description: 'E', amount: 50, date: '2026-03-01', category: 'Food' },
        ];

        it('returns a PaginationResult with the first page when cursorId is null', () => {
            mockGetItem.mockReturnValue(JSON.stringify(pagedExpenses));
            const result = loadExpenses({ cursorId: null, limit: 3 });
            expect(result).toHaveProperty('data');
            expect(result.data).toHaveLength(3);
            expect(result.data[0].id).toBe('1');
            expect(result.hasNextPage).toBe(true);
            expect(result.nextCursor).toBe('3');
            expect(result.totalCount).toBe(5);
            expect(result.totalAmount).toBe(150); // 10+20+30+40+50
        });

        it('returns the next page when a valid cursorId is given', () => {
            mockGetItem.mockReturnValue(JSON.stringify(pagedExpenses));
            const result = loadExpenses({ cursorId: '3', limit: 3 });
            expect(result.data).toHaveLength(2);
            expect(result.data[0].id).toBe('4');
            expect(result.hasNextPage).toBe(false);
            expect(result.totalCount).toBe(5);
            expect(result.totalAmount).toBe(150);
        });

        it('returns sorted data by date descending', () => {
            const unsorted: Expense[] = [
                { id: 'a', description: 'Old', amount: 1, date: '2026-01-01', category: 'Food' },
                { id: 'b', description: 'New', amount: 2, date: '2026-12-31', category: 'Food' },
            ];
            mockGetItem.mockReturnValue(JSON.stringify(unsorted));
            const result = loadExpenses({ cursorId: null, limit: 10 });
            expect(result.data[0].id).toBe('b');
            expect(result.data[1].id).toBe('a');
        });

        it('applies filters before paginating', () => {
            const mixed: Expense[] = [
                { id: '1', description: 'Food 1', amount: 10, date: '2026-03-05', category: 'Food' },
                { id: '2', description: 'Transport 1', amount: 20, date: '2026-03-04', category: 'Transport' },
                { id: '3', description: 'Food 2', amount: 30, date: '2026-03-03', category: 'Food' },
            ];
            mockGetItem.mockReturnValue(JSON.stringify(mixed));
            const result = loadExpenses({ category: 'Food', cursorId: null, limit: 10 });
            expect(result.data).toHaveLength(2);
            expect(result.data.every(e => e.category === 'Food')).toBe(true);
        });
    });
});

// ─── insertExpense ────────────────────────────────────────────────────────────

describe('insertExpense', () => {
    it('appends the expense to existing ones, saves, and returns the updated list', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const newExpense: Expense = { id: '3', description: 'New', amount: 30, date: '2026-01-01', category: 'Food' };

        const result = insertExpense(newExpense);

        expect(result).toHaveLength(3);
        expect(result[2]).toEqual(newExpense);
        expect(mockSetItem).toHaveBeenCalledWith('expenses', JSON.stringify([...mockExpenses, newExpense]));
    });

    it('inserts into an empty list when storage is empty', () => {
        mockGetItem.mockReturnValue(null);
        const newExpense: Expense = { id: '1', description: 'First', amount: 10, date: '2026-01-01', category: 'Food' };

        const result = insertExpense(newExpense);

        expect(result).toEqual([newExpense]);
    });
});

// ─── deleteExpense ────────────────────────────────────────────────────────────

describe('deleteExpense', () => {
    it('removes the expense with the matching id, saves, and returns the updated list', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));

        const result = deleteExpense('1');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
        expect(mockSetItem).toHaveBeenCalled();
    });

    it('returns the list unchanged when id is not found', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));

        const result = deleteExpense('999');

        expect(result).toHaveLength(2);
    });

    it('returns an empty array when deleting the only expense', () => {
        mockGetItem.mockReturnValue(JSON.stringify([mockExpenses[0]]));

        const result = deleteExpense('1');

        expect(result).toEqual([]);
    });
});

// ─── updateExpense ────────────────────────────────────────────────────────────

describe('updateExpense', () => {
    it('replaces the expense with matching id, saves, and returns the updated list', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const updated: Expense = { ...mockExpenses[0], amount: 999, description: 'Updated' };

        const result = updateExpense(updated);

        expect(result[0]).toEqual(updated);
        expect(result[1]).toEqual(mockExpenses[1]);
        expect(mockSetItem).toHaveBeenCalled();
    });

    it('leaves other expenses untouched', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const updated: Expense = { ...mockExpenses[0], amount: 1 };

        const result = updateExpense(updated);

        expect(result[1]).toEqual(mockExpenses[1]);
    });

    it('returns list unchanged when id is not found', () => {
        mockGetItem.mockReturnValue(JSON.stringify(mockExpenses));
        const ghost: Expense = { id: '999', description: 'Ghost', amount: 0, date: '2026-01-01', category: 'Other' };

        const result = updateExpense(ghost);

        expect(result).toEqual(mockExpenses);
    });
});

// ─── saveCurrency ─────────────────────────────────────────────────────────────

describe('saveCurrency', () => {
    it('serializes and stores the currency under the correct key', () => {
        saveCurrency({ code: 'USD', symbol: '$', name: 'US Dollar' });
        expect(mockSetItem).toHaveBeenCalledWith(
            'currency',
            JSON.stringify({ code: 'USD', symbol: '$', name: 'US Dollar' })
        );
    });
});

// ─── loadCurrency ─────────────────────────────────────────────────────────────

describe('loadCurrency', () => {
    it('parses and returns the stored currency', () => {
        const currency = { code: 'EUR', symbol: '€', name: 'Euro' };
        mockGetItem.mockReturnValue(JSON.stringify(currency));
        const result = loadCurrency();
        expect(mockGetItem).toHaveBeenCalledWith('currency');
        expect(result).toEqual(currency);
    });

    it('returns null when nothing is stored', () => {
        mockGetItem.mockReturnValue(null);
        expect(loadCurrency()).toBeNull();
    });
});

// ─── saveCustomCategories ─────────────────────────────────────────────────────

describe('saveCustomCategories', () => {
    it('serializes and stores the categories under the correct key', () => {
        saveCustomCategories(['Food', 'Travel']);
        expect(mockSetItem).toHaveBeenCalledWith('custom_categories', JSON.stringify(['Food', 'Travel']));
    });

    it('stores an empty array when called with no items', () => {
        saveCustomCategories([]);
        expect(mockSetItem).toHaveBeenCalledWith('custom_categories', '[]');
    });
});

// ─── loadCustomCategories ─────────────────────────────────────────────────────

describe('loadCustomCategories', () => {
    it('parses and returns stored categories', () => {
        mockGetItem.mockReturnValue(JSON.stringify(['Food', 'Travel']));
        const result = loadCustomCategories();
        expect(mockGetItem).toHaveBeenCalledWith('custom_categories');
        expect(result).toEqual(['Food', 'Travel']);
    });

    it('returns an empty array when nothing is stored', () => {
        mockGetItem.mockReturnValue(null);
        expect(loadCustomCategories()).toEqual([]);
    });

    it('removes the corrupted entry and returns empty array when JSON is invalid', () => {
        mockGetItem.mockReturnValue('NOT_VALID_JSON{{{');
        const result = loadCustomCategories();
        expect(result).toEqual([]);
        expect(mockRemoveItem).toHaveBeenCalledWith('custom_categories');
    });
});

// ─── mergeExpensesWithExisting ────────────────────────────────────────────────

describe('mergeExpensesWithExisting', () => {
    it('merges new expenses with existing ones and saves them', () => {
        const existing: Expense[] = [
            { id: '1', description: 'Old', amount: 10, date: '2026-01-01', category: 'Food' }
        ];
        const newExpenses: Expense[] = [
            { id: '1', description: 'Updated', amount: 15, date: '2026-01-01', category: 'Food' },
            { id: '2', description: 'New', amount: 20, date: '2026-01-02', category: 'Transport' }
        ];
        
        mockGetItem.mockReturnValue(JSON.stringify(existing));
        
        mergeExpensesWithExisting(newExpenses);
        
        expect(mockSetItem).toHaveBeenCalledWith('expenses', expect.stringContaining('"description":"Updated"'));
        expect(mockSetItem).toHaveBeenCalledWith('expenses', expect.stringContaining('"description":"New"'));
        const saved = JSON.parse(mockSetItem.mock.calls[0][1] as string);
        expect(saved).toHaveLength(2);
    });
});

// ─── mergeCustomCategoriesWithExisting ────────────────────────────────────────

describe('mergeCustomCategoriesWithExisting', () => {
    it('merges unique custom categories and saves them', () => {
        const existing = ['Food', 'Travel'];
        const newCategories = ['Travel', 'Entertainment', 'Health'];
        
        mockGetItem.mockReturnValue(JSON.stringify(existing));
        
        mergeCustomCategoriesWithExisting(newCategories);
        
        const saved = JSON.parse(mockSetItem.mock.calls[0][1] as string);
        expect(saved).toHaveLength(4); // Food, Travel, Entertainment, Health
        expect(saved).toContain('Food');
        expect(saved).toContain('Travel');
        expect(saved).toContain('Entertainment');
        expect(saved).toContain('Health');
    });
});
