import type { Expense } from "@/domain/expense";
import { getFilteredExpenses } from "@/domain/expense";
import { MONTHS } from "@/lib/cosntants";

export const canGenerateReport = (month: string | undefined, expenses: Expense[]): { isValid: boolean; message?: string } => {
  // check if month is valid
  if (!month) return { isValid: false, message: "Month is not valid" };
  // check if month has expenses
  if (!getFilteredExpenses(month, expenses).length) return { isValid: false, message: "Month has no expenses" };
  return { isValid: true };
};

export const canGenerateComparisonReport = (month: string | undefined, expenses: Expense[]): { isValid: boolean; message?: string } => {
  // check if month is valid
  if (!month) return { isValid: false, message: "Month is not valid" };
  // check if month is not the first month
  if (MONTHS.indexOf(month) === 0) return { isValid: false, message: "You can't compare the first month" };
  // check if month has expenses
  if (!getFilteredExpenses(month, expenses).length) return { isValid: false, message: "Month has no expenses" };
  // check if previous month has expenses
  console.log(getFilteredExpenses(MONTHS[MONTHS.indexOf(month) - 1], expenses).length)
  if (!getFilteredExpenses(MONTHS[MONTHS.indexOf(month) - 1], expenses).length) return { isValid: false, message: "Previous month has no expenses" };
  return { isValid: true };
};