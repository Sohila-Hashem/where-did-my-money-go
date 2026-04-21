import { describe, it, expect } from 'vitest';
import { validateImportedExpenses, mapToExpense, mergeExpenses } from '../expense-csv';
import { type Expense } from '../expense';

describe('Expense CSV Domain Logic', () => {
    describe('mapToExpense', () => {
        it('should pick only defined fields and ignore others', () => {
            const raw = {
                amount: 100,
                date: '2023-01-01',
                category: 'Food',
                description: 'Pizza',
                extraField: 'should be ignored',
                nested: { obj: 1 }
            };

            const mapped = mapToExpense(raw);
            expect(mapped).toHaveProperty('amount', 100);
            expect(mapped).toHaveProperty('date', '2023-01-01');
            expect(mapped).toHaveProperty('category', 'Food');
            expect(mapped).toHaveProperty('description', 'Pizza');
            expect(mapped).not.toHaveProperty('extraField');
            expect(mapped).not.toHaveProperty('nested');
            expect(mapped).toHaveProperty('id'); // Should generate a uuid if missing
        });

        it('should handle string amounts', () => {
            const raw = { amount: '123.45', date: '2023-01-01', category: 'Food', description: 'Test' };
            const mapped = mapToExpense(raw);
            expect(mapped.amount).toBe(123.45);
        });
    });

    describe('validateImportedExpenses', () => {
        it('should return valid expenses for correct data', () => {
            const data = [
                { amount: 50, date: '2023-05-01', category: 'Transport', description: 'Train' },
                { amount: 20, date: '2023-05-02', category: 'Food', description: 'Coffee' }
            ];

            const { valid, errors } = validateImportedExpenses(data);
            expect(valid).toHaveLength(2);
            expect(errors).toHaveLength(0);
            expect(valid[0].amount).toBe(50);
            expect(valid[0].category).toBe('Transport');
        });

        it('should collect errors for invalid data', () => {
            const data = [
                { amount: -10, date: 'invalid-date', category: '', description: '' }, // All invalid
                { amount: 100, date: '2023-01-01', category: 'Food', description: 'Valid' }
            ];

            const { valid, errors } = validateImportedExpenses(data);
            expect(valid).toHaveLength(1);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('Row 2');
            expect(errors[0]).toContain('amount:');
            expect(errors[0]).toContain('date:');
        });
    });

    describe('mergeExpenses', () => {
        it('should merge and overwrite duplicates by ID', () => {
            const current: Expense[] = [
                { id: '1', amount: 10, date: '2023-01-01', category: 'Food', description: 'Old' },
                { id: '2', amount: 20, date: '2023-01-01', category: 'Transport', description: 'Keep' }
            ];
            const imported: Expense[] = [
                { id: '1', amount: 15, date: '2023-01-01', category: 'Food', description: 'New' },
                { id: '3', amount: 30, date: '2023-01-01', category: 'Bills', description: 'Fresh' }
            ];

            const merged = mergeExpenses(current, imported);
            expect(merged).toHaveLength(3);
            const item1 = merged.find(e => e.id === '1');
            expect(item1?.amount).toBe(15);
            expect(item1?.description).toBe('New');
        });
    });
});
