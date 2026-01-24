import { endOfMonth, format, startOfMonth } from "date-fns";
import type { Expense } from "./expense";
import { formatCurrency } from "@/lib/utils";

export function generateMonthComparison(
    expenses: Expense[],
    currentMonth: string,
    currencyCode: string
): string {
    const currentDate = new Date(currentMonth + "-01");
    const currentStart = startOfMonth(currentDate);
    const currentEnd = endOfMonth(currentDate);

    const previousDate = new Date(currentDate);
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousStart = startOfMonth(previousDate);
    const previousEnd = endOfMonth(previousDate);

    const currentExpenses = expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= currentStart && expDate <= currentEnd;
    });

    const previousExpenses = expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= previousStart && expDate <= previousEnd;
    });

    if (currentExpenses.length === 0 && previousExpenses.length === 0) {
        return `No data for these months. Time to start tracking! 📝`;
    }

    const currentTotal = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    let report = `🔄 **Month Comparison**\n\n`;
    report += `**${format(currentDate, "MMMM yyyy")}** vs **${format(previousDate, "MMMM yyyy")}**\n\n`;

    const difference = currentTotal - previousTotal;
    const percentChange = previousTotal > 0 ? ((difference / previousTotal) * 100) : 0;

    report += `💰 **The Numbers:**\n`;
    report += `• This month: ${formatCurrency(currentTotal, currencyCode)}\n`;
    report += `• Last month: ${formatCurrency(previousTotal, currencyCode)}\n`;
    report += `• Difference: ${difference >= 0 ? "+" : ""}${formatCurrency(Math.abs(difference), currencyCode)}\n\n`;

    report += `📊 **The Verdict:**\n`;
    if (Math.abs(percentChange) < 5) {
        report += `Pretty much the same as last month! You're consistent, we'll give you that. 📌\n\n`;
    } else if (difference > 0) {
        report += `You spent ${Math.abs(percentChange).toFixed(1)}% MORE than last month. `;
        if (percentChange > 30) {
            report += `Whoa there, big spender! What happened? Did you buy a small island? 🏝️\n\n`;
        } else if (percentChange > 15) {
            report += `That's a notable bump. Special occasion or just treating yourself? 🎉\n\n`;
        } else {
            report += `A modest increase. Life happens! 🌟\n\n`;
        }
    } else {
        report += `You spent ${Math.abs(percentChange).toFixed(1)}% LESS than last month. `;
        if (Math.abs(percentChange) > 30) {
            report += `Wow! Major cutbacks or living off ramen? Either way, impressive restraint! 🏆\n\n`;
        } else if (Math.abs(percentChange) > 15) {
            report += `Nice savings! Your wallet is thanking you. 💚\n\n`;
        } else {
            report += `A little less here and there adds up! 🎯\n\n`;
        }
    }

    // Transaction count comparison
    report += `🧾 **Transaction Count:**\n`;
    report += `• This month: ${currentExpenses.length} expenses\n`;
    report += `• Last month: ${previousExpenses.length} expenses\n\n`;

    if (currentExpenses.length > previousExpenses.length) {
        report += `More transactions this month! You're either busier or being more diligent with tracking. 📝\n`;
    } else if (currentExpenses.length < previousExpenses.length) {
        report += `Fewer transactions this month. Consolidating purchases or just a quieter month? 🤔\n`;
    } else {
        report += `Same number of transactions. Creatures of habit, aren't we? 🔄\n`;
    }

    return report;
}