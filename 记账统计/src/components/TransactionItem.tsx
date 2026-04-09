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
  LineChart,
  Edit,
  Trash2
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 通过 postMessage 通知父窗口编辑记录
    // 将字符串ID转换回数字，因为主应用使用数字ID
    const numericId = typeof transaction.id === 'string' ? parseInt(transaction.id) : transaction.id;
    window.parent.postMessage({
      type: 'edit-accounting-record',
      recordId: numericId
    }, '*');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 通过 postMessage 通知父窗口删除记录
    // 将字符串ID转换回数字，因为主应用使用数字ID
    const numericId = typeof transaction.id === 'string' ? parseInt(transaction.id) : transaction.id;
    window.parent.postMessage({
      type: 'delete-accounting-record',
      recordId: numericId
    }, '*');
  };

  const content = (
    <div className={cn(
      "flex items-center justify-between group transition-all duration-300 cursor-pointer relative overflow-visible",
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

      {/* Amount and Date - with hover animation */}
      <div
        className="text-right flex flex-col justify-center transition-transform duration-300"
        style={{
          transform: 'translateX(0)',
        }}
      >
        <style>{`
          .group:hover .group-hover\\:translate-amount-left {
            transform: translateX(-80px) !important;
          }
        `}</style>
        <p className={`text-lg font-bold group-hover:translate-amount-left ${transaction.type === 'income' ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
          {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toFixed(2)}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 font-medium opacity-80 group-hover:translate-amount-left">
          {format(transaction.date, 'M月d日 HH:mm')}
        </p>
      </div>

      {/* Edit and Delete Buttons - Show on Hover */}
      <button
        onClick={handleEdit}
        className="absolute top-1/2 -translate-y-1/2 right-12 w-7 h-7 p-0 border-none rounded-lg bg-[#e0e5ec] shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer pointer-events-none group-hover:pointer-events-auto hover:bg-[#d1d9e6]"
        style={{
          boxShadow: '2px 2px 4px #a3b1c6, -2px -2px 4px #ffffff'
        }}
      >
        <Edit size={14} className="text-[#6b7fff]" strokeWidth={2} />
      </button>
      <button
        onClick={handleDelete}
        className="absolute top-1/2 -translate-y-1/2 right-3 w-7 h-7 p-0 border-none rounded-lg bg-[#e0e5ec] shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer pointer-events-none group-hover:pointer-events-auto hover:bg-[#d1d9e6]"
        style={{
          boxShadow: '2px 2px 4px #a3b1c6, -2px -2px 4px #ffffff'
        }}
      >
        <Trash2 size={14} className="text-[#e74c3c]" strokeWidth={2} />
      </button>
    </div>
  );

  if (flat) return content;

  return (
    <Card className="hover:scale-[1.01]">
      {content}
    </Card>
  );
};
