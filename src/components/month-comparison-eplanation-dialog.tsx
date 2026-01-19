import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type ExplanationItem } from "@/domain/aggregate";
import { useState } from "react";

interface MonthComparisonExplanationDialogProps {
    onClose: () => void;
    monthComparisonExplanation: ExplanationItem[];
}

export const MonthComparisonExplanationDialog = ({
    onClose,
    monthComparisonExplanation,
}: MonthComparisonExplanationDialogProps) => {
    const [open, setOpen] = useState(true);
    const onOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
        setOpen(open);
    };
    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Month Comparison Explanation</DialogTitle>
                    <ul className="list-disc pl-5 space-y-2 text-start">
                        {monthComparisonExplanation.map((item) => (
                            <li key={item.id}><DialogDescription>{item.text}</DialogDescription></li>
                        ))}
                    </ul>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};