import { endOfMonth, format, startOfMonth } from "date-fns";
import type { Expense } from "./expense";
import { formatCurrency } from "@/lib/utils";

export function generateMonthlyReport(
    expenses: Expense[],
    month: string,
    currencyCode: string
): string {
    const monthDate = new Date(month + "-01");
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthExpenses = expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= monthStart && expDate <= monthEnd;
    });

    if (monthExpenses.length === 0) {
        return `You didn't record any expenses for ${format(monthDate, "MMMM yyyy")}. Either you're living like a hermit or you forgot to track! 🏝️`;
    }

    const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgPerExpense = total / monthExpenses.length;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach((exp) => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort(
        ([, a], [, b]) => b - a
    )[0];

    const dailyAvg = total / new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

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
    const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
    report += `📈 **Category Breakdown:**\n`;
    sortedCategories.forEach(([cat, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        report += `• ${cat}: ${currencyCode}${amount.toFixed(2)} (${percentage}%)\n`;
    });

    return report;
}