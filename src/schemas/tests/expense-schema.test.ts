import { describe, it, expect } from 'vitest';
import { expenseSchema } from '../expense-schema';

describe('expenseSchema', () => {
    it('validates a correct expense', () => {
        const valid = {
            description: 'Test',
            amount: 10,
            date: new Date(),
            category: 'Food'
        };
        expect(expenseSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects empty description', () => {
        const invalid = {
            description: '',
            amount: 10,
            date: new Date(),
            category: 'Food'
        };
        const result = expenseSchema.safeParse(invalid);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Description is required');
        }
    });

    it('rejects negative amount', () => {
        const invalid = {
            description: 'Test',
            amount: -10,
            date: new Date(),
            category: 'Food'
        };
        expect(expenseSchema.safeParse(invalid).success).toBe(false);
    });
});
