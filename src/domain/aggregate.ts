import { endOfMonth, format, getDaysInMonth, startOfMonth } from "date-fns";
import type { Expense, ExpenseCategories } from "./expense";
import { formatCurrency } from "@/lib/utils";

export function generateMonthlyReport(
    expenses: Expense[],
    month: string,
    currencyCode: string
): string {
    const monthDate = new Date(month + "-01");

    const monthExpenses = getMonthExpenses(expenses, month);

    if (monthExpenses.length === 0) {
        return `You didn't record any expenses for ${format(monthDate, "MMMM yyyy")}. Either you're living like a hermit or you forgot to track! 🏝️`;
    }

    const total = getMonthTotal(monthExpenses);
    const avgPerExpense = getAvgPerExpense(monthExpenses, total);

    // Category breakdown
    const categoryTotals = getCategoriesTotal(monthExpenses);

    const topCategory = getTopCategory(categoryTotals);

    const dailyAvg = total / getDaysInMonth(monthDate);

    // Generate insights
    let report = `📊 **${format(monthDate, "MMMM yyyy")} Money Snapshot**\n\n`;

    report += `You spent a total of **${formatCurrency(total, currencyCode)}** across ${monthExpenses.length} transactions. `;
    report += `That's an average of ${formatCurrency(dailyAvg, currencyCode)} per day.\n\n`;

    report += `🎯 **Where It Went:**\n`;
    report += `Your biggest spending category was **${topCategory[0]}** at ${formatCurrency(topCategory[1], currencyCode)} `;
    report += `(${((topCategory[1] / total) * 100).toFixed(1)}% of your total). `;

    if (topCategory[1] / total > 0.4) {
        report += `Whoa! That's nearly half your budget. Might be worth keeping an eye on! 👀\n\n`;
    } else if (topCategory[1] / total > 0.3) {
        report += `That's a significant chunk, but nothing too wild. 🎯\n\n`;
    } else {
        report += `Nice balance! You're spreading things out pretty well. ✨\n\n`;
    }

    report += `💸 **Transaction Vibes:**\n`;
    if (avgPerExpense < 20) {
        report += `Your average transaction was ${formatCurrency(avgPerExpense, currencyCode)}. Lots of small purchases! The death by a thousand paper cuts approach. ☕\n\n`;
    } else if (avgPerExpense < 100) {
        report += `Your average transaction was ${formatCurrency(avgPerExpense, currencyCode)}. A healthy mix of everyday spending. 🛒\n\n`;
    } else {
        report += `Your average transaction was ${formatCurrency(avgPerExpense, currencyCode)}. You like to go big! Making those meaningful purchases. 🎁\n\n`;
    }

    // Category breakdown
    const sortedCategories = getCategoriesTotalPercentage(categoryTotals, total);
    report += `📈 **Category Breakdown:**\n`;
    sortedCategories.forEach(({ category, amount, percentage }) => {
        report += `• ${category}: ${formatCurrency(amount, currencyCode)} (${percentage.toFixed(1)}%)\n`;
    });

    return report;
}

export const getCategoriesTotal = (expenses: Expense[]) => {
    return expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {} as Record<ExpenseCategories, number>);
}

export const getMonthExpenses = (expenses: Expense[], month: string) => {
    const monthDate = new Date(month + "-01");
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    return expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= monthStart && expDate <= monthEnd;
    });
}

export const getAvgPerExpense = (expenses: Expense[], total: number) => {
    return total / expenses.length;
}

export const getMonthTotal = (expenses: Expense[]) => {
    return expenses.reduce((acc, exp) => acc + exp.amount, 0);
}

export const getTopCategory = (categoriesTotal: Record<ExpenseCategories, number>) => {
    return Object.entries(categoriesTotal).sort(([, a], [, b]) => b - a)[0];
}

export const getCategoriesTotalPercentage = (categoriesTotal: Record<ExpenseCategories, number>, total: number) => {
    return Object.entries(categoriesTotal).map(([category, amount]) => {
        return {
            category,
            amount,
            percentage: (amount / total) * 100
        };
    });
}