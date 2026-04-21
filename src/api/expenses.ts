import { loadExpenses, overwriteExpenses, appendExpenses, loadCustomCategories } from "@/lib/storage";
import { validateImportedExpenses, mergeExpenses } from "@/domain/expense-csv";
import { addCustomCategory } from "@/api/custom-categories";
import { CATEGORIES } from "@/domain/expense";

export interface ImportOptions {
    mode: 'append' | 'overwrite';
    addMissingCategories: boolean;
}

/**
 * Communicates with the CSV Web Worker.
 */
async function runWorker(type: 'GENERATE_CSV' | 'PARSE_CSV', payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/csv.worker.ts', import.meta.url), { type: 'module' });
        
        worker.onmessage = (event) => {
            const { type: responseType, payload: responsePayload, error } = event.data;
            if (responseType === 'SUCCESS') {
                resolve(responsePayload);
            } else {
                reject(new Error(error || 'Worker error'));
            }
            worker.terminate();
        };

        worker.onerror = (error) => {
            reject(error);
            worker.terminate();
        };

        worker.postMessage({ type, payload });
    });
}

export async function exportExpenses() {
    try {
        const expenses = loadExpenses();
        if (expenses.length === 0) {
            return { error: "No expenses to export." };
        }

        const csvContent = await runWorker('GENERATE_CSV', expenses);
        
        // Trigger browser download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `expenses-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { success: true };
    } catch (error) {
        console.error("Export error:", error);
        return { error: error instanceof Error ? error.message : "Failed to export expenses." };
    }
}

export async function importExpenses(file: File, options: ImportOptions) {
    try {
        const text = await file.text();
        const rawData = await runWorker('PARSE_CSV', text);

        const { valid, errors } = validateImportedExpenses(rawData);

        if (valid.length === 0 && errors.length > 0) {
            return { error: `No valid expenses found. Errors: ${errors.slice(0, 3).join('; ')}` };
        }

        // Handle custom categories
        if (options.addMissingCategories) {
            const customCategories = loadCustomCategories();
            const presetCategories = CATEGORIES.map(c => c.category);
            const allCategories = new Set([...presetCategories, ...customCategories]);

            for (const expense of valid) {
                if (!allCategories.has(expense.category as string)) {
                    addCustomCategory(expense.category as string);
                    allCategories.add(expense.category as string);
                }
            }
        }

        // Persist data
        if (options.mode === 'overwrite') {
            overwriteExpenses(valid);
        } else {
            // If append, use the merge logic from domain to avoid duplicates if ID matches
            const current = loadExpenses();
            const merged = mergeExpenses(current, valid);
            overwriteExpenses(merged); // mergeExpenses already combined them
        }

        return { 
            success: true, 
            count: valid.length, 
            skippedCount: errors.length,
            errors: errors.length > 5 ? [...errors.slice(0, 5), `...and ${errors.length - 5} more`] : errors
        };
    } catch (error) {
        console.error("Import error:", error);
        return { error: error instanceof Error ? error.message : "Failed to import expenses." };
    }
}
