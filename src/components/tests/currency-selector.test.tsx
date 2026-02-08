import { render, screen } from '@testing-library/react';
import { CurrencySelector } from '@/components/currency-selector';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CURRENCIES } from '@/lib/constants';

// Mock Pointer Events for Radix UI
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.scrollIntoView = vi.fn();


describe('CurrencySelector', () => {
    const mockCurrency = CURRENCIES[0]; // USD
    const onCurrencyChange = vi.fn();

    it('renders with the current currency', () => {
        render(<CurrencySelector currency={mockCurrency} onCurrencyChange={onCurrencyChange} />);
        // The select trigger should display the current currency code or part of it
        // Radix UI Select typically renders the value in a span
        expect(screen.getByText(new RegExp(mockCurrency.code))).toBeInTheDocument();
    });


    it('opens the dropdown and allows changing currency', async () => {
        const user = userEvent.setup();
        render(<CurrencySelector currency={mockCurrency} onCurrencyChange={onCurrencyChange} />);

        const trigger = screen.getByRole('combobox', { name: /Currency/i });
        await user.click(trigger);

        // Find another currency to click, e.g., EUR
        const eurOption = await screen.findByRole('option', { name: /Euro/i });
        await user.click(eurOption);

        expect(onCurrencyChange).toHaveBeenCalledWith(expect.objectContaining({ code: 'EUR' }));
    });

    it('shows all supported currencies in the dropdown', async () => {
        const user = userEvent.setup();
        render(<CurrencySelector currency={mockCurrency} onCurrencyChange={onCurrencyChange} />);

        const trigger = screen.getByRole('combobox', { name: /Currency/i });
        await user.click(trigger);

        for (const currency of CURRENCIES) {
            // Using regex because the text might contain symbol + code + name
            // e.g. "E£ EGP - Egyptian Pound"
            // We just check if the code is present in the options
            const option = await screen.findByRole('option', { name: new RegExp(currency.code) });
            expect(option).toBeInTheDocument();
        }
    });
});

