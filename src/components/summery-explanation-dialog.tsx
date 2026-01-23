interface SummeryExplanationDialogProps {
	onClose: () => void;
	summeryExplanation: ExplanationItem[];
}

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ExplanationItem } from "@/domain/aggregate";
import { useState } from "react";

export function SummeryExplanationDialog({
	onClose,
	summeryExplanation,
}: SummeryExplanationDialogProps) {
	const [open, setOpen] = useState(true);
	const onOpenChange = (open: boolean) => {
		if (!open) {
			onClose();
		}
		setOpen(open);
	};
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-106.25">
				<DialogHeader>
					<DialogTitle>Summery</DialogTitle>
					<ul className="list-disc pl-5 space-y-2">
						{summeryExplanation.map((item) => (
							<li key={item.id}><DialogDescription>{item.text}</DialogDescription></li>
						))}
					</ul>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Yes, I know!</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button>Ok, i will remember</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
