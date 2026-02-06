import { describe, it, expect } from "vitest";
import { generateMonthComparisonData, generateMonthComparisonReport, generateMonthComparison } from "@/domain/compare";
import type { MonthComparisonData } from "@/domain/compare";
import type { Expense } from "@/domain/expense";

// Mock expenses for testing
const mockExpenses: Expense[] = [
    // Current Month: Oct 2026 (Selected)
    { id: "1", date: "2026-10-05T10:00:00.000Z", amount: 100, category: "Food", description: "Lunch" } as Expense,
    { id: "2", date: "2026-10-15T12:00:00.000Z", amount: 200, category: "Wearables", description: "Clothes" } as Expense, // Total: 300, Count: 2

    // Previous Month: Sep 2026
    { id: "3", date: "2026-09-10T10:00:00.000Z", amount: 50, category: "Food", description: "Dinner" } as Expense,
    { id: "4", date: "2026-09-20T14:00:00.000Z", amount: 150, category: "Transport", description: "Taxi" } as Expense, // Total: 200, Count: 2

    // Older Month: Aug 2026
    { id: "5", date: "2026-08-01T10:00:00.000Z", amount: 500, category: "Utilities", description: "Rent" } as Expense,
];

describe("compare.ts", () => {
    describe("generateMonthComparisonData", () => {
        it("calculates comparison data correctly for standard months", () => {
            const result = generateMonthComparisonData(mockExpenses, "2026-10");

            expect(result.selectedTotal).toBe(300); // 100 + 200
            expect(result.previousTotal).toBe(200); // 50 + 150
            expect(result.selectedTransactions).toBe(2);
            expect(result.previousTransactions).toBe(2);
            expect(result.difference).toBe(100); // 300 - 200
            expect(result.percentChange).toBe(50); // (100 / 200) * 100
        });

        it("handles case where previous month has 0 total (avoids division by zero)", () => {
            const noPrevExpenses = [
                { id: "1", date: "2026-10-05", amount: 100, category: "Food", description: "Lunch" } as Expense
            ];
            const result = generateMonthComparisonData(noPrevExpenses, "2026-10");

            expect(result.selectedTotal).toBe(100);
            expect(result.previousTotal).toBe(0);
            expect(result.percentChange).toBe(0);
        });

        it("handles case where current month has 0 total", () => {
            const onlyPrevExpenses = [
                { id: "3", date: "2026-09-10", amount: 50, category: "Food", description: "Dinner" } as Expense
            ];
            const result = generateMonthComparisonData(onlyPrevExpenses, "2026-10");

            expect(result.selectedTotal).toBe(0);
            expect(result.previousTotal).toBe(50);
            expect(result.difference).toBe(-50);
            expect(result.percentChange).toBe(-100); // (-50 / 50) * 100
        });
    });

    describe("generateMonthComparisonReport", () => {
        const baseData: MonthComparisonData = {
            selectedTotal: 100,
            previousTotal: 100,
            selectedTransactions: 5,
            previousTransactions: 5,
            difference: 0,
            percentChange: 0
        };

        it("returns 'No data' message when both totals are 0", () => {
            const data = { ...baseData, selectedTotal: 0, previousTotal: 0 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("No data for these months");
        });

        it("returns consistent message when change is small (< 5%)", () => {
            const data = { ...baseData, percentChange: 4 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("Pretty much the same as last month");
        });

        it("returns 'small island' message for huge increase (> 30%)", () => {
            const data = { ...baseData, selectedTotal: 150, previousTotal: 100, difference: 50, percentChange: 50 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("big spender");
            expect(report).toContain("small island");
        });

        it("returns 'notable bump' message for moderate increase (> 15%)", () => {
            const data = { ...baseData, selectedTotal: 120, previousTotal: 100, difference: 20, percentChange: 20 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("notable bump");
        });

        it("returns 'ramen' message for huge decrease (> 30%)", () => {
            const data = { ...baseData, selectedTotal: 50, previousTotal: 100, difference: -50, percentChange: -50 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("living off ramen");
        });

        it("returns 'nice savings' message for moderate decrease (> 15%)", () => {
            const data = { ...baseData, selectedTotal: 80, previousTotal: 100, difference: -20, percentChange: -20 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("Nice savings");
        });

        it("reports transaction counts correctly", () => {
            const report = generateMonthComparisonReport(baseData, "2026-10", "EGP");
            expect(report).toContain("This month: 5 expenses");
            expect(report).toContain("Last month: 5 expenses");
        });

        it("reports more transactions message", () => {
            const data = { ...baseData, selectedTransactions: 10, previousTransactions: 5 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("More transactions this month");
        });

        it("reports fewer transactions message", () => {
            const data = { ...baseData, selectedTransactions: 2, previousTransactions: 5 };
            const report = generateMonthComparisonReport(data, "2026-10", "EGP");
            expect(report).toContain("Fewer transactions this month");
        });
    });

    describe("generateMonthComparison", () => {
        it("generates a report string", () => {
            const report = generateMonthComparison(mockExpenses, "2026-10", "EGP");
            expect(typeof report).toBe("string");
            expect(report.length).toBeGreaterThan(0);
            expect(report).toContain("Month Comparison");
        });
    });
});
