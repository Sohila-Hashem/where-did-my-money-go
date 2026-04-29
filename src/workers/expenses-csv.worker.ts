import { fromCSV, toCSV } from '../lib/csv-utils';
import { validateImportedExpenses, isPresetExpenseCategory } from '../domain/expense';
import { format } from 'date-fns';

export enum ExpensesWorkerType {
    EXPORT_EXPENSES = 'EXPORT_EXPENSES',
    IMPORT_EXPENSES = 'IMPORT_EXPENSES',
}

export enum ImportMode {
    MERGE = 'merge',
    OVERWRITE = 'overwrite',
}

/**
 * Web Worker for handling all expense data processing off-main-thread.
 *
 * The main thread passes raw JSON strings from localStorage; this worker
 * parses, filters, validates, and merges data, then returns the result
 * so the main thread only has to do raw string localStorage reads/writes.
 */

globalThis.onmessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    try {
        switch (type) {
            case ExpensesWorkerType.EXPORT_EXPENSES: {
                const { rawJson, filters } = payload as {
                    rawJson: string | null;
                    filters?: { month?: string; category?: string };
                };

                let expenses: any[] = rawJson ? JSON.parse(rawJson) : [];

                if (filters?.month) {
                    const monthKey = format(new Date(filters.month), 'yyyy-MM');
                    expenses = expenses.filter(
                        (e: any) => format(new Date(e.date), 'yyyy-MM') === monthKey,
                    );
                }
                if (filters?.category) {
                    expenses = expenses.filter((e: any) => e.category === filters.category);
                }

                if (expenses.length === 0) {
                    self.postMessage({ type: 'ERROR', error: 'No expenses to export.' });
                    return;
                }

                const csv = toCSV(expenses);
                self.postMessage({ type: 'SUCCESS', payload: csv });
                break;
            }

            case ExpensesWorkerType.IMPORT_EXPENSES: {
                const { csvText, existingRawJson, mode, addMissingCategories } = payload as {
                    csvText: string;
                    existingRawJson: string | null;
                    mode: ImportMode;
                    addMissingCategories: boolean;
                };

                const rawData = fromCSV(csvText);
                const { valid, errors } = validateImportedExpenses(rawData);

                if (valid.length === 0 && errors.length > 0) {
                    self.postMessage({
                        type: 'ERROR',
                        error: `No valid expenses found. Errors: ${errors.slice(0, 3).join('; ')}`,
                    });
                    return;
                }

                const newCustomCategories: string[] = addMissingCategories
                    ? valid
                        .filter((e) => !isPresetExpenseCategory(e.category))
                        .map((e) => e.category as string)
                    : [];

                let mergedExpenses;
                if (mode === ImportMode.OVERWRITE) {
                    mergedExpenses = valid;
                } else {
                    const existing: any[] = existingRawJson ? JSON.parse(existingRawJson) : [];
                    const expenseMap = new Map<string, any>();
                    existing.forEach((e) => expenseMap.set(e.id, e));
                    valid.forEach((e) => expenseMap.set(e.id, e));
                    mergedExpenses = Array.from(expenseMap.values());
                }

                self.postMessage({
                    type: 'SUCCESS',
                    payload: {
                        mergedRawJson: JSON.stringify(mergedExpenses),
                        newCustomCategories,
                        count: valid.length,
                        skippedCount: errors.length,
                        errors:
                            errors.length > 5
                                ? [...errors.slice(0, 5), `...and ${errors.length - 5} more`]
                                : errors,
                    },
                });
                break;
            }

            default:
                self.postMessage({ type: 'ERROR', error: 'Unknown message type' });
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error:
                error instanceof Error ? error.message : 'An unknown error occurred in the worker',
        });
    }
};
