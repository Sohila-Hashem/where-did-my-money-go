import { render, screen } from '@testing-library/react';
import { ModeToggle } from '@/components/mode-toggle';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock next-themes
const setThemeMock = vi.fn();
vi.mock('next-themes', () => ({
    useTheme: () => ({
        setTheme: setThemeMock,
    }),
}));

describe('ModeToggle', () => {
    beforeEach(() => {
        setThemeMock.mockClear();
    });

    it('renders the toggle button', () => {
        render(<ModeToggle />);
        expect(screen.getByRole('button', { name: /Toggle theme/i })).toBeInTheDocument();
    });

    it('opens menu and selects Light theme', async () => {
        const user = userEvent.setup();
        render(<ModeToggle />);

        const button = screen.getByRole('button', { name: /Toggle theme/i });
        await user.click(button);

        const lightOption = screen.getByRole('menuitem', { name: /Light/i });
        await user.click(lightOption);

        expect(setThemeMock).toHaveBeenCalledWith('light');
    });

    it('opens menu and selects Dark theme', async () => {
        const user = userEvent.setup();
        render(<ModeToggle />);

        const button = screen.getByRole('button', { name: /Toggle theme/i });
        await user.click(button);

        const darkOption = screen.getByRole('menuitem', { name: /Dark/i });
        await user.click(darkOption);

        expect(setThemeMock).toHaveBeenCalledWith('dark');
    });

    it('opens menu and selects System theme', async () => {
        const user = userEvent.setup();
        render(<ModeToggle />);

        const button = screen.getByRole('button', { name: /Toggle theme/i });
        await user.click(button);

        const systemOption = screen.getByRole('menuitem', { name: /System/i });
        await user.click(systemOption);

        expect(setThemeMock).toHaveBeenCalledWith('system');
    });
});
