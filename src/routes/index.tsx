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
import { generateMonthlyExplanation, getMonthlySummary, type ExplanationItem } from "@/domain/aggregate";
import { ExpenseCurrencyEnum, type Expense, type SupportedCurrencies } from "@/domain/expense";
import {
	deleteExpense,
	loadExpenses,
	loadPreferredCurrency,
	saveExpense,
	savePreferredCurrency,
} from "@/utils/storage";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { SummeryExplanationDialog } from "@/components/summery-explanation-dialog";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const currentMonthIndex = new Date().getMonth();
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
		[],
	);

	const [expenses, setExpenses] = useState<Expense[]>(loadExpenses());
	const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrencies>(
		loadPreferredCurrency() || ExpenseCurrencyEnum.EGP,
	);
	const [selectedMonth, setSelectedMonth] = useState<string>(monthNames[currentMonthIndex]);
	const [summeryExplanation, setSummeryExplanation] = useState<ExplanationItem[]>([]);


	const onNewExpense = (newExpense: Expense) => {
		setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
		saveExpense(newExpense);
	};

	const onDeleteExpense = (id: string) => {
		setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
		deleteExpense(id);
	};

	const getSelectedMonthExpenses = useCallback((month: string) => {
		const selectedMonthIndex = monthNames.indexOf(month);
		const filteredExpenses = expenses.filter((expense) => {
			const expenseDate = new Date(expense.date);
			return expenseDate.getMonth() === selectedMonthIndex;
		});
		return filteredExpenses;
	}, [expenses, monthNames]);

	const onMonthChange = (month: string) => {
		setSelectedMonth(month);
	};

	const onCurrencyChange = (currency: SupportedCurrencies) => {
		setPreferredCurrency(currency);
		savePreferredCurrency(currency);
	};

	const generateMonthSummeryExplanation = (month: string) => {
		const summery = getMonthlySummary(expenses, month);
		const summeryExplanation = generateMonthlyExplanation(summery, preferredCurrency);
		setSummeryExplanation(summeryExplanation);
	};

	return (
		<main className="flex flex-col items-center justify-center gap-5 md:gap-10 w-screen min-h-screen p-4 py-10 bg-background">
			{summeryExplanation.length > 0 && (
				<SummeryExplanationDialog
					onClose={() => setSummeryExplanation([])}
					summeryExplanation={summeryExplanation}
				/>
			)}
			<div className="flex flex-col items-center justify-center gap-2">
				<h1 className="text-primary font-bold text-2xl text-center">Where did you spend your money?</h1>
				<p className="font-medium text-lg text-muted-foreground text-center">
					I will tell you where the hack did you spend most of your money!
				</p>
			</div>
			<div className="grid place-items-center grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
				<div className="w-full flex flex-col gap-5">
					<div className="grid grid-cols-2 gap-2 justify-center items-center">
						<Select defaultValue={monthNames[currentMonthIndex]} onValueChange={onMonthChange}>
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
						<Select value={preferredCurrency} onValueChange={onCurrencyChange}>
							<SelectTrigger className="w-full bg-accent rounded-xl">
								<SelectValue placeholder="Select a Currency" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Select a Currency</SelectLabel>
									{Object.values(ExpenseCurrencyEnum).map((currency) => (
										<SelectItem key={currency} value={currency}>
											{currency}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<ExpensesList
						expenses={getSelectedMonthExpenses(selectedMonth)}
						onDeleteExpense={onDeleteExpense}
						preferredCurrency={preferredCurrency}
					/>
					{getSelectedMonthExpenses(selectedMonth).length > 0 && selectedMonth ? (
						<Button
							className="w-full cursor-pointer"
							onClick={(_e) => generateMonthSummeryExplanation(selectedMonth)}
						>
							Generate Report
						</Button>
					) : null}
				</div>
				<CreateExpenseForm onNewExpense={onNewExpense} />
			</div>
		</main>
	);
}
