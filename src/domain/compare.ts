import type { ExplanationItem, MonthlyExpenseSummary } from "./aggregate";
import { ExpenseCategoryEnum, type ExpenseCategories } from "./expense";

export interface MonthComaprison {
    totalChange: number,
    percentChange: number,
    categroyChanges: Record<ExpenseCategories, number>
    biggestContributor?: ExpenseCategories
}


export const compareMonths = (current: MonthlyExpenseSummary, previous: MonthlyExpenseSummary) => {
    console.log("🚀 ~ compareMonths ~ previous:", previous)
    console.log("🚀 ~ compareMonths ~ current:", current)
    const totalChange = current.totalSpent - previous.totalSpent;
    const percentChange = (totalChange / previous.totalSpent) * 100;
    const categroyChanges = Object.entries(current.categoryTotals).reduce((acc, [category, amount]) => {
        const previousAmount = previous.categoryTotals[category as ExpenseCategories];
        const change = amount - previousAmount;
        acc[category as ExpenseCategories] = change;
        return acc;
    }, {} as Record<ExpenseCategories, number>);
    const biggestContributor = Object.entries(categroyChanges).reduce((acc, [category, amount]) => {
        if (amount > acc[1]) {
            acc = [category as ExpenseCategories, amount];
        }
        return acc;
    }, [ExpenseCategoryEnum.Other, 0] as [ExpenseCategories, number]);

    return {
        totalChange,
        percentChange,
        categroyChanges,
        biggestContributor: biggestContributor[0] as ExpenseCategories
    };
}


export const generateComparisonExplanation = (comparison: MonthComaprison): ExplanationItem[] => {
    const explanation: ExplanationItem[] = [];
    const decreasedCategories = Object.entries(comparison.categroyChanges).filter(([_, change]) => change < 0).map(([category]) => category);
    const increasedCategories = Object.entries(comparison.categroyChanges).filter(([_, change]) => change > 0).map(([category]) => category);

    explanation.push({
        id: "total-change",
        text: `Your spending ${comparison.totalChange > 0 ? "increased" : "decreased"} by ${Math.abs(comparison.totalChange)} (${comparison.percentChange.toFixed(2)}%)`,
        type: "pattern",
        importance: "high"
    });

    explanation.push({
        id: "biggest-contributor",
        text: `${comparison.biggestContributor} Contributed the most to this increase`,
        type: "pattern",
        importance: "medium"
    });

    if (decreasedCategories.length > 0) {
        explanation.push({
            id: "decreased-categories",
            text: `You spent less on ${decreasedCategories.join(", ")}`,
            type: "pattern",
            importance: "medium"
        })
    }

    if (increasedCategories.length > 0) {
        explanation.push({
            id: "increased-categories",
            text: `You spent more on ${increasedCategories.join(", ")}`,
            type: "pattern",
            importance: "medium"
        })
    }

    return explanation;
}