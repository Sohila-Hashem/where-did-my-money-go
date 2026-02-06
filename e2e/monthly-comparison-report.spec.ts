
import { test, expect } from '@playwright/test';
import { format, subMonths } from 'date-fns';

test.describe('Monthly Comparison Report', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Clear local storage and reload to ensure clean state
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Ensure we are using USD for tests (some tests check for '$')
        await page.getByRole('combobox').first().click();
        await page.getByRole('option', { name: 'US Dollar' }).click();
    });

    test('should generate a comparison report for two consecutive months', async ({ page }) => {
        // 1. Seed data
        const currentMonth = new Date();
        const previousMonth = subMonths(currentMonth, 1);
        const currentMonthLabel = format(currentMonth, 'MMMM yyyy');
        const previousMonthLabel = format(previousMonth, 'MMMM yyyy');

        // Helper to add expense
        const addExpense = async (desc: string, amount: string, isPreviousMonth: boolean) => {
            // Fill Description
            await page.getByLabel('Description').fill(desc);
            // Fill Amount
            await page.getByLabel('Amount').fill(amount);

            // Select Category
            await page.getByRole('combobox', { name: 'Category' }).click();
            await page.getByRole('option', { name: 'Food' }).click(); // Assuming 'Food' exists

            // Select Date
            await page.getByLabel('Date').click();
            if (isPreviousMonth) {
                const prevMonthButton = page.getByLabel('Go to the Previous Month'); // aria-label from the Shadcn Calendar component
                await prevMonthButton.click();
                // Wait for the calendar to update to the previous month
                await expect(page.getByText(previousMonthLabel)).toBeVisible();
            }
            // Pick a day (e.g., 15th)
            const calendar = page.getByRole('grid');
            await expect(calendar).toBeVisible();
            await calendar.getByText('15', { exact: true }).click();

            // Submit
            await page.getByRole('button', { name: 'Add Expense' }).click();

            // Verify and simple wait for toast/modal or list update
            await expect(page.getByText(desc)).toBeVisible();
        };

        // Add expense for current month ($150)
        await addExpense('Current Month Expense', '150', false);

        // Add expense for previous month ($100)
        await addExpense('Previous Month Expense', '100', true);

        // 2. Interact with Comparison Component
        const compareCard = page.getByRole('region', { name: "Monthly Comparison" });

        // Select the current month
        const selectTrigger = compareCard.getByRole('combobox');
        await selectTrigger.click();

        // Select the option for the current month
        await page.getByRole('option', { name: currentMonthLabel }).click();

        // Click Compare button
        await compareCard.getByRole('button', { name: 'Compare' }).click();

        // 3. Verify Report Content
        // Wait for loading to start and finish
        await expect(compareCard.getByText('Crunching the numbers...')).toBeHidden({ timeout: 10000 });

        // Use getByLabel for better accessibility matching
        const reportArea = compareCard.getByLabel('Comparison Report');
        await expect(reportArea).toBeVisible();

        const reportText = await reportArea.innerText();

        expect(reportText).toContain('Month Comparison');
        expect(reportText).toContain('This month: $150');
        expect(reportText).toContain('Last month: $100');
        expect(reportText).toContain('Difference: +$50');
        expect(reportText).toContain('You spent 50.0% MORE than last month');
        expect(reportText).toContain('Whoa there, big spender!');
    });

    test('should handle case with no previous month data', async ({ page }) => {
        const currentMonth = new Date();
        const currentMonthLabel = format(currentMonth, 'MMMM yyyy');

        // Add expense ONLY for current month
        await page.getByPlaceholder('Coffee at local cafe').fill('Only Current Expense');
        await page.getByPlaceholder('0.00').fill('200');
        await page.getByRole('combobox', { name: 'Category' }).click();
        await page.getByRole('option', { name: 'Food' }).click(); // Assuming 'Food' exists

        await page.getByLabel('Date').click();
        const calendar = page.getByRole('grid');
        await expect(calendar).toBeVisible();
        await calendar.getByText('15', { exact: true }).click();

        await page.getByRole('button', { name: 'Add Expense' }).click();
        await expect(page.getByText('Only Current Expense')).toBeVisible();

        // Interact with Comparison Component
        const compareCard = page.locator('.space-y-4', { has: page.getByRole('heading', { name: 'Compare Months' }) });

        const selectTrigger = compareCard.getByRole('combobox');
        await selectTrigger.click();
        await page.getByRole('option', { name: currentMonthLabel }).click();

        await compareCard.getByRole('button', { name: 'Compare' }).click();

        // Verify Report
        await expect(compareCard.getByText('Crunching the numbers...')).toBeHidden({ timeout: 10000 });

        const reportArea = compareCard.getByLabel('Comparison Report');
        await expect(reportArea).toBeVisible();
        const reportText = await reportArea.innerText();

        expect(reportText).toContain('This month: $200');
        expect(reportText).toContain('Last month: $0');
        expect(reportText).toContain('Difference: +$200');
        expect(reportText).toContain('Pretty much the same as last month!');
    });

    test('should handle empty state with no expenses at all', async ({ page }) => {
        // 1. Locate the card securely
        // We look for a container that has the heading "Compare Months"
        const compareCard = page.getByRole('region', { name: "Monthly Comparison" });

        // Ensure card is visible first (handling animation)
        await expect(compareCard).toBeVisible();

        const selectTrigger = compareCard.getByRole('combobox');

        // 2. Interact with dropdown
        await selectTrigger.click();

        // Should see "No expenses yet" disabled item
        const noExpensesItem = page.getByRole('option', { name: 'No expenses yet' });
        await expect(noExpensesItem).toBeVisible();
        await expect(noExpensesItem).toBeDisabled();

        // 3. Close dropdown to ensure no interference
        await page.keyboard.press('Escape');

        // 4. Ensure "Compare" button is disabled
        const compareButton = compareCard.getByRole('button', { name: 'Compare' });
        await expect(compareButton).toBeVisible();
        await expect(compareButton).toBeDisabled();
    });
});
