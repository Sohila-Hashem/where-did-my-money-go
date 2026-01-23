import { DollarSign } from "lucide-react";
import { motion } from "motion/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, type Currency } from "@/lib/constants";

interface CurrencySelectorProps {
    currency: Currency;
    onCurrencyChange: (currency: Currency) => void;
}

export function CurrencySelector({
    currency,
    onCurrencyChange,
}: CurrencySelectorProps) {
    return (
        <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
        >
            <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </motion.div>
            <Select
                value={currency.code}
                onValueChange={(code) => {
                    const selected = CURRENCIES.find((c) => c.code === code);
                    if (selected) onCurrencyChange(selected);
                }}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.code} - {curr.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </motion.div>
    );
}