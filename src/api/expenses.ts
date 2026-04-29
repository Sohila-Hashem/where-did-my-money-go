import { loadExpenses, insertExpense, deleteExpense, updateExpense, loadRawExpenses, saveRawExpenses, mergeCustomCategoriesWithExisting, type PaginationResult, EXPENSES_PAGE_SIZE } from "@/lib/storage";
import { downloadExpensesExportFile, type Expense } from "@/domain/expense";
import { ExpensesWorkerType, ImportMode } from '../workers/expenses-csv.worker';

export { ExpensesWorkerType, ImportMode };

export interface ImportOptions {
    mode: ImportMode;
    addMissingCategories: boolean;
}

export interface ExpensesFilters {
    month?: string;
    category?: string;
}

/**
 * Loads all expenses from storage (no filters, no pagination).
 * Used for the initial page load.
 */
export function getAllExpenses(): Expense[] {
    return loadExpenses();
}

/**
 * Adds a new expense, persists the updated list, and returns it.
 */
export function addExpense(expense: Expense): Expense[] {
    return insertExpense(expense);
}

/**
 * Updates an existing expense, persists the updated list, and returns it.
 */
export function editExpense(expense: Expense): Expense[] {
    return updateExpense(expense);
}

/**
 * Deletes an expense by ID, persists the updated list, and returns it.
 */
export function removeExpense(id: string): Expense[] {
    return deleteExpense(id);
}

/**
 * Returns all expenses matching the given filters (no pagination).
 */
export function getExpenses(filters?: ExpensesFilters): Expense[] {
    return loadExpenses({ month: filters?.month, category: filters?.category });
}

/**
 * Returns one page of expenses matching the given filters.
 * Uses cursor-based pagination.
 */
export function getExpensesPage(
    filters: ExpensesFilters,
    cursorId: string | null,
    limit: number = EXPENSES_PAGE_SIZE,
): PaginationResult {
    return loadExpenses({ month: filters.month, category: filters.category, cursorId, limit });
}

import CsvWorker from '../workers/expenses-csv.worker.ts?worker';

/**
 * Communicates with the CSV Web Worker.
 */
async function runWorker(type: ExpensesWorkerType, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const worker = new CsvWorker();

        worker.onmessage = (event) => {
            const { type: responseType, payload: responsePayload, error } = event.data;
            if (responseType === 'SUCCESS') {
                resolve(responsePayload);
            } else {
                reject(new Error(error || 'Something went wrong. Please try again later.'));
            }
            worker.terminate();
        };

        worker.onerror = (error) => {
            console.error(error);
            reject(error);
            worker.terminate();
        };

        worker.postMessage({ type, payload });
    });
}

/**
 * Exports filtered expenses to a CSV file.
 * The main thread only reads the raw JSON string from localStorage;
 * all parsing, filtering, and CSV generation happen inside the worker.
 */
export async function exportExpenses(filters?: ExpensesFilters, fileName?: string) {
    try {
        const rawJson = loadRawExpenses();
        const csvContent = await runWorker(ExpensesWorkerType.EXPORT_EXPENSES, { rawJson, filters });
        downloadExpensesExportFile(csvContent, fileName);
        return { success: true };
    } catch (error) {
        console.error("Export error:", error);
        return { error: error instanceof Error ? error.message : "Failed to export expenses." };
    }
}

/**
 * Imports expenses from a CSV file.
 * The main thread reads the raw JSON string from localStorage and the file text,
 * then passes both to the worker for parsing, validation, and merging.
 * The main thread only writes the resulting raw JSON string back to localStorage.
 */
export async function importExpenses(file: File, options: ImportOptions) {
    try {
        const csvText = await file.text();
        const existingRawJson = loadRawExpenses();

        const result = await runWorker(ExpensesWorkerType.IMPORT_EXPENSES, {
            csvText,
            existingRawJson,
            mode: options.mode,
            addMissingCategories: options.addMissingCategories,
        });

        saveRawExpenses(result.mergedRawJson);

        if (result.newCustomCategories.length > 0) {
            mergeCustomCategoriesWithExisting(result.newCustomCategories);
        }

        return {
            success: true,
            count: result.count,
            skippedCount: result.skippedCount,
            errors: result.errors,
        };
    } catch (error) {
        console.error("Import error:", error);
        return { error: error instanceof Error ? error.message : "Failed to import expenses." };
    }
}
