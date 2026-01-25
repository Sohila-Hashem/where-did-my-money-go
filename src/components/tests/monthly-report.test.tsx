import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MonthlyReport } from "../monthly-report";
import { CURRENCIES } from "@/lib/constants";
import { type Expense } from "@/domain/expense";
import userEvent from "@testing-library/user-event";

const mockExpenses: Expense[] = [
    {
        id: "1",
        date: "2026-01-01T10:00:00.000Z",
        amount: 50,
        category: "Food",
        description: "Lunch",
    },
    {
        id: "2",
        date: "2026-02-15T10:00:00.000Z",
        amount: 150,
        category: "Wearables",
        description: "Clothes",
    },
    {
        id: "3",
        date: "2026-02-20T10:00:00.000Z",
        amount: 100,
        category: "Food",
        description: "Dinner",
    },
];

const defaultCurrency = CURRENCIES[0];

// Mock Pointer Events for Radix UI
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

describe("MonthlyReport Component", () => {
    it("renders the component title", () => {
        render(<MonthlyReport expenses={[]} currency={defaultCurrency} />);
        expect(screen.getByText("Monthly Report")).toBeInTheDocument();
    });

    it("shows 'No expenses yet' in select when expense list is empty", async () => {
        const user = userEvent.setup();
        render(<MonthlyReport expenses={[]} currency={defaultCurrency} />);

        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);

        expect(screen.getByText("No expenses yet")).toBeInTheDocument();
    });

    it("populates month selector with available months from expenses", async () => {
        const user = userEvent.setup();
        render(<MonthlyReport expenses={mockExpenses} currency={defaultCurrency} />);

        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);

        // Expect to see February 2026 and January 2026
        expect(screen.getByText("February 2026")).toBeInTheDocument();
        expect(screen.getByText("January 2026")).toBeInTheDocument();
    });

    it("disables generate button by default when no month is selected", () => {
        render(<MonthlyReport expenses={mockExpenses} currency={defaultCurrency} />);
        const generateBtn = screen.getByRole("button", { name: /generate/i });
        expect(generateBtn).toBeDisabled();
    });

    it("enables generate button when a month is selected", async () => {
        const user = userEvent.setup();
        render(<MonthlyReport expenses={mockExpenses} currency={defaultCurrency} />);

        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);
        await user.click(screen.getByText("February 2026"));

        const generateBtn = screen.getByRole("button", { name: /generate/i });
        expect(generateBtn).toBeEnabled();
    });

    it("shows loading state and then report content upon generation", async () => {
        const user = userEvent.setup();
        render(<MonthlyReport expenses={mockExpenses} currency={defaultCurrency} />);

        // Select month
        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);
        await user.click(screen.getByText("February 2026"));

        // Click generate
        const generateBtn = screen.getByRole("button", { name: /generate/i });
        await user.click(generateBtn);

        // Expect loading state
        expect(screen.getByText("Analyzing your spending patterns...")).toBeInTheDocument();
        expect(generateBtn).toBeDisabled();

        // Wait for report to appear (mock timeout is 1500ms in component)
        await waitFor(() => {
            expect(screen.queryByText("Analyzing your spending patterns...")).not.toBeInTheDocument();
        }, { timeout: 2000 });

        expect(screen.getByText(/Money Snapshot/)).toBeInTheDocument();
        expect(screen.getByText(/You spent a total of/)).toBeInTheDocument();

        // Check for specific content based on mockExpenses for February
        // Total: 150 + 100 = 250
        expect(screen.getByText(new RegExp(`${defaultCurrency.symbol}250`))).toBeInTheDocument();
    });
});
