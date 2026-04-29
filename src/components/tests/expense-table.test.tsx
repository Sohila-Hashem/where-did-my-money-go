import { render, screen, within } from '@testing-library/react';
import { ExpenseTable } from '@/components/expense-table';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CURRENCIES } from '@/lib/constants';
import type { Expense } from '@/domain/expense';

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock ScrollIntoView and Pointer Events
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();

import { useState, useMemo } from 'react';
import { compareDesc, format, parseISO } from 'date-fns';

const TestWrapper = ({ 
    expenses, 
    currency, 
    customCategories = [],
    onDeleteExpense = vi.fn(),
    onEditExpense = vi.fn(),
    onNextPage: externalOnNextPage,
    onPreviousPage: externalOnPreviousPage,
    pageSize = 10,
}: any) => {
    const [month, setMonth] = useState('all');
    const [category, setCategory] = useState('all');
    const [cursors, setCursors] = useState<(string | null)[]>([null]);

    const filtered = useMemo(() => {
        let result = expenses;
        if (month !== "all") {
            const monthKey = format(parseISO(month + '-01'), 'yyyy-MM');
            result = result.filter((e: Expense) => format(parseISO(e.date), 'yyyy-MM') === monthKey);
        }
        if (category !== "all") {
            result = result.filter((e: Expense) => e.category === category);
        }
        return result;
    }, [expenses, month, category]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a: Expense, b: Expense) => compareDesc(parseISO(a.date), parseISO(b.date)));
    }, [filtered]);

    const currentCursor = cursors[cursors.length - 1];
    const paginationResult = useMemo(() => {
        let startIndex = 0;
        if (currentCursor !== null) {
            const cursorIndex = sorted.findIndex((e: Expense) => e.id === currentCursor);
            startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
        }
        const pageData = sorted.slice(startIndex, startIndex + pageSize);
        const hasNextPage = startIndex + pageSize < sorted.length;
        const nextCursor = pageData.length > 0 ? pageData[pageData.length - 1].id : null;
        const totalAmount = filtered.reduce((sum: number, e: Expense) => sum + e.amount, 0);
        const totalCount = filtered.length;
        return { data: pageData, nextCursor, hasNextPage, totalAmount, totalCount };
    }, [sorted, currentCursor, pageSize]);

    const isFirstPage = cursors.length === 1;
    const isLastPage = !paginationResult.hasNextPage;

    const handleMonthChange = (m: string) => { setMonth(m); setCursors([null]); };
    const handleCategoryChange = (c: string) => { setCategory(c); setCursors([null]); };

    const handleNextPage = () => {
        if (paginationResult.nextCursor !== null) {
            setCursors(prev => [...prev, paginationResult.nextCursor]);
        }
        externalOnNextPage?.();
    };

    const handlePreviousPage = () => {
        setCursors(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
        externalOnPreviousPage?.();
    };

    return (
        <ExpenseTable
            expenses={expenses}
            totalAmount={paginationResult.totalAmount}
            totalCount={paginationResult.totalCount}
            pagedExpenses={paginationResult.data}
            selectedMonth={month}
            selectedCategory={category}
            onMonthChange={handleMonthChange}
            onCategoryChange={handleCategoryChange}
            onDeleteExpense={onDeleteExpense}
            onEditExpense={onEditExpense}
            currency={currency}
            customCategories={customCategories}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            isFirstPage={isFirstPage}
            isLastPage={isLastPage}
        />
    );
};

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
            <TestWrapper
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
            <TestWrapper
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

    it('renders both month and category filter selects', () => {
        render(
            <TestWrapper
                expenses={mockExpenses}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        expect(screen.getByText('Month:')).toBeInTheDocument();
        expect(screen.getByText('Category:')).toBeInTheDocument();
    });

    it('filters expenses by month', async () => {
        const user = userEvent.setup();
        render(
            <TestWrapper
                expenses={mockExpenses}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        // Verify all present initially
        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('Cinema')).toBeInTheDocument();

        // Select October 2023 — first combobox is Month
        const [monthSelect] = screen.getAllByRole('combobox');
        await user.click(monthSelect);

        const octoberOption = await screen.findByText('Oct 2023');
        await user.click(octoberOption);

        // Verify filtering
        expect(screen.queryByText('Cinema')).not.toBeInTheDocument(); // September
        expect(screen.getByText('Groceries')).toBeInTheDocument(); // October
        expect(screen.getByText('Rent')).toBeInTheDocument(); // October

        // Check new total: 1050
        expect(screen.getByText((content) => content.includes('1,050'))).toBeInTheDocument();
    });

    it('filters expenses by a preset category', async () => {
        const user = userEvent.setup();
        render(
            <TestWrapper
                expenses={mockExpenses}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        // All visible initially
        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByText('Cinema')).toBeInTheDocument();

        // Second combobox is Category
        const [, categorySelect] = screen.getAllByRole('combobox');
        await user.click(categorySelect);

        const foodOption = await screen.findByRole('option', { name: 'Food' });
        await user.click(foodOption);

        // Only Food expenses visible
        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.queryByText('Rent')).not.toBeInTheDocument();
        expect(screen.queryByText('Cinema')).not.toBeInTheDocument();

        // 1 transaction left, total should be the amount of the remaining expense
        expect(screen.getByText('1 transaction')).toBeInTheDocument();
        const totalsRow = screen.getByText(/Total:/i).closest('div');
        // Match the number 50 with any currency symbol prefix
        expect(totalsRow?.textContent).toContain(`${mockCurrency.symbol}50`);
    });

    it('filters expenses by a custom category', async () => {
        const user = userEvent.setup();
        const expensesWithCustom: Expense[] = [
            ...mockExpenses,
            { id: '4', description: 'Spa day', amount: 80, category: 'Wellness', date: '2023-10-10' },
        ];

        render(
            <TestWrapper
                expenses={expensesWithCustom}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
                customCategories={['Wellness']}
            />
        );

        const [, categorySelect] = screen.getAllByRole('combobox');
        await user.click(categorySelect);

        const wellnessOption = await screen.findByRole('option', { name: 'Wellness' });
        await user.click(wellnessOption);

        expect(screen.getByText('Spa day')).toBeInTheDocument();
        expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
        expect(screen.queryByText('Rent')).not.toBeInTheDocument();
        expect(screen.queryByText('Cinema')).not.toBeInTheDocument();
    });

    it('resets to all expenses when "All Categories" is selected', async () => {
        const user = userEvent.setup();
        render(
            <TestWrapper
                expenses={mockExpenses}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        const [, categorySelect] = screen.getAllByRole('combobox');

        // First filter to Food
        await user.click(categorySelect);
        await user.click(await screen.findByRole('option', { name: 'Food' }));
        expect(screen.queryByText('Rent')).not.toBeInTheDocument();

        // Then reset to All Categories
        await user.click(categorySelect);
        await user.click(await screen.findByRole('option', { name: 'All Categories' }));

        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
        expect(screen.getByText('Cinema')).toBeInTheDocument();
    });

    it('applies both month and category filters together', async () => {
        const user = userEvent.setup();
        const expenses: Expense[] = [
            { id: '1', description: 'Groceries', amount: 50, category: 'Food', date: '2023-10-01' },
            { id: '2', description: 'Lunch', amount: 20, category: 'Food', date: '2023-09-10' },
            { id: '3', description: 'Rent', amount: 1000, category: 'Bills', date: '2023-10-05' },
        ];

        render(
            <TestWrapper
                expenses={expenses}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                currency={mockCurrency}
            />
        );

        const [monthSelect, categorySelect] = screen.getAllByRole('combobox');

        // Filter by October
        await user.click(monthSelect);
        await user.click(await screen.findByText('Oct 2023'));

        // Filter by Food
        await user.click(categorySelect);
        await user.click(await screen.findByRole('option', { name: 'Food' }));

        // Only October + Food matches
        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.queryByText('Lunch')).not.toBeInTheDocument();   // September Food
        expect(screen.queryByText('Rent')).not.toBeInTheDocument();    // October Bills
    });

    it('calls onEditExpense when edit button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <TestWrapper
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
            <TestWrapper
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

    describe('Pagination', () => {
        const buildExpense = (id: string, date: string, description: string): Expense => ({
            id,
            date,
            amount: 10,
            category: 'Food',
            description,
        });

        // 12 expenses with distinct dates so sorting is deterministic
        const twelveExpenses: Expense[] = Array.from({ length: 12 }, (_, i) => {
            const day = String(12 - i).padStart(2, '0');
            return buildExpense(String(i + 1), `2023-10-${day}T00:00:00.000Z`, `Expense ${i + 1}`);
        });

        it('Previous button is disabled on the first page', () => {
            render(
                <TestWrapper
                    expenses={twelveExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            const prevButton = screen.getByRole('button', { name: /Previous page/i });
            expect(prevButton).toBeDisabled();
        });

        it('Next button is disabled on the last page when all items fit on one page', () => {
            render(
                <TestWrapper
                    expenses={mockExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            const nextButton = screen.getByRole('button', { name: /Next page/i });
            expect(nextButton).toBeDisabled();
        });

        it('Next button is enabled when there are more pages', () => {
            render(
                <TestWrapper
                    expenses={twelveExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            const nextButton = screen.getByRole('button', { name: /Next page/i });
            expect(nextButton).not.toBeDisabled();
        });

        it('navigates to the next page and Previous button becomes enabled', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper
                    expenses={twelveExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            // Page 1: first 10 items visible
            expect(screen.getByText('Expense 1')).toBeInTheDocument();
            expect(screen.queryByText('Expense 11')).not.toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /Next page/i }));

            // Page 2: remaining 2 items visible
            expect(screen.getByText('Expense 11')).toBeInTheDocument();
            expect(screen.getByText('Expense 12')).toBeInTheDocument();
            expect(screen.queryByText('Expense 1')).not.toBeInTheDocument();

            // Previous button should now be enabled
            expect(screen.getByRole('button', { name: /Previous page/i })).not.toBeDisabled();
        });

        it('navigates back to the first page via Previous button', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper
                    expenses={twelveExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            await user.click(screen.getByRole('button', { name: /Next page/i }));
            expect(screen.getByText('Expense 11')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /Previous page/i }));

            // Back on page 1
            expect(screen.getByText('Expense 1')).toBeInTheDocument();
            expect(screen.queryByText('Expense 11')).not.toBeInTheDocument();

            // Previous button disabled again
            expect(screen.getByRole('button', { name: /Previous page/i })).toBeDisabled();
        });

        it('Next button is disabled on the last page after navigating there', async () => {
            const user = userEvent.setup();
            render(
                <TestWrapper
                    expenses={twelveExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            await user.click(screen.getByRole('button', { name: /Next page/i }));

            expect(screen.getByRole('button', { name: /Next page/i })).toBeDisabled();
        });

        it('resets to page 1 when the month filter changes', async () => {
            const user = userEvent.setup();
            const multiMonthExpenses: Expense[] = [
                ...twelveExpenses,
                // Add some expenses for a different month to ensure the month selector has options
                buildExpense('13', '2023-09-01T00:00:00.000Z', 'September Expense'),
            ];

            render(
                <TestWrapper
                    expenses={multiMonthExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            // Navigate to page 2
            await user.click(screen.getByRole('button', { name: /Next page/i }));
            expect(screen.queryByText('Expense 1')).not.toBeInTheDocument();

            // Change month filter
            const [monthSelect] = screen.getAllByRole('combobox');
            await user.click(monthSelect);
            await user.click(await screen.findByText('Oct 2023'));

            // Should be back on page 1
            expect(screen.getByText('Expense 1')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Previous page/i })).toBeDisabled();
        });

        it('total count and amount reflect all filtered expenses, not just the current page', () => {
            render(
                <TestWrapper
                    expenses={twelveExpenses}
                    currency={mockCurrency}
                    pageSize={10}
                />
            );

            // 12 transactions total even though only 10 are shown
            expect(screen.getByText('12 transactions')).toBeInTheDocument();
        });
    });
});
