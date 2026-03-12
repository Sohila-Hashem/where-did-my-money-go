import { render, screen } from '@testing-library/react';
import { CustomCategoriesManager } from '../custom-categories-manager';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useCustomCategories } from '@/hooks/use-custom-categories';

vi.mock('@/hooks/use-custom-categories', () => ({
    useCustomCategories: vi.fn(),
}));

describe('CustomCategoriesManager', () => {
    const mockAdd = vi.fn();
    const mockRemove = vi.fn();
    const mockUpdate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useCustomCategories as Mock).mockReturnValue({
            customCategories: ['Category 1', 'Category 2'],
            add: mockAdd,
            remove: mockRemove,
            update: mockUpdate,
        });
    });

    it('renders empty state when there are no custom categories', () => {
        (useCustomCategories as Mock).mockReturnValue({
            customCategories: [],
            add: mockAdd,
            remove: mockRemove,
            update: mockUpdate,
        });
        render(<CustomCategoriesManager />);
        expect(screen.getByText(/No custom categories yet/i)).toBeInTheDocument();
    });

    it('renders the list of custom categories', () => {
        render(<CustomCategoriesManager />);
        expect(screen.getByText('Category 1')).toBeInTheDocument();
        expect(screen.getByText('Category 2')).toBeInTheDocument();
        // Check that "Total: 2" appears exactly once
        const totalElements = screen.getAllByText(/Total: 2/i);
        expect(totalElements).toHaveLength(1);
    });

    it('starts editing when pencil icon is clicked', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        // Find edit button for Category 1
        // The button has aria-label="Edit Category 1 category"
        const editButton = screen.getByLabelText(/Edit Category 1 category/i);
        await user.click(editButton);

        // Input should appear with current value
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('Category 1');
    });

    it('shows error when resetting to empty name during edit', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        const input = screen.getByRole('textbox');

        await user.clear(input);
        await user.click(screen.getByLabelText(/Save category name/i));

        expect(screen.getByText(/Category name cannot be empty/i)).toBeInTheDocument();
    });

    it('submits updated name and calls onUpdateCustomCategory', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        const input = screen.getByRole('textbox');

        await user.clear(input);
        await user.type(input, 'Updated Category');
        await user.click(screen.getByLabelText(/Save category name/i));

        expect(mockUpdate).toHaveBeenCalledWith('Category 1', 'Updated Category');
    });

    it('cancels editing when X icon is clicked', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        expect(screen.getByRole('textbox')).toBeInTheDocument();

        await user.click(screen.getByLabelText(/Cancel editing/i));
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('opens delete dialog and confirms deletion', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        // Click delete for Category 1
        await user.click(screen.getByLabelText(/Delete Category 1 category/i));

        // Check if dialog is open (looking for its content)
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
        expect(screen.getByText(/"Category 1"/i)).toBeInTheDocument();
        expect(screen.getByText(/NOT/)).toBeInTheDocument();
        expect(screen.getByText(/affect any existing expenses/i)).toBeInTheDocument();

        // Click confirm in dialog - role 'button' with name 'Delete'
        // Note: There are two 'Delete' buttons now: one in the list (Trash2 icon) and one in the dialog.
        // We need to be specific.
        const confirmButton = screen.getByRole('button', { name: /^Delete$/i });
        await user.click(confirmButton);

        expect(mockRemove).toHaveBeenCalledWith('Category 1');
    });

    it('opens add dialog and adds a new category', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        // Click 'Add custom category' button (trigger)
        await user.click(screen.getByLabelText(/Add custom category/i));

        // Check if dialog is open
        expect(screen.getByPlaceholderText(/Hobbies/i)).toBeInTheDocument();

        const input = screen.getByPlaceholderText(/Hobbies/i);
        await user.type(input, 'New Category');

        // Click 'Add Category' button in dialog (the submit button)
        await user.click(screen.getByRole('button', { name: /^Add Category$/i }));

        expect(mockAdd).toHaveBeenCalledWith('New Category');
    });

    it('saving with the same name is a no-op and collapses the edit row', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        // Do NOT change anything in the input – the value is already 'Category 1'
        await user.click(screen.getByLabelText(/Save category name/i));

        expect(mockUpdate).not.toHaveBeenCalled();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('clears the edit error when the user types in the edit input', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        // Trigger the error by saving an empty input
        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.click(screen.getByLabelText(/Save category name/i));
        expect(screen.getByText(/Category name cannot be empty/i)).toBeInTheDocument();

        // Start typing – error should disappear
        await user.type(input, 'A');
        expect(screen.queryByText(/Category name cannot be empty/i)).not.toBeInTheDocument();
    });

    it('saves the edit when Enter is pressed inside the input', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.type(input, 'Renamed{Enter}');

        expect(mockUpdate).toHaveBeenCalledWith('Category 1', 'Renamed');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('cancels the edit when Escape is pressed inside the input', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        expect(screen.getByRole('textbox')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('closes delete dialog without deleting when dialog is dismissed', async () => {
        const user = userEvent.setup();
        render(<CustomCategoriesManager />);

        // Open delete dialog
        await user.click(screen.getByLabelText(/Delete Category 1 category/i));
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

        // Click the Cancel button inside the dialog
        await user.click(screen.getByRole('button', { name: /^Cancel$/i }));

        expect(mockRemove).not.toHaveBeenCalled();
        expect(screen.queryByText(/Are you sure you want to delete/i)).not.toBeInTheDocument();
    });

    it('calls the provided onUpdateCustomCategory function instead of the hook function', async () => {
        const user = userEvent.setup();
        const customOnUpdate = vi.fn();
        render(<CustomCategoriesManager onUpdateCustomCategory={customOnUpdate} />);

        await user.click(screen.getByLabelText(/Edit Category 1 category/i));
        const input = screen.getByRole('textbox');

        await user.clear(input);
        await user.type(input, 'New Category Name');
        await user.click(screen.getByLabelText(/Save category name/i));

        expect(customOnUpdate).toHaveBeenCalledWith('Category 1', 'New Category Name');
        expect(mockUpdate).not.toHaveBeenCalled();
    });
});
