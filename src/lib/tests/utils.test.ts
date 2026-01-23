import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from '@/lib/utils';

describe('utils', () => {
    describe('cn', () => {
        it('merges class names correctly', () => {
            expect(cn('c1', 'c2')).toBe('c1 c2');
        });
        it('handles conditional classes', () => {
            expect(cn('c1', true && 'c2', false && 'c3')).toBe('c1 c2');
        });
        it('merges tailwind classes', () => {
            expect(cn('p-4 p-2')).toBe('p-2');
        });
    });

    describe('formatCurrency', () => {
        it('formats USD by default', () => {
            // narrowSymbol for USD is $
            // Verify basic formatting without worrying about non-breaking spaces vs spaces
            const result = formatCurrency(1000);
            expect(result).toMatch(/\$1,000(\.00)?/);
        });
        it('formats custom currency', () => {
            expect(formatCurrency(1000, 'EUR')).toContain('1,000');
        });
    });
});
