export type ExpenseCategories = ExpenseCategoryEnum;
export type SupportedCurrencies = ExpenseCurrencyEnum;

export enum ExpenseCategoryEnum {
    Food = 'Food',
    Transport = 'Transport',
    Utilities = 'Utilities',
    Entertainment = 'Entertainment',
    Health = 'Health',
    Wearables = 'Wearables',
    Travel = 'Travel',
    Subscriptions = 'Subscriptions',
    SelfCare = 'Self Care',
    Gifts = 'Gifts',
    Medical = 'Medical',
    Education = 'Education',
    Installments = 'Installments',
    DebtPayment = 'Debt Payment',
    Withdrawals = 'Withdrawals',
    Bills = 'Bills',
    Donations = 'Donations',
    BankFees = 'Bank Fees',
    Fees = 'Fees',
    Investments = 'Investments',
    Savings = 'Savings',
    Loans = 'Loans',
    Taxes = 'Taxes',
    Insurance = 'Insurance',
    Transfers = 'Transfers',
    Other = 'Other',
}
export enum ExpenseCurrencyEnum {
    EGP = 'EGP',
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    JPY = 'JPY',
    CNY = 'CNY',
    INR = 'INR',
}
export interface Expense {
    id: string;
    amount: number;
    date: string;
    category: ExpenseCategories;
    description: string;
}