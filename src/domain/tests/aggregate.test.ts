import { describe, it, expect } from "vitest";
import {
    generateMonthlyReport,
    getMonthExpenses,
    getMonthTotal,
    getCategoriesTotal,
    getTopCategory,
    getCategoriesTotalPercentage,
} from "@/domain/aggregate";
import type { Expense } from "@/domain/expense";
import {
    HIGH_SPENDING_MESSAGE,
    MEDIUM_SPENDING_MESSAGE,
    LOW_SPENDING_MESSAGE,
    BALANCED_SPENDING_MESSAGE
} from "@/lib/constants";

const mockExpenses: Expense[] = [
    {
        id: "1",
        date: "2023-10-05T10:00:00.000Z",
        amount: 50,
        category: "Food",
        description: "Lunch",
    },
    {
        id: "2",
        date: "2023-10-15T12:00:00.000Z",
        amount: 150,
        category: "Wearables",
        description: "Clothes",
    },
    {
        id: "3",
        date: "2023-10-25T14:00:00.000Z",
        amount: 20,
        category: "Transport",
        description: "Uber",
    },
    {
        id: "4",
        date: "2023-09-20T10:00:00.000Z",
        amount: 100,
        category: "Food",
        description: "Dinner",
    },
];

describe("Aggregate Helper Functions", () => {
    it("getMonthExpenses filters expenses correctly for a given month", () => {
        const month = "2023-10";
        const result = getMonthExpenses(mockExpenses, month);
        expect(result).toHaveLength(3);
        expect(result.map(e => e.id)).toEqual(expect.arrayContaining(["1", "2", "3"]));
        expect(result.find(e => e.id === "4")).toBeUndefined();
    });

    it("getMonthTotal calculates the total amount correctly", () => {
        const expenses = mockExpenses.slice(0, 3); // Oct expenses: 50 + 150 + 20 = 220
        const total = getMonthTotal(expenses);
        expect(total).toBe(220);
    });

    it("getCategoriesTotal groups expenses and sums amounts correctly", () => {
        const expenses = [
            ...mockExpenses.slice(0, 3),
            { id: "5", date: "2023-10-26", amount: 30, category: "Food", description: "Snack" } as Expense
        ];
        // Food: 50 + 30 = 80
        // Wearables: 150
        // Transport: 20
        const totals = getCategoriesTotal(expenses);
        expect(totals).toEqual({
            Food: 80,
            Wearables: 150,
            Transport: 20,
        });
    });

    it("getTopCategory returns the category with the highest spend", () => {
        const totals = {
            Food: 80,
            Wearables: 150,
            Transport: 20,
            Utilities: 0,
            Entertainment: 0,
            Health: 0,
            Travel: 0,
            Subscriptions: 0,
            "Self Care": 0,
            Gifts: 0,
            Medical: 0,
            Education: 0,
            Installments: 0,
            "Debt Payment": 0,
            Withdrawals: 0,
            Bills: 0,
            Donations: 0,
            "Bank Fees": 0,
            Fees: 0,
            Investments: 0,
            Savings: 0,
            Loans: 0,
            Taxes: 0,
            Insurance: 0,
            Transfers: 0,
            Other: 0
        };
        const top = getTopCategory(totals);
        expect(top).toEqual({ category: "Wearables", amount: 150 });
    });

    it("getCategoriesTotalPercentage calculates percentages correctly and sorts by percentage descending", () => {
        const totals = {
            Food: 80,
            Wearables: 150,
            Transport: 20,
            Utilities: 0,
            Entertainment: 0,
            Health: 0,
            Travel: 0,
            Subscriptions: 0,
            "Self Care": 0,
            Gifts: 0,
            Medical: 0,
            Education: 0,
            Installments: 0,
            "Debt Payment": 0,
            Withdrawals: 0,
            Bills: 0,
            Donations: 0,
            "Bank Fees": 0,
            Fees: 0,
            Investments: 0,
            Savings: 0,
            Loans: 0,
            Taxes: 0,
            Insurance: 0,
            Transfers: 0,
            Other: 0
        };
        const total = 250;
        const result = getCategoriesTotalPercentage(totals, total);

        // Check calculations
        const food = result.find(c => c.category === "Food");
        const Wearables = result.find(c => c.category === "Wearables");
        const transport = result.find(c => c.category === "Transport");

        expect(food?.percentage).toBe((80 / 250) * 100);
        expect(Wearables?.percentage).toBe((150 / 250) * 100);
        expect(transport?.percentage).toBe((20 / 250) * 100);

        // Check sorting (Descending)
        // Expected: Wearables (60%), Food (32%), Transport (8%), others 0
        expect(result[0].category).toBe("Wearables");
        expect(result[1].category).toBe("Food");
        expect(result[2].category).toBe("Transport");

        // Ensure strictly descending
        for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].percentage).toBeGreaterThanOrEqual(result[i + 1].percentage);
        }
    });
});

describe("generateMonthlyReport", () => {
    const currencyCode = "USD";
    const month = "2023-10";

    it("returns empty state message when no expenses exist", () => {
        const report = generateMonthlyReport([], month, currencyCode);
        expect(report).toContain(`You didn't record any expenses for October 2023`);
        expect(report).toContain("living like a hermit");
    });

    it("generates report for high spending category (> 50%)", () => {
        // Wearables is 150/220 = ~68%
        const expenses = mockExpenses.slice(0, 3);
        const report = generateMonthlyReport(expenses, month, currencyCode);

        expect(report).toContain(`October 2023 Money Snapshot`);
        expect(report).toContain(`spent a total of **$220**`);
        expect(report).toContain(`biggest spending category was **Wearables**`);
        expect(report).toContain(HIGH_SPENDING_MESSAGE);
    });

    it("generates report for medium spending category (> 40% but <= 50%)", () => {
        // Create scenario: Total 100. Food 45 (45%). Other 55.
        // Needs total 100.
        // Food: 45
        // Transport: 15
        // Wearables: 20
        // Entertainment: 20
        const expenses: Expense[] = [
            { id: "1", date: "2023-10-01", amount: 45, category: "Food", description: "Food" },
            { id: "2", date: "2023-10-01", amount: 15, category: "Transport", description: "T" },
            { id: "3", date: "2023-10-01", amount: 20, category: "Wearables", description: "S" },
            { id: "4", date: "2023-10-01", amount: 20, category: "Entertainment", description: "E" },
        ];

        const report = generateMonthlyReport(expenses, month, currencyCode);
        expect(report).toContain(`biggest spending category was **Food**`);
        expect(report).toContain(MEDIUM_SPENDING_MESSAGE);
    });

    it("generates report for low spending category (> 30% but <= 40%)", () => {
        // Create scenario: Total 100. Food 35 (35%). Other 65.
        const expenses: Expense[] = [
            { id: "1", date: "2023-10-01", amount: 35, category: "Food", description: "Food" },
            { id: "2", date: "2023-10-01", amount: 20, category: "Transport", description: "T" },
            { id: "3", date: "2023-10-01", amount: 20, category: "Wearables", description: "S" },
            { id: "4", date: "2023-10-01", amount: 25, category: "Entertainment", description: "E" },
        ];

        const report = generateMonthlyReport(expenses, month, currencyCode);
        expect(report).toContain(`biggest spending category was **Food**`);
        expect(report).toContain(LOW_SPENDING_MESSAGE);
    });

    it("generates report for balanced spending (<= 30%)", () => {
        // Create scenario: Total 100. Category max 25.
        const expenses: Expense[] = [
            { id: "1", date: "2023-10-01", amount: 25, category: "Food", description: "Food" },
            { id: "2", date: "2023-10-01", amount: 25, category: "Transport", description: "T" },
            { id: "3", date: "2023-10-01", amount: 25, category: "Wearables", description: "S" },
            { id: "4", date: "2023-10-01", amount: 25, category: "Entertainment", description: "E" },
        ];

        const report = generateMonthlyReport(expenses, month, currencyCode);
        expect(report).toContain(BALANCED_SPENDING_MESSAGE);
    });
});
// Cache bust
