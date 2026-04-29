import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExpensesWorkerType, ImportMode } from '../expenses-csv.worker';
import type { Expense } from '@/domain/expense';

// Mock csv-utils before importing the worker
vi.mock('@/lib/csv-utils', () => ({
    fromCSV: vi.fn(),
    toCSV: vi.fn(),
}));

vi.mock('@/domain/expense', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/domain/expense')>();
    return {
        ...actual,
        validateImportedExpenses: vi.fn(),
        isPresetExpenseCategory: vi.fn(),
    };
});

import * as csvUtils from '@/lib/csv-utils';
import * as domain from '@/domain/expense';

// Importing the worker registers globalThis.onmessage
import '../expenses-csv.worker';

/** Dispatches a message to the worker and resolves with the first postMessage call. */
function dispatchWorkerMessage(type: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
        vi.stubGlobal('postMessage', (data: any) => {
            resolve(data);
        });
        (globalThis as any).onmessage({ data: { type, payload } });
    });
}

describe('csv.worker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('EXPORT_EXPENSES', () => {
        const rawExpenses: Expense[] = [
            {
                id: '1',
                description: 'Lunch',
                amount: 10,
                date: '2026-03-15T00:00:00.000Z',
                category: 'Food',
            },
            {
                id: '2',
                description: 'Bus',
                amount: 20,
                date: '2026-04-10T00:00:00.000Z',
                category: 'Transport',
            },
        ];
        const rawJson = JSON.stringify(rawExpenses);

        it('generates CSV from raw JSON with no filters', async () => {
            vi.mocked(csvUtils.toCSV).mockReturnValue('id,description\n1,Lunch');

            const result = await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson,
                filters: {},
            });

            expect(csvUtils.toCSV).toHaveBeenCalledWith(rawExpenses);
            expect(result).toEqual({ type: 'SUCCESS', payload: 'id,description\n1,Lunch' });
        });

        it('applies month filter', async () => {
            vi.mocked(csvUtils.toCSV).mockReturnValue('csv');

            await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson,
                filters: { month: '2026-03' },
            });

            expect(csvUtils.toCSV).toHaveBeenCalledWith([rawExpenses[0]]);
        });

        it('applies category filter', async () => {
            vi.mocked(csvUtils.toCSV).mockReturnValue('csv');

            await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson,
                filters: { category: 'Food' },
            });

            expect(csvUtils.toCSV).toHaveBeenCalledWith([rawExpenses[0]]);
        });

        it('applies month and category filters together', async () => {
            vi.mocked(csvUtils.toCSV).mockReturnValue('csv');

            await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson,
                filters: { month: '2026-04', category: 'Transport' },
            });

            expect(csvUtils.toCSV).toHaveBeenCalledWith([rawExpenses[1]]);
        });

        it('returns ERROR when no expenses match filters', async () => {
            const result = await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson,
                filters: { month: '2099-01' },
            });

            expect(result).toEqual({ type: 'ERROR', error: 'No expenses to export.' });
            expect(csvUtils.toCSV).not.toHaveBeenCalled();
        });

        it('returns ERROR when rawJson is null', async () => {
            const result = await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson: null,
                filters: {},
            });

            expect(result).toEqual({ type: 'ERROR', error: 'No expenses to export.' });
        });

        it('returns ERROR when rawJson is an empty array', async () => {
            const result = await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson: '[]',
                filters: {},
            });

            expect(result).toEqual({ type: 'ERROR', error: 'No expenses to export.' });
        });
    });

    describe('IMPORT_EXPENSES', () => {
        const mockValid: Expense[] = [
            {
                id: '1',
                description: 'New Expense',
                amount: 50,
                date: '2026-01-01T00:00:00.000Z',
                category: 'Food',
            },
        ];

        beforeEach(() => {
            vi.mocked(csvUtils.fromCSV).mockReturnValue([{ amount: 50 }]);
            vi.mocked(domain.validateImportedExpenses).mockReturnValue({
                valid: mockValid,
                errors: [],
            });
            vi.mocked(domain.isPresetExpenseCategory).mockReturnValue(true);
        });

        it('imports in OVERWRITE mode', async () => {
            const existing = [{ id: '99', description: 'Old', amount: 100, date: '2026-01-01', category: 'Bills' }];

            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'csv content',
                existingRawJson: JSON.stringify(existing),
                mode: ImportMode.OVERWRITE,
                addMissingCategories: false,
            });

            expect(result.type).toBe('SUCCESS');
            expect(JSON.parse(result.payload.mergedRawJson)).toEqual(mockValid);
            expect(result.payload.count).toBe(1);
            expect(result.payload.skippedCount).toBe(0);
            expect(result.payload.errors).toEqual([]);
        });

        it('imports in MERGE mode (adds new expenses to existing)', async () => {
            const existing = [{ id: '99', description: 'Old', amount: 100, date: '2026-01-01', category: 'Bills' }];

            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'csv content',
                existingRawJson: JSON.stringify(existing),
                mode: ImportMode.MERGE,
                addMissingCategories: false,
            });

            expect(result.type).toBe('SUCCESS');
            const merged = JSON.parse(result.payload.mergedRawJson);
            expect(merged).toHaveLength(2);
            expect(merged.find((e: any) => e.id === '1')).toBeDefined();
            expect(merged.find((e: any) => e.id === '99')).toBeDefined();
        });

        it('MERGE overwrites an existing expense with the same ID', async () => {
            const existing = [{ id: '1', description: 'Old Version', amount: 10, date: '2026-01-01', category: 'Bills' }];

            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'csv',
                existingRawJson: JSON.stringify(existing),
                mode: ImportMode.MERGE,
                addMissingCategories: false,
            });

            const merged = JSON.parse(result.payload.mergedRawJson);
            expect(merged).toHaveLength(1);
            expect(merged[0].description).toBe('New Expense');
        });

        it('handles null existingRawJson in MERGE mode (treats as empty list)', async () => {
            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'csv',
                existingRawJson: null,
                mode: ImportMode.MERGE,
                addMissingCategories: false,
            });

            expect(JSON.parse(result.payload.mergedRawJson)).toEqual(mockValid);
        });

        it('collects new custom categories when addMissingCategories is true', async () => {
            vi.mocked(domain.isPresetExpenseCategory).mockReturnValue(false);
            vi.mocked(domain.validateImportedExpenses).mockReturnValue({
                valid: [{ ...mockValid[0], category: 'CustomCat' as any }],
                errors: [],
            });

            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'csv',
                existingRawJson: null,
                mode: ImportMode.OVERWRITE,
                addMissingCategories: true,
            });

            expect(result.payload.newCustomCategories).toEqual(['CustomCat']);
        });

        it('does not collect categories when addMissingCategories is false', async () => {
            vi.mocked(domain.isPresetExpenseCategory).mockReturnValue(false);

            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'csv',
                existingRawJson: null,
                mode: ImportMode.OVERWRITE,
                addMissingCategories: false,
            });

            expect(result.payload.newCustomCategories).toEqual([]);
        });

        it('returns ERROR when no valid expenses are found', async () => {
            vi.mocked(domain.validateImportedExpenses).mockReturnValue({
                valid: [],
                errors: ['Row 2: bad amount'],
            });

            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'bad csv',
                existingRawJson: null,
                mode: ImportMode.MERGE,
                addMissingCategories: false,
            });

            expect(result.type).toBe('ERROR');
            expect(result.error).toContain('No valid expenses found');
            expect(result.error).toContain('Row 2: bad amount');
        });

        it('reports skipped row count and truncates errors beyond 5', async () => {
            const manyErrors = Array.from({ length: 7 }, (_, i) => `Row ${i + 2}: error`);
            vi.mocked(domain.validateImportedExpenses).mockReturnValue({
                valid: mockValid,
                errors: manyErrors,
            });

            const result = await dispatchWorkerMessage(ExpensesWorkerType.IMPORT_EXPENSES, {
                csvText: 'csv',
                existingRawJson: null,
                mode: ImportMode.OVERWRITE,
                addMissingCategories: false,
            });

            expect(result.payload.skippedCount).toBe(7);
            expect(result.payload.errors).toHaveLength(6); // 5 rows + 1 summary
            expect(result.payload.errors[5]).toContain('...and 2 more');
        });
    });

    describe('unknown message type', () => {
        it('returns ERROR for an unknown type', async () => {
            const result = await dispatchWorkerMessage('UNKNOWN_TYPE', {});

            expect(result).toEqual({ type: 'ERROR', error: 'Unknown message type' });
        });
    });

    describe('error handling', () => {
        it('returns ERROR when an exception is thrown inside the handler', async () => {
            vi.mocked(csvUtils.toCSV).mockImplementation(() => {
                throw new Error('CSV generation failed');
            });

            const result = await dispatchWorkerMessage(ExpensesWorkerType.EXPORT_EXPENSES, {
                rawJson: JSON.stringify([{ id: '1' }]),
                filters: {},
            });

            expect(result).toEqual({ type: 'ERROR', error: 'CSV generation failed' });
        });
    });
});
