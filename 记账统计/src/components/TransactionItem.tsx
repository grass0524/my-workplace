import React from 'react';
import { format } from 'date-fns';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Car, 
  Gamepad2, 
  Home, 
  TrendingUp, 
  Wallet, 
  Coins, 
  Briefcase,
  LineChart
} from 'lucide-react';
import { Transaction } from '../types';
import { Card, cn } from './Neumorphic';

const CATEGORY_ICONS: Record<string, any> = {
  '餐饮': UtensilsCrossed,
  '购物': ShoppingBag,
  '交通': Car,
  '娱乐': Gamepad2,
  '居住': Home,
  '投资': LineChart,
  '工资': Wallet,
  '理财': Coins,
  '兼职': Briefcase,
};

export const TransactionItem: React.FC<{ 
  transaction: Transaction; 
  flat?: boolean;
}> = ({ transaction, flat = false }) => {
  const Icon = CATEGORY_ICONS[transaction.category] || TrendingUp;
  
  const content = (
    <div className={cn(
      "flex items-center justify-between group transition-all duration-300 cursor-pointer",
      flat ? "py-4" : "p-3 bg-bg-neumorphic"
    )}>
      <div className="flex items-center gap-3">
        {/* Icon Box */}
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center bg-bg-neumorphic",
          flat ? "border border-black/5 shadow-sm" : "neumorphic-raised"
        )}>
          <Icon size={20} className="text-slate-600" strokeWidth={1.5} />
        </div>
        
        {/* Text Content */}
        <div className="flex flex-col justify-center">
          <p className="text-base font-bold text-slate-700 leading-none">{transaction.category}</p>
          <p className="text-xs text-slate-400 font-medium mt-1.5">{transaction.note || '无备注'}</p>
        </div>
      </div>
      
      {/* Amount and Date */}
      <div className="text-right flex flex-col justify-center">
        <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
          {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toFixed(2)}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 font-medium opacity-80">
          {format(transaction.date, 'M月d日 HH:mm')}
        </p>
      </div>
    </div>
  );

  if (flat) return content;

  return (
    <Card className="hover:scale-[1.01]">
      {content}
    </Card>
  );
};
