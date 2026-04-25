import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseDataActions } from '../expense-data-actions';
import * as api from '@/api/expenses';
import { toast } from 'sonner';

vi.mock('@/api/expenses', () => ({
    exportExpenses: vi.fn(),
    importExpenses: vi.fn(),
    ImportMode: {
        MERGE: 'merge',
        OVERWRITE: 'overwrite'
    }
}));

vi.mock('sonner', () => ({
    toast: {
        promise: vi.fn((promise, _data) => promise),
        loading: vi.fn().mockReturnValue('loading-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ExpenseDataActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders import and export buttons', () => {
        render(<ExpenseDataActions />);
        expect(screen.getByText('Import CSV')).toBeInTheDocument();
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('calls exportExpenses when Export CSV is clicked', async () => {
        vi.mocked(api.exportExpenses).mockResolvedValue({ success: true });
        render(<ExpenseDataActions />);

        fireEvent.click(screen.getByText('Export CSV'));

        expect(api.exportExpenses).toHaveBeenCalled();
        expect(toast.promise).toHaveBeenCalled();
    });

    it('opens dialog when a file is selected', async () => {
        const { container } = render(<ExpenseDataActions />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        const file = new File(['csv content'], 'test.csv', { type: 'text/csv' });
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('Import Expenses')).toBeInTheDocument();
        expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    it('calls importExpenses when dialog is confirmed', async () => {
        vi.mocked(api.importExpenses).mockResolvedValue({ success: true, count: 5, skippedCount: 0, errors: [] });
        const onImportSuccess = vi.fn();

        const { container } = render(<ExpenseDataActions onImportSuccess={onImportSuccess} />);

        // Select file
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['csv content'], 'test.csv', { type: 'text/csv' });
        fireEvent.change(input, { target: { files: [file] } });

        // Confirm dialog
        fireEvent.click(screen.getByText('Start Import'));

        await waitFor(() => {
            expect(api.importExpenses).toHaveBeenCalledWith(file, expect.any(Object));
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Import complete!'), expect.any(Object));
            expect(onImportSuccess).toHaveBeenCalled();
        });
    });

    it('shows error toast if import fails', async () => {
        vi.mocked(api.importExpenses).mockResolvedValue({ error: 'Bad file' });

        const { container } = render(<ExpenseDataActions />);

        // Select file
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['csv content'], 'test.csv', { type: 'text/csv' });
        fireEvent.change(input, { target: { files: [file] } });

        // Confirm dialog
        fireEvent.click(screen.getByText('Start Import'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Bad file', expect.any(Object));
        });
    });

    it('shows skipped rows message in success toast', async () => {
        vi.mocked(api.importExpenses).mockResolvedValue({ success: true, count: 5, skippedCount: 2, errors: [] });

        const { container } = render(<ExpenseDataActions />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['csv'], 'test.csv');
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByText('Start Import'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                'Import complete!',
                expect.objectContaining({
                    description: expect.stringContaining('Skipped 2 invalid rows')
                })
            );
        });
    });

    it('throws error in success callback if data has error (export)', async () => {
        vi.mocked(api.exportExpenses).mockResolvedValue({ error: 'Export failed' });
        render(<ExpenseDataActions />);

        fireEvent.click(screen.getByText('Export CSV'));

        // toast.promise handles the success/error callbacks
        const promiseCall = vi.mocked(toast.promise).mock.calls[0];
        const successCallback = (promiseCall[1] as any).success;

        expect(() => successCallback({ error: 'Export failed' })).toThrow('Export failed');
        expect(successCallback({ success: true })).toBe('Expenses exported successfully!');
    });

    it('handles unexpected errors during import', async () => {
        vi.mocked(api.importExpenses).mockRejectedValue(new Error('Unexpected Crash'));

        const { container } = render(<ExpenseDataActions />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['csv content'], 'test.csv', { type: 'text/csv' });
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByText('Start Import'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred during import.', expect.any(Object));
        });
    });

    it('shows default error message if result.error is missing', async () => {
        vi.mocked(api.importExpenses).mockResolvedValue({ error: '' });

        const { container } = render(<ExpenseDataActions />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['csv'], 'test.csv');
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByText('Start Import'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Import failed', expect.any(Object));
        });
    });

    it('works without onImportSuccess callback', async () => {
        vi.mocked(api.importExpenses).mockResolvedValue({ success: true, count: 1, skippedCount: 0, errors: [] });

        const { container } = render(<ExpenseDataActions />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['csv'], 'test.csv');
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByText('Start Import'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalled();
        });
    });
});
