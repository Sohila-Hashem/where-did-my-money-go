import { type Expense } from "@/domain/expense";
import { expenseSchema } from "@/schemas/expense-schema";
import { v7 as uuid7 } from "uuid";

/**
 * Domain logic for mapping and validating expenses from/to CSV.
 */

export const mapToExpense = (raw: any): Partial<Expense> => {
    // Strictly pick only defined fields and ignore others
    return {
        id: raw.id || uuid7(),
        amount: typeof raw.amount === 'string' ? parseFloat(raw.amount) : raw.amount,
        date: raw.date, // Keep as string for now, we'll convert for validation
        category: raw.category,
        description: raw.description,
    };
};

export const validateImportedExpenses = (data: any[]): { valid: Expense[], errors: string[] } => {
    const valid: Expense[] = [];
    const errors: string[] = [];

    data.forEach((item, index) => {
        try {
            const mapped = mapToExpense(item);
            
            // Transform date string to Date object for Zod validation
            const forValidation = {
                ...mapped,
                date: mapped.date ? new Date(mapped.date) : undefined
            };

            const result = expenseSchema.safeParse(forValidation);

            if (result.success) {
                valid.push({
                    ...mapped,
                    id: mapped.id!,
                    amount: result.data.amount,
                    date: result.data.date.toISOString(), // Standardize date format
                    category: result.data.category,
                    description: result.data.description,
                });
            } else {
                const errorMessages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                errors.push(`Row ${index + 2}: ${errorMessages}`);
            }
        } catch (err) {
            errors.push(`Row ${index + 2}: Unexpected error parsing row.`);
        }
    });

    return { valid, errors };
};

/**
 * Merges new expenses with existing ones.
 * If an ID already exists, the new one overwrites the old one.
 */
export const mergeExpenses = (current: Expense[], imported: Expense[]): Expense[] => {
    const expenseMap = new Map<string, Expense>();
    
    current.forEach(e => expenseMap.set(e.id, e));
    imported.forEach(e => expenseMap.set(e.id, e));
    
    return Array.from(expenseMap.values());
};
