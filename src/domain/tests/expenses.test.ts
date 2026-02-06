import { describe, it, expect } from "vitest";
import { getTotalAmount, filterExpensesByMonth, getAvailableMonths } from "@/domain/expense";
import type { Expense } from "@/domain/expense";

const mockExpenses: Expense[] = [
    {
        id: "1",
        date: "2026-10-05T10:00:00.000Z",
        amount: 50,
        category: "Food",
        description: "Lunch",
    },
    {
        id: "2",
        date: "2026-10-15T12:00:00.000Z",
        amount: 150,
        category: "Wearables",
        description: "Clothes",
    },
    {
        id: "3",
        date: "2026-09-20T10:00:00.000Z",
        amount: 100,
        category: "Food",
        description: "Dinner",
    },
    {
        id: "4",
        date: "2026-10-25T14:00:00.000Z",
        amount: 25.50,
        category: "Transport",
        description: "Taxi",
    },
];

describe("Expense Helper Functions", () => {
    describe("getTotalAmount", () => {
        it("calcluates total amount correctly", () => {
            const total = getTotalAmount(mockExpenses);
            // 50 + 150 + 100 + 25.50 = 325.50
            expect(total).toBe(325.50);
        });

        it("returns 0 for empty expenses array", () => {
            expect(getTotalAmount([])).toBe(0);
        });
    });

    describe("filterExpensesByMonth", () => {
        it("returns expenses for the specified month", () => {
            const result = filterExpensesByMonth(mockExpenses, "2026-10");
            expect(result).toHaveLength(3);
            expect(result.map(e => e.id)).toEqual(expect.arrayContaining(["1", "2", "4"]));
            expect(result.find(e => e.id === "3")).toBeUndefined();
        });

        it("returns empty array when no expenses match the month", () => {
            const result = filterExpensesByMonth(mockExpenses, "2026-11");
            expect(result).toHaveLength(0);
        });
    });

    describe("getAvailableMonths", () => {
        it("returns unique months in descending order", () => {
            const months = getAvailableMonths(mockExpenses);
            expect(months).toEqual(["2026-10", "2026-09"]);
        });

        it("returns empty array for empty expenses", () => {
            expect(getAvailableMonths([])).toEqual([]);
        });
    });
});
