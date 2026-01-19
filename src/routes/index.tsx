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
import { compareMonths, generateComparisonExplanation } from "@/domain/compare";
import { MonthComparisonExplanationDialog } from "@/components/month-comparison-eplanation-dialog";
import { MONTHS } from "@/lib/cosntants";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const currentMonthIndex = new Date().getMonth();
	const previousMonthIndex = currentMonthIndex - 1 < 0 ? 11 : currentMonthIndex - 1;
	const [expenses, setExpenses] = useState<Expense[]>(loadExpenses());
	const recordedMonths = useMemo(
		() => {
			const months = new Set<string>()
			expenses.forEach((expense) => months.add(MONTHS[new Date(expense.date).getMonth()]))
			return Array.from(months).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
		},
		[expenses],
	);

	const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrencies>(
		loadPreferredCurrency() || ExpenseCurrencyEnum.EGP,
	);
	const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[currentMonthIndex]);
	const [summeryExplanation, setSummeryExplanation] = useState<ExplanationItem[]>([]);
	const [monthComparisonExplanation, setMonthComparisonExplanation] = useState<ExplanationItem[]>([]);


	const onNewExpense = (newExpense: Expense) => {
		setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
		saveExpense(newExpense);
	};

	const onDeleteExpense = (id: string) => {
		setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
		deleteExpense(id);
	};

	const getFilteredExpenses = useCallback((month: string) => {
		const selectedMonthIndex = MONTHS.indexOf(month);
		const filteredExpenses = expenses.filter((expense) => {
			const expenseDate = new Date(expense.date);
			return expenseDate.getMonth() === selectedMonthIndex;
		});
		return filteredExpenses;
	}, [expenses]);

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

	const generateMonthComparisonExplanation = (month: string, previousMonth: string | undefined) => {
		if (previousMonth === undefined) {
			toast.info("You have no data for the previous month. Start by adding expenses for the previous month.");
			return;
		}
		const previousMonthSummery = getMonthlySummary(getFilteredExpenses(previousMonth), previousMonth);
		const currentMonthSummery = getMonthlySummary(getFilteredExpenses(month), month);

		const comparisonExplanation = compareMonths(currentMonthSummery, previousMonthSummery);
		const explanation = generateComparisonExplanation(comparisonExplanation);
		setMonthComparisonExplanation(explanation);
	};

	return (
		<main className="flex flex-col items-center justify-center gap-5 md:gap-10 w-screen min-h-screen p-4 py-10 bg-background">
			{summeryExplanation.length > 0 && (
				<SummeryExplanationDialog
					onClose={() => setSummeryExplanation([])}
					summeryExplanation={summeryExplanation}
				/>
			)}
			{monthComparisonExplanation.length > 0 && (
				<MonthComparisonExplanationDialog
					onClose={() => setMonthComparisonExplanation([])}
					monthComparisonExplanation={monthComparisonExplanation}
				/>
			)}
			<div className="flex flex-col items-center justify-center gap-2">
				<h1 className="text-primary font-bold text-2xl text-center">Where did you spend your money?</h1>
				<p className="font-medium text-lg text-muted-foreground text-center">
					I will tell you where the hack did you spend most of your money!
				</p>
			</div>
			<div className="grid place-items-center grid-cols-1 md:grid-cols-2 w-full max-w-6xl">
				<div className="w-full flex flex-col gap-5">
					<div className="grid grid-cols-2 gap-2 justify-center items-center">
						<Select defaultValue={MONTHS[currentMonthIndex]} onValueChange={onMonthChange}>
							<SelectTrigger className="w-full bg-accent rounded-xl">
								<SelectValue placeholder="Select a Month" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Months</SelectLabel>
									{recordedMonths.map((month) => (
										<SelectItem key={month} value={month}>
											{month}
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
									<SelectLabel>Currencies</SelectLabel>
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
						expenses={getFilteredExpenses(selectedMonth)}
						onDeleteExpense={onDeleteExpense}
						preferredCurrency={preferredCurrency}
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<Button
							className="cursor-pointer"
							disabled={!getFilteredExpenses(selectedMonth).length || !selectedMonth}
							onClick={(_e) => generateMonthSummeryExplanation(selectedMonth)}
						>
							Generate Report
						</Button>
						<Button
							className="cursor-pointer"
							disabled={!getFilteredExpenses(selectedMonth).length || !selectedMonth}
							onClick={(_e) => generateMonthComparisonExplanation(selectedMonth, MONTHS[previousMonthIndex])}
						>
							Compare with previous month
						</Button>
					</div>
				</div>
				<CreateExpenseForm onNewExpense={onNewExpense} />
			</div>
		</main>
	);
}
