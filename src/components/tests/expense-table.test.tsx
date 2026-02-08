import { render, screen, within } from '@testing-library/react';
import { ExpenseTable } from '@/components/expense-table';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CURRENCIES } from '@/lib/constants';
import type { Expense } from '@/domain/expense';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock ScrollIntoView and Pointer Events
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();


describe('ExpenseTable', () => {
    const mockCurrency = CURRENCIES[0]; // USD
    const mockExpenses: Expense[] = [
        { id: '1', description: 'Groceries', amount: 50, category: 'Food', date: '2023-10-01' },
        { id: '2', description: 'Rent', amount: 1000, category: 'Bills', date: '2023-10-05' },
        // Different month
        { id: '3', description: 'Cinema', amount: 20, category: 'Entertainment', date: '2023-09-15' },
    ];

    const onDeleteExpense = vi.fn();
    const onEditExpense = vi.fn();

    it('renders empty state when no expenses', () => {
        render(
            <ExpenseTable
                expenses={[]}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );
        expect(screen.getByText(/No expenses found/i)).toBeInTheDocument();
    });

    it('renders expenses correctly', () => {
        render(
            <ExpenseTable
                expenses={mockExpenses}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByText('Cinema')).toBeInTheDocument();
        // Check total calculation (sum of all visible expenses initially)
        // 50 + 1000 + 20 = 1070
        // Expect format like $1,070.00
        // Limit fraction digits is 0-2, so for integer it might be $1,070
        expect(screen.getByText((content) => content.includes('1,070'))).toBeInTheDocument();
    });

    it('filters expenses by month', async () => {
        const user = userEvent.setup();
        render(
            <ExpenseTable
                expenses={mockExpenses}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        // Verify all present initially
        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('Cinema')).toBeInTheDocument();

        // Select October 2023
        const filterSelect = screen.getAllByRole('combobox')[0]; // There are multiple selects potentially (for pagination? no, just filter here)
        // Actually the select might be hard to identify if there are others on page, but here it's isolated.
        // The label says "Filter by month:"

        // Radix select trigger
        await user.click(filterSelect);

        // Find October 2023 option
        const octoberOption = await screen.findByText('October 2023');
        await user.click(octoberOption);

        // Verify filtering
        expect(screen.queryByText('Cinema')).not.toBeInTheDocument(); // September
        expect(screen.getByText('Groceries')).toBeInTheDocument(); // October
        expect(screen.getByText('Rent')).toBeInTheDocument(); // October

        // Check new total: 1050
        // Check new total: 1050
        expect(screen.getByText((content) => content.includes('1,050'))).toBeInTheDocument();
    });

    it('calls onEditExpense when edit button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ExpenseTable
                expenses={[mockExpenses[0]]}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        const row = screen.getByRole('row', { name: /Groceries/i });
        const buttons = within(row).getAllByRole('button');
        const editBtn = buttons[0];

        await user.click(editBtn);
        expect(onEditExpense).toHaveBeenCalledWith(mockExpenses[0]);
    });

    it('opens delete interactions correctly', async () => {
        const user = userEvent.setup();
        render(
            <ExpenseTable
                expenses={[mockExpenses[0]]}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        const row = screen.getByRole('row', { name: /Groceries/i });
        const buttons = within(row).getAllByRole('button');
        const deleteBtn = buttons[1]; // Trash icon

        await user.click(deleteBtn);

        // Alert dialog should appear
        expect(screen.getByText(/Are you sure you want to delete this expense/i)).toBeInTheDocument();

        const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete' });
        await user.click(confirmDeleteBtn);

        expect(onDeleteExpense).toHaveBeenCalledWith(mockExpenses[0].id);
    });
});
