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
import { ExpenseCurrencyEnum, getFilteredExpenses, type Expense, type SupportedCurrencies } from "@/domain/expense";
import {
	deleteExpense,
	loadExpenses,
	loadPreferredCurrency,
	saveExpense,
	savePreferredCurrency,
} from "@/utils/storage";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SummeryExplanationDialog } from "@/components/summery-explanation-dialog";
import { compareMonths, generateComparisonExplanation } from "@/domain/compare";
import { MonthComparisonExplanationDialog } from "@/components/month-comparison-eplanation-dialog";
import { MONTHS } from "@/lib/cosntants";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleAlert } from "lucide-react";
import { canGenerateComparisonReport, canGenerateReport } from "@/lib/permissions.";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	// * state
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
	const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
	const [summeryExplanation, setSummeryExplanation] = useState<ExplanationItem[]>([]);
	const [monthComparisonExplanation, setMonthComparisonExplanation] = useState<ExplanationItem[]>([]);

	// * helpers
	const currentMonthIndex = selectedMonth ? MONTHS.indexOf(selectedMonth) : undefined;
	const previousMonthIndex = currentMonthIndex && currentMonthIndex - 1
	const previousMonth = previousMonthIndex !== undefined ? MONTHS[previousMonthIndex] : undefined

	// * handlers
	const onNewExpense = (newExpense: Expense) => {
		setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
		saveExpense(newExpense);
	};

	const onDeleteExpense = (id: string) => {
		setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
		deleteExpense(id);
	};

	const onMonthChange = (month: string) => {
		if (month === 'all') {
			setSelectedMonth(undefined);
			return;
		}
		setSelectedMonth(month);
	};

	const onCurrencyChange = (currency: SupportedCurrencies) => {
		setPreferredCurrency(currency);
		savePreferredCurrency(currency);
	};

	const onGenerateReport = (month: string) => {
		const { isValid, message } = canGenerateReport(month, expenses);
		if (!isValid) {
			toast.info(message || "You have no data for the selected month. Start by adding expenses for the selected month.");
			return;
		}
		generateMonthSummeryExplanation(month);
	};

	const onGenerateComparisonReport = (month: string, previousMonth: string | undefined) => {
		const { isValid, message } = canGenerateComparisonReport(month, expenses);
		if (!isValid) {
			toast.info(message || "You have no data for the selected month. Start by adding expenses for the selected month.");
			return;
		}
		generateMonthComparisonExplanation(month, previousMonth);
	};

	const generateMonthSummeryExplanation = (month: string) => {
		const filteredMonthExpenses = getFilteredExpenses(month, expenses);
		const summery = getMonthlySummary(filteredMonthExpenses, month);
		const summeryExplanation = generateMonthlyExplanation(summery, preferredCurrency);
		setSummeryExplanation(summeryExplanation);
	};

	const generateMonthComparisonExplanation = (month: string, previousMonth: string | undefined) => {
		if (previousMonth === undefined) {
			toast.info("You have no data for the previous month. Start by adding expenses for the previous month.");
			return;
		}
		const previousMonthSummery = getMonthlySummary(getFilteredExpenses(previousMonth, expenses), previousMonth);
		const currentMonthSummery = getMonthlySummary(getFilteredExpenses(month, expenses), month);

		const comparisonExplanation = compareMonths(currentMonthSummery, previousMonthSummery);
		const explanation = generateComparisonExplanation(comparisonExplanation, preferredCurrency);
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
						<Select defaultValue="all" onValueChange={onMonthChange}>
							<SelectTrigger className="w-full bg-accent rounded-xl">
								<SelectValue placeholder="Select a Month" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Months</SelectLabel>
									<SelectItem value={"all"}>All Months</SelectItem>
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
						expenses={selectedMonth ? getFilteredExpenses(selectedMonth, expenses) : expenses}
						onDeleteExpense={onDeleteExpense}
						preferredCurrency={preferredCurrency}
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									onClick={(_e) => selectedMonth && onGenerateReport(selectedMonth)}>
									Generate Report
									{!canGenerateReport(selectedMonth, expenses) && <CircleAlert className="text-amber-400" />}
								</Button>
							</TooltipTrigger>
							{!canGenerateReport(selectedMonth, expenses) ? <TooltipContent>
								<p>Select a month and make sure there are expenses</p>
							</TooltipContent> : null}
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									onClick={(_e) => selectedMonth && onGenerateComparisonReport(selectedMonth, previousMonth)}
								>
									Compare with previous month
									{!canGenerateComparisonReport(selectedMonth, expenses) && <CircleAlert className="text-amber-400" />}
								</Button>
							</TooltipTrigger>
							{!canGenerateComparisonReport(selectedMonth, expenses) ? <TooltipContent>
								<p>Make sure you have expenses for the selected month and the previous month</p>
							</TooltipContent> : null}
						</Tooltip>
					</div>
				</div>
				<CreateExpenseForm onNewExpense={onNewExpense} />
			</div>
		</main>
	);
}
