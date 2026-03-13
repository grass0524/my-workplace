export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface DailyStats {
  date: Date;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryStat {
  name: string;
  value: number;
  color: string;
}
