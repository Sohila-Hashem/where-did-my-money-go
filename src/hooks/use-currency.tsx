import React, { createContext, useContext, useState, useEffect } from "react";
import { type Currency, CURRENCIES } from "@/lib/constants";
import { loadCurrency, saveCurrency } from "@/lib/storage";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  isInitialized: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedCurrency = loadCurrency();
    if (storedCurrency) {
      const found = CURRENCIES.find((c) => c.code === storedCurrency.code);
      if (found) {
        setCurrencyState(found);
      }
    }
    setIsInitialized(true);
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    saveCurrency(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isInitialized }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
