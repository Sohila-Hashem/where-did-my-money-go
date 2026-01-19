import { formatCurrency } from "@/lib/utils"
import { ExpenseCategoryEnum, type Expense, type ExpenseCategories, type SupportedCurrencies } from "./expense"

export interface ExplanationItem {
    id: string;
    type: "summary" | "category" | "pattern";
    text: string;
    importance: "high" | "medium" | "low";
}

export interface MonthlyExpenseSummary {
    month: string
    totalSpent: number
    dailyAverage: number
    categoryTotals: Record<ExpenseCategories, number>
    categoryPercentages: Record<ExpenseCategories, number>
    transactionCount: number
}

export const getMonthlySummary = (expenses: Expense[], month: string): MonthlyExpenseSummary => {
    const categoryTotals: Record<ExpenseCategories, number> = Object.fromEntries(
        Object.values(ExpenseCategoryEnum).map(category => [category, 0])
    ) as Record<ExpenseCategories, number>;

    let totalSpent = 0;
    let transactionCount = 0;

    expenses.forEach(expense => {
        categoryTotals[expense.category] += expense.amount;
        totalSpent += expense.amount;
        transactionCount++;
    });

    const dailyAverage = totalSpent / (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate());

    const categoryPercentages: Record<ExpenseCategories, number> = Object.fromEntries(
        Object.entries(categoryTotals).map(([category, total]) => [
            category,
            totalSpent ? (total / totalSpent) * 100 : 0
        ])
    ) as Record<ExpenseCategories, number>;

    return {
        month,
        totalSpent,
        dailyAverage,
        categoryTotals,
        categoryPercentages,
        transactionCount
    };
}

export const generateMonthlyExplanation = (summary: MonthlyExpenseSummary, preferredCurrency?: SupportedCurrencies): ExplanationItem[] => {
    const topCategory = Object.entries(summary.categoryTotals).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const topCategoryPercentage = summary.categoryPercentages[topCategory as ExpenseCategories].toFixed(2);
    let explanations: ExplanationItem[] = [];

    explanations.push({
        id: "total",
        type: "summary",
        text: `You spent ${formatCurrency(summary.totalSpent, preferredCurrency)} in ${summary.month}.`,
        importance: "high"
    })

    explanations.push({
        id: "daily-average",
        type: "summary",
        text: `Your daily average spending was ${formatCurrency(summary.dailyAverage, preferredCurrency)}.`,
        importance: "medium"
    })

    explanations.push({
        id: "top-category",
        type: "category",
        text: `${topCategory} was your biggest expense, making up ${topCategoryPercentage}% of your total spending.`,
        importance: "high"
    })

    explanations.push({
        id: "transaction-count",
        type: "summary",
        text: `You made ${summary.transactionCount} transactions in ${summary.month}.`,
        importance: "low"
    })

    return explanations;
}