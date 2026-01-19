import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Expense, SupportedCurrencies } from "@/domain/expense";
import { Trash2, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";

interface ExpensesListProps {
	expenses: Expense[];
	preferredCurrency?: SupportedCurrencies;
	onDeleteExpense: (id: string) => void;
}
export const ExpensesList = ({
	expenses,
	onDeleteExpense,
	preferredCurrency,
}: ExpensesListProps) => {
	const totalExpenses = useMemo(() => {
		return expenses.reduce((sum, expense) => sum + expense.amount, 0);
	}, [expenses]);
	return (
		<ScrollArea className="h-110 w-full rounded-lg border bg-accent p-4 shadow-sm">
			{expenses.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 ">
					<Wallet className="text-muted-foreground" size={60} />
					<p className="text-center text-muted-foreground">No expenses recorded yet.</p>
				</div>
			) : (
				<Table className="text-primary">
					<TableCaption>A list of your recent expenses.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Description</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Category</TableHead>
							<TableHead className="text-right">Amount</TableHead>
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{expenses.map((expense) => (
							<TableRow key={expense.id}>
								<TableCell className="text-start">{expense.description}</TableCell>
								<TableCell className="text-start">{expense.date}</TableCell>
								<TableCell className="text-start">{expense.category}</TableCell>
								<TableCell className="text-right">
									{formatCurrency(expense.amount, preferredCurrency)}
								</TableCell>
								<TableCell className="text-right">
									{
										<Button
											className="cursor-pointer"
											variant={"destructive"}
											size={"icon-sm"}
											onClick={() => onDeleteExpense(expense.id)}
										>
											<Trash2 className="w-2 h-2" />
										</Button>
									}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={3}>Total</TableCell>
							<TableCell className="text-right">
								{formatCurrency(totalExpenses, preferredCurrency)}
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			)}
		</ScrollArea>
	);
};
