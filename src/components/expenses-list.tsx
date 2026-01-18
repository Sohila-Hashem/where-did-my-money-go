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
import type { Expense } from "@/domain/expense";
import { Trash2, Wallet } from "lucide-react";
import { Button } from "./ui/button";

interface ExpensesListProps {
	expenses: Expense[];
    onDeleteExpense: (id: string) => void;
}
export const ExpensesList = ({ expenses, onDeleteExpense }: ExpensesListProps) => {
    
	return (
		<div className="w-full overflow-y-auto bg-accent p-4 rounded-lg shadow-lg">
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
							<TableHead className="w-55">Description</TableHead>
							<TableHead className="w-55">Date</TableHead>
							<TableHead className="w-55">Category</TableHead>
							<TableHead className="w-55 text-right">Amount</TableHead>
							<TableHead className="w-55"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{expenses.map((expense) => (
							<TableRow key={expense.id}>
								<TableCell className="text-start">{expense.description}</TableCell>
								<TableCell className="text-start">{expense.date}</TableCell>
								<TableCell className="text-start">{expense.category}</TableCell>
								<TableCell className="text-right">{expense.amount}</TableCell>
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
								{expenses.reduce((sum, expense) => sum + expense.amount, 0)}
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			)}
		</div>
	);
};
