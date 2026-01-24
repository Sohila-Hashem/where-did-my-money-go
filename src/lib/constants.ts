export const CURRENCIES = [
    { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
    { code: "INR", symbol: "₹", name: "Idian Rupee" },
] as const;

export const HIGH_SPENDING_THRESHOLD = 0.5;
export const MEDIUM_SPENDING_THRESHOLD = 0.4;
export const LOW_SPENDING_THRESHOLD = 0.3;

export const HIGH_SPENDING_MESSAGE = "Whoa! That's more than half your spending. Time to re-evaluate your priorities! 😅\n\n";
export const MEDIUM_SPENDING_MESSAGE = "Whoa! That's nearly half your spending. Might be worth keeping an eye on! 👀\n\n";
export const LOW_SPENDING_MESSAGE = "That's a significant chunk, but nothing too wild. 🎯\n\n";
export const BALANCED_SPENDING_MESSAGE = "Nice balance! You're spreading things out pretty well. ✨\n\n";

export type Currency = (typeof CURRENCIES)[number];