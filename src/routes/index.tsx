import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { HeroSection } from "@/components/hero-section";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseTable } from "@/components/expense-table";
import { MonthlyReport } from "@/components/monthly-report";
import { MonthComparison } from "@/components/month-comparison";
import { Confetti } from "@/components/shared/confetti";
import { CustomCategoriesManager } from "@/components/custom-categories-manager";
import { FeaturesHighlight } from "@/components/features-highlight";
import { type Expense, EXPENSE_EXPORT_DATE_FORMAT } from "@/domain/expense";
import { format } from 'date-fns';
import { getAllExpenses, addExpense, editExpense, removeExpense, getExpensesPage, type ExpensesFilters } from '@/api/expenses';
import { v7 as uuid7 } from 'uuid';
import { useCustomCategories } from '@/hooks/use-custom-categories';
import { useCurrency } from '@/hooks/use-currency';
import { Footer } from '@/components/shared/footer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExpenseDataActions } from '@/components/expense-data-actions';

export const Route = createFileRoute('/')({
    component: HomePage,
})

function HomePage() {
    const { currency } = useCurrency();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
    const [showConfetti, setShowConfetti] = useState(false);

    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [cursors, setCursors] = useState<(string | null)[]>([null]);

    // Load from localStorage on mount
    useEffect(() => {
        setExpenses(getAllExpenses());
    }, []);


    const { update: hookUpdateCustomCategory, customCategories, refresh: refreshCustomCategories } = useCustomCategories();

    const filters: ExpensesFilters = {
        month: selectedMonth !== 'all' ? selectedMonth : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
    };

    const currentCursor = cursors[cursors.length - 1];

    const paginationResult = useMemo(
        () => getExpensesPage(filters, currentCursor),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [expenses, selectedMonth, selectedCategory, currentCursor]
    );

    const isFirstPage = cursors.length === 1;
    const isLastPage = !paginationResult.hasNextPage;

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month);
        setCursors([null]);
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCursors([null]);
    };

    const handleNextPage = () => {
        if (paginationResult.nextCursor !== null) {
            setCursors(prev => [...prev, paginationResult.nextCursor]);
        }
    };

    const handlePreviousPage = () => {
        setCursors(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    };

    const exportFileName = useMemo(() => {
        const dateSegment = selectedMonth !== "all" ? selectedMonth : format(new Date(), EXPENSE_EXPORT_DATE_FORMAT);
        let name = `expenses-${dateSegment}`;
        if (selectedCategory !== "all") name += `-${selectedCategory.replaceAll(/\s+/g, '_').toLowerCase()}`;
        return `${name}.csv`;
    }, [selectedMonth, selectedCategory]);

    const handleUpdateCustomCategory = (oldName: string, newName: string) => {
        hookUpdateCustomCategory(oldName, newName);
        setExpenses((prev) =>
            prev.map((exp) =>
                exp.category === oldName ? { ...exp, category: newName } : exp
            )
        );
    };

    const handleAddExpense = (expense: Omit<Expense, "id">) => {
        const newExpense: Expense = { ...expense, id: uuid7() };
        setExpenses(addExpense(newExpense));
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        toast.success("Expense added successfully!");
    };

    const handleUpdateExpense = (expense: Expense) => {
        setExpenses(editExpense(expense));
        setEditingExpense(undefined);
        toast.success("Expense updated successfully!");
    };

    const handleDeleteExpense = (id: string) => {
        setExpenses(removeExpense(id));
        toast.success("Expense deleted successfully!");
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        const element = document.getElementById("manage-expenses");
        element?.scrollIntoView({ behavior: "smooth" });
    };

    const handleOnImportSuccess = () => {
        setExpenses(getAllExpenses());
        refreshCustomCategories();
    }

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden scroll-smooth">
            {/* Animated background elements */}
            <div className="fixed inset-0 pointer-events-none opacity-60 dark:opacity-40 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 rounded-full blur-[120px] " />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-[120px]" />
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px]" />
            </div>

            {showConfetti && <Confetti trigger={showConfetti} />}

            <main className="relative z-10 flex flex-col gap-24 pb-24">
                {/* Hero Section */}
                <div id="home" className="container mx-auto px-4">
                    <HeroSection />
                </div>

                {/* Features Section */}
                <div id="features" className="bg-accent/5 py-8">
                    <FeaturesHighlight />
                </div>

                {/* Management & History Section */}
                <section id="manage-expenses" className="container mx-auto px-4 max-w-7xl scroll-mt-24">
                    <div className="grid grid-cols-12 gap-8 lg:grid-rows-5 lg:h-212.5 items-stretch">
                        {/* Sidebar: Form Area (3 rows) */}
                        <div className="col-span-12 lg:col-span-4 lg:row-span-3 lg:col-start-1 lg:row-start-1 flex flex-col min-h-0 space-y-4 max-h-125 lg:max-h-none">
                            <div className="space-y-4 text-center md:text-left shrink-0">
                                <h2 className="text-3xl font-bold tracking-tight">Management</h2>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Record your transactions.
                                </p>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    <ExpenseForm
                                        onAddExpense={handleAddExpense}
                                        editingExpense={editingExpense}
                                        onUpdateExpense={handleUpdateExpense}
                                        onCancelEdit={() => setEditingExpense(undefined)}
                                        currency={currency}
                                    />
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Sidebar: Categories Area (2 rows) */}
                        <div className="col-span-12 lg:col-span-4 lg:row-span-2 lg:col-start-1 lg:row-start-4 flex flex-col min-h-0 max-h-100 lg:max-h-none">
                            <CustomCategoriesManager onUpdateCustomCategory={handleUpdateCustomCategory} />
                        </div>

                        {/* Main: Table Area (5 rows) */}
                        <div className="col-span-12 lg:col-span-8 lg:row-span-5 lg:col-start-5 lg:row-start-1 flex flex-col min-h-0 space-y-4 max-h-200 lg:max-h-none">
                            <div id="history" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                                <div className="space-y-2 text-center md:text-left">
                                    <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                                    <p className="text-muted-foreground text-sm">Review your spending history.</p>
                                </div>
                                <div className="flex justify-center sm:justify-end">
                                    <ExpenseDataActions
                                        onImportSuccess={handleOnImportSuccess}
                                        totalExpensesCount={paginationResult.totalCount}
                                        filters={filters}
                                        fileName={exportFileName}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ExpenseTable
                                    expenses={expenses}
                                    totalAmount={paginationResult.totalAmount}
                                    totalCount={paginationResult.totalCount}
                                    pagedExpenses={paginationResult.data}
                                    selectedMonth={selectedMonth}
                                    selectedCategory={selectedCategory}
                                    onMonthChange={handleMonthChange}
                                    onCategoryChange={handleCategoryChange}
                                    onDeleteExpense={handleDeleteExpense}
                                    onEditExpense={handleEditExpense}
                                    currency={currency}
                                    customCategories={customCategories}
                                    onNextPage={handleNextPage}
                                    onPreviousPage={handlePreviousPage}
                                    isFirstPage={isFirstPage}
                                    isLastPage={isLastPage}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Insights Section */}
                <section id="insights" className="container mx-auto px-4 max-w-7xl">
                    <div className="space-y-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-3xl font-bold tracking-tight">Financial Insights</h2>
                            <p className="text-muted-foreground">Detailed breakdown and intelligent comparisons.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            <MonthlyReport expenses={expenses} currency={currency} />
                            <MonthComparison expenses={expenses} currency={currency} />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
