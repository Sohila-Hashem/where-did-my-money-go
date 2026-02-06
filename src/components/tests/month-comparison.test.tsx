import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MonthComparison } from "../month-comparison";
import { CURRENCIES } from "@/lib/constants";
import { type Expense } from "@/domain/expense";
import userEvent from "@testing-library/user-event";

// Mock expenses spanning multiple months for meaningful comparison
const mockExpenses: Expense[] = [
    {
        id: "1",
        date: "2026-03-15T10:00:00.000Z",
        amount: 300,
        category: "Food",
        description: "Grocery haul",
    },
    {
        id: "2",
        date: "2026-03-05T10:00:00.000Z",
        amount: 50,
        category: "Transport",
        description: "Gas",
    },
    {
        id: "3",
        date: "2026-02-14T10:00:00.000Z",
        amount: 200,
        category: "Entertainment",
        description: "Concert",
    },
    {
        id: "4",
        date: "2026-02-01T10:00:00.000Z",
        amount: 100,
        category: "Food",
        description: "Dinner",
    },
    {
        id: "5",
        date: "2026-01-20T10:00:00.000Z",
        amount: 500,
        category: "Other",
        description: "Gadget",
    },
];

const defaultCurrency = CURRENCIES[0]; // EGP

// Mock Pointer Events for Radix UI (Select component)
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

describe("MonthComparison Component", () => {
    it("renders the component title and initial description", () => {
        render(<MonthComparison expenses={[]} currency={defaultCurrency} />);
        expect(screen.getByText("Compare Months")).toBeInTheDocument();
        expect(screen.getByText(/Compare your selected month with the previous month/)).toBeInTheDocument();
    });

    it("shows 'No expenses yet' in select when expense list is empty", async () => {
        const user = userEvent.setup();
        render(<MonthComparison expenses={[]} currency={defaultCurrency} />);

        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);

        expect(screen.getByText("No expenses yet")).toBeInTheDocument();
        // The item should be disabled, effectively preventing selection
        // Depending on implementation, we might check aria-disabled
    });

    it("populates month selector with available months from expenses", async () => {
        const user = userEvent.setup();
        render(<MonthComparison expenses={mockExpenses} currency={defaultCurrency} />);

        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);

        // Should see March, February, and January
        expect(screen.getByText("March 2026")).toBeInTheDocument();
        expect(screen.getByText("February 2026")).toBeInTheDocument();
        expect(screen.getByText("January 2026")).toBeInTheDocument();
    });

    it("disables compare button by default when no month is selected", () => {
        render(<MonthComparison expenses={mockExpenses} currency={defaultCurrency} />);
        const compareBtn = screen.getByRole("button", { name: "Compare" });
        expect(compareBtn).toBeDisabled();
    });

    it("enables compare button when a month is selected", async () => {
        const user = userEvent.setup();
        render(<MonthComparison expenses={mockExpenses} currency={defaultCurrency} />);

        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);
        await user.click(screen.getByText("March 2026"));

        const compareBtn = screen.getByRole("button", { name: "Compare" });
        expect(compareBtn).toBeEnabled();
    });

    it("shows loading state and then comparison output upon generation", async () => {
        const user = userEvent.setup();
        render(<MonthComparison expenses={mockExpenses} currency={defaultCurrency} />);

        // Select March 2026
        const selectTrigger = screen.getByRole("combobox", { name: "Select a month" });
        await user.click(selectTrigger);
        await user.click(screen.getByText("March 2026"));

        // Click Compare
        const compareBtn = screen.getByRole("button", { name: "Compare" });
        await user.click(compareBtn);

        // Expect loading state
        expect(screen.getByText("Crunching the numbers...")).toBeInTheDocument();
        expect(compareBtn).toBeDisabled();

        // Wait for result (mock timeout is 1500ms)
        await waitFor(() => {
            expect(screen.queryByText("Crunching the numbers...")).not.toBeInTheDocument();
        }, { timeout: 2000 });

        // Check for specific content in the report
        // March Total: 350, February Total: 300
        // Expect "This month: EGP 350" (or similar format)
        // Expect "Last month: EGP 300"

        const reportContainer = screen.getByLabelText("Comparison Report");
        expect(reportContainer).toBeInTheDocument();

        expect(reportContainer).toHaveTextContent("March 2026");
        expect(reportContainer).toHaveTextContent("February 2026");

        // Check for calculated values in the report
        // We look for text that likely contains the formatted currency amounts
        // Note: The formatCurrency utility logic might affect exact string matching
        // But assuming standard formatting for EGP:

        // Check if report text content contains the numbers
        const reportText = reportContainer.textContent;
        // The output uses E£ symbol and might not have decimals if implemented that way or it might just be the locale default
        expect(reportText).toContain("This month: E£350");
        expect(reportText).toContain("Last month: E£300");

        // Difference is +50
        expect(reportText).toContain("Difference: +E£50");
    });
});
