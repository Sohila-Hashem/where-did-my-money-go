import { format, subMonths } from "date-fns";
import type { Expense } from "./expense";
import { formatCurrency } from "@/lib/utils";
import { getMonthExpenses, getMonthTotal } from "./aggregate";

export type MonthComparisonData = {
    selectedTotal: number;
    previousTotal: number;
    selectedTransactions: number;
    previousTransactions: number;
    difference: number;
    percentChange: number;
}

export function generateMonthComparisonData(expenses: Expense[], selectedMonth: string): MonthComparisonData {
    const selectedMonthDate = new Date(selectedMonth + "-01")
    const previousMonthDate = subMonths(selectedMonthDate, 1)
    const previousMonth = format(previousMonthDate, "yyyy-MM")

    const selectedMonthExpenses = getMonthExpenses(expenses, selectedMonth)
    const previousMonthExpenses = getMonthExpenses(expenses, previousMonth)

    const selectedTotal = getMonthTotal(selectedMonthExpenses)
    const previousTotal = getMonthTotal(previousMonthExpenses)

    const selectedTransactions = selectedMonthExpenses.length
    const previousTransactions = previousMonthExpenses.length

    const difference = selectedTotal - previousTotal
    const percentChange = previousTotal > 0 ? ((difference / previousTotal) * 100) : 0

    return {
        selectedTotal,
        previousTotal,
        selectedTransactions,
        previousTransactions,
        difference,
        percentChange
    }
}

export function generateMonthComparisonReport(
    comaprisonData: MonthComparisonData,
    selectedMonth: string, // yyyy-mm format
    currencyCode: string
): string {
    const selectedMonthDate = new Date(selectedMonth + "-01");
    const previousMonthDate = subMonths(selectedMonthDate, 1);

    if (comaprisonData.selectedTotal === 0 && comaprisonData.previousTotal === 0) {
        return `No data for these months. Time to start tracking! 📝`;
    }

    let report = `🔄 **Month Comparison**\n\n`;
    report += `**${format(selectedMonthDate, "MMMM yyyy")}** vs **${format(previousMonthDate, "MMMM yyyy")}**\n\n`;

    report += `💰 **The Numbers:**\n`;
    report += `• This month: ${formatCurrency(comaprisonData.selectedTotal, currencyCode)}\n`;
    report += `• Last month: ${formatCurrency(comaprisonData.previousTotal, currencyCode)}\n`;
    report += `• Difference: ${comaprisonData.difference >= 0 ? "+" : ""}${formatCurrency(Math.abs(comaprisonData.difference), currencyCode)}\n\n`;

    report += `📊 **The Verdict:**\n`;
    if (Math.abs(comaprisonData.percentChange) < 5) {
        report += `Pretty much the same as last month! You're consistent, we'll give you that. 📌\n\n`;
    } else if (comaprisonData.difference > 0) {
        report += `You spent ${Math.abs(comaprisonData.percentChange).toFixed(1)}% MORE than last month. `;
        if (comaprisonData.percentChange > 30) {
            report += `Whoa there, big spender! What happened? Did you buy a small island? 🏝️\n\n`;
        } else if (comaprisonData.percentChange > 15) {
            report += `That's a notable bump. Special occasion or just treating yourself? 🎉\n\n`;
        } else {
            report += `A modest increase. Life happens! 🌟\n\n`;
        }
    } else {
        report += `You spent ${Math.abs(comaprisonData.percentChange).toFixed(1)}% LESS than last month. `;
        if (Math.abs(comaprisonData.percentChange) > 30) {
            report += `Wow! Major cutbacks or living off ramen? Either way, impressive restraint! 🏆\n\n`;
        } else if (Math.abs(comaprisonData.percentChange) > 15) {
            report += `Nice savings! Your wallet is thanking you. 💚\n\n`;
        } else {
            report += `A little less here and there adds up! 🎯\n\n`;
        }
    }

    report += `🧾 **Transaction Count:**\n`;
    report += `• This month: ${comaprisonData.selectedTransactions} expenses\n`;
    report += `• Last month: ${comaprisonData.previousTransactions} expenses\n\n`;

    if (comaprisonData.selectedTransactions > comaprisonData.previousTransactions) {
        report += `More transactions this month! You're either busier or being more diligent with tracking. 📝\n`;
    } else if (comaprisonData.selectedTransactions < comaprisonData.previousTransactions) {
        report += `Fewer transactions this month. Consolidating purchases or just a quieter month? 🤔\n`;
    } else {
        report += `Same number of transactions. Creatures of habit, aren't we? 🔄\n`;
    }

    return report;
}

export function generateMonthComparison(expenses: Expense[], selectedMonth: string, currencyCode: string) {
    const comparisonData = generateMonthComparisonData(expenses, selectedMonth);
    return generateMonthComparisonReport(comparisonData, selectedMonth, currencyCode);
}