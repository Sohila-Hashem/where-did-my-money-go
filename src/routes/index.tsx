import { CreateExpenseForm } from "@/components/create-expense-form";
import { ExpensesList } from "@/components/expenses-list";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Expense } from "@/domain/expense";
import { deleteExpense, loadExpenses, saveExpense } from "@/utils/storage";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [expenses, setExpenses] = useState<Expense[]>(loadExpenses());
	
	const currentMonthIndex = useMemo(() => new Date().getMonth(), []);
	const monthNames = useMemo(
		() => [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		],
		[]
	);

	const onNewExpense = (newExpense: Expense) => {
		setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
		saveExpense(newExpense);
	};

	const onDeleteExpense = (id: string) => {
		setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
		deleteExpense(id);
	};

	return (
		<main className="flex flex-col items-center justify-center gap-10 w-screen h-screen p-4 bg-background">
			<div className="flex flex-col items-center justify-center gap-2">
				<h1 className="text-primary font-bold text-2xl">Where did you spend your money?</h1>
				<p className="font-medium text-lg text-muted-foreground">
					I will tell you where the hack did you spend most of your money!
				</p>
			</div>
			<div className="grid place-items-center grid-cols-2 gap-8 w-full max-w-6xl">
				<div className="w-full flex flex-col gap-5">
					<Select defaultValue={monthNames[currentMonthIndex]}>
						<SelectTrigger className="w-full bg-accent rounded-xl">
							<SelectValue placeholder="Select a Month" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Select a Month</SelectLabel>
								{monthNames.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<ExpensesList expenses={expenses} onDeleteExpense={onDeleteExpense} />
					{expenses.length > 0 && (
						<Button className="w-full cursor-pointer">Generate Report</Button>
					)}
				</div>
				<CreateExpenseForm onNewExpense={onNewExpense} />
			</div>
		</main>
	);
}
