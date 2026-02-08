import { render, act } from '@testing-library/react';
import { Confetti } from '@/components/confetti';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Confetti', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('renders nothing initially when trigger is false', () => {
        const { container } = render(<Confetti trigger={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders confetti pieces when trigger is true', () => {
        const { container } = render(<Confetti trigger={true} />);
        // It renders a div with class 'fixed inset-0...' and children
        // We can check if the container has a child
        expect(container.firstChild).toHaveClass('fixed inset-0');
        // It should render 30 pieces
        expect(container.firstChild?.childNodes.length).toBe(30);
    });

    it('cleans up after 3000ms', () => {
        const { container } = render(<Confetti trigger={true} />);
        expect(container).not.toBeEmptyDOMElement();

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(container).toBeEmptyDOMElement();
    });
});
