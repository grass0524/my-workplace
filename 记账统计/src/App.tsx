/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  isSameMonth,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  eachMonthOfInterval
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  X,
  Calendar as CalendarIcon,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, IconButton } from './components/Neumorphic';
import { TransactionItem } from './components/TransactionItem';
import { MOCK_TRANSACTIONS, getCategoryStats } from './mockData';
import { Transaction, TransactionType } from './types';

type ViewType = 'day' | 'month' | 'year';

export default function App() {
  const [view, setView] = useState<ViewType>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const transactions = useMemo(() => MOCK_TRANSACTIONS, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filter === 'all') return true;
      return t.type === filter;
    });
  }, [transactions, filter]);

  return (
<div className="w-full h-full" style={{ background: "transparent", margin: 0, padding: 0 }}>
      <Card className="w-full max-w-6xl h-full mx-auto flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex items-center justify-between border-b border-white/20">
          <h1 className="text-2xl font-bold text-slate-800">记账统计</h1>
          
          <div className="flex gap-4">
            <div className="flex p-1 neumorphic-inset rounded-xl">
              {(['day', 'month', 'year'] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-6 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    view === v 
                      ? "bg-white shadow-sm text-theme-primary" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {v === 'day' ? '按日' : v === 'month' ? '按月' : '按年'}
                </button>
              ))}
            </div>
            <IconButton icon={X} size="sm" onClick={() => window.parent.postMessage({ type: "close-accounting-stats" }, "*")} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'day' && (
              <DayView 
                key="day"
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                transactions={transactions}
                filter={filter}
                setFilter={setFilter}
              />
            )}
            {view === 'month' && (
              <MonthView 
                key="month"
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                transactions={transactions}
                filter={filter}
                setFilter={setFilter}
              />
            )}
            {view === 'year' && (
              <YearView 
                key="year"
                currentYear={currentYear}
                setCurrentYear={setCurrentYear}
                transactions={transactions}
                filter={filter}
                setFilter={setFilter}
              />
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}

// --- Components ---

const CustomTooltip = ({ active, payload, label, data, isMonth }: any) => {
  if (active && payload && payload.length) {
    const index = data.findIndex((d: any) => d.name === label);
    const current = data[index];
    const previous = index > 0 ? data[index - 1] : null;
    const unit = isMonth ? '日' : '';
    const compareUnit = isMonth ? '日' : '月';

    const getChange = (curr: number, prev: number | null) => {
      if (prev === null) return null;
      if (prev === 0) {
        return {
          percent: curr > 0 ? "100.0" : "0.0",
          isUp: curr > 0
        };
      }
      const percent = ((curr - prev) / prev) * 100;
      return {
        percent: Math.abs(percent).toFixed(1),
        isUp: percent >= 0
      };
    };

    const incomeChange = getChange(current.income, previous ? previous.income : null);
    const expenseChange = getChange(current.expense, previous ? previous.expense : null);

    return (
      <Card className="p-3 border-none shadow-2xl bg-white/95 backdrop-blur-sm min-w-[200px]" inset>
        <p className="font-bold mb-2 text-slate-600 border-b border-slate-100 pb-1 text-xs">{label}{unit}</p>
        <div className="space-y-3">
          {/* Income Section */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F36B6B]" />
                <span className="text-slate-500 text-[10px]">收入：</span>
              </div>
              <span className="font-bold text-slate-700 text-[10px]">¥{current.income.toFixed(2)}</span>
            </div>
            {incomeChange && (
              <div className={`text-[9px] flex items-center justify-end font-medium ${incomeChange.isUp ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
                较上{compareUnit}：{incomeChange.isUp ? '↑' : '↓'}{incomeChange.percent}%
              </div>
            )}
          </div>

          {/* Expense Section */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#96CEB4]" />
                <span className="text-slate-500 text-[10px]">支出：</span>
              </div>
              <span className="font-bold text-slate-700 text-[10px]">¥{current.expense.toFixed(2)}</span>
            </div>
            {expenseChange && (
              <div className={`text-[9px] flex items-center justify-end font-medium ${expenseChange.isUp ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
                较上{compareUnit}：{expenseChange.isUp ? '↑' : '↓'}{expenseChange.percent}%
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }
  return null;
};

function DayView({ 
  selectedDate, 
  setSelectedDate, 
  currentMonth, 
  setCurrentMonth,
  transactions,
  filter,
  setFilter
}: any) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayStats = (date: Date) => {
    const dayTransactions = transactions.filter((t: Transaction) => isSameDay(t.date, date));
    if (dayTransactions.length === 0) return null;
    
    const income = dayTransactions.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const expense = dayTransactions.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    return income - expense;
  };

  const dayDetails = useMemo(() => {
    return transactions
      .filter((t: Transaction) => isSameDay(t.date, selectedDate))
      .filter((t: Transaction) => filter === 'all' || t.type === filter);
  }, [transactions, selectedDate, filter]);

  const daySummary = useMemo(() => {
    const dayTransactions = transactions.filter((t: Transaction) => isSameDay(t.date, selectedDate));
    const income = dayTransactions.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const expense = dayTransactions.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    return { income, expense };
  }, [transactions, selectedDate]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col md:flex-row overflow-hidden"
    >
      {/* Calendar Side */}
      <div className="w-full md:w-1/2 p-6 border-r border-white/20 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <IconButton icon={ChevronLeft} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
          <h2 className="text-xl font-bold text-slate-700">{format(currentMonth, 'yyyy年MM月')}</h2>
          <IconButton icon={ChevronRight} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
        </div>

        <div className="grid grid-cols-7 gap-2 flex-1 content-start">
          {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 py-2 uppercase tracking-wider">{d}</div>
          ))}
          {days.map(day => {
            const balance = getDayStats(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 h-16 ${
                  isSelected 
                    ? "neumorphic-inset text-theme-primary" 
                    : isCurrentMonth ? "hover:neumorphic-raised-sm" : "opacity-30"
                }`}
              >
                <span className="text-sm font-bold">{format(day, 'd')}</span>
                <span className={`text-[10px] mt-1 font-medium ${
                  balance === null ? "text-slate-300" : balance >= 0 ? "text-[#e74c3c]" : "text-[#27ae60]"
                }`}>
                  {balance === null ? "—" : balance > 0 ? `+${balance}` : balance}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Details Side */}
      <div className="w-full md:w-1/2 p-6 flex flex-col bg-white/10">
        <div className="flex gap-4 mb-6">
          <Card className="flex-1 p-3 flex items-center gap-3" inset>
            <div className="w-11 h-11 rounded-xl neumorphic-raised flex items-center justify-center bg-bg-neumorphic">
              <TrendingUp size={20} className="text-[#e74c3c]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">今日收入</p>
              <p className="text-base font-bold text-[#e74c3c]">¥{daySummary.income.toFixed(2)}</p>
            </div>
          </Card>
          <Card className="flex-1 p-3 flex items-center gap-3" inset>
            <div className="w-11 h-11 rounded-xl neumorphic-raised flex items-center justify-center bg-bg-neumorphic">
              <TrendingDown size={20} className="text-[#27ae60]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">今日支出</p>
              <p className="text-base font-bold text-[#27ae60]">¥{daySummary.expense.toFixed(2)}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6 flex flex-col flex-1" inset={false}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-500">
              {format(selectedDate, 'MM月dd日')} 明细
            </h3>
            <div className="relative group">
              <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-theme-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/50">
                <Filter size={14} />
                {filter === 'all' ? '全部' : filter === 'income' ? '收入' : '支出'}
                <ChevronRight size={14} className="rotate-90" />
              </button>
              {/* Hover Bridge & Menu Container */}
              <div className="absolute right-0 top-full pt-2 w-32 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-20">
                <div className="bg-bg-neumorphic rounded-xl neumorphic-raised overflow-hidden border border-white/20 shadow-xl">
                  {(['all', 'income', 'expense'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/60 transition-colors ${filter === f ? 'text-theme-primary font-bold' : 'text-slate-600'}`}
                    >
                      {f === 'all' ? '全部' : f === 'income' ? '收入' : '支出'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {dayDetails.length > 0 ? (
              dayDetails.map((t: Transaction, index: number) => (
                <React.Fragment key={t.id}>
                  <TransactionItem transaction={t} flat />
                  {index < dayDetails.length - 1 && <div className="h-px bg-black/5 w-full" />}
                </React.Fragment>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 py-10">
                <CalendarIcon size={48} className="mb-2" />
                <p className="text-sm">暂无记账明细</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function MonthView({ 
  currentMonth, 
  setCurrentMonth, 
  transactions,
  filter,
  setFilter
}: any) {
  const [visibleSeries, setVisibleSeries] = useState({ income: true, expense: true });

  const monthData = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayT = transactions.filter((t: Transaction) => isSameDay(t.date, day));
      return {
        name: format(day, 'd'),
        income: dayT.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
        expense: dayT.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
      };
    });
  }, [currentMonth, transactions]);

  const monthSummary = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const monthT = transactions.filter((t: Transaction) => t.date >= start && t.date <= end);
    const income = monthT.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const expense = monthT.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    return { income, expense, balance: income - expense, transactions: monthT };
  }, [currentMonth, transactions]);

  const incomeStats = useMemo(() => getCategoryStats(monthSummary.transactions, 'income'), [monthSummary]);
  const expenseStats = useMemo(() => getCategoryStats(monthSummary.transactions, 'expense'), [monthSummary]);

  const filteredMonthDetails = useMemo(() => {
    return monthSummary.transactions
      .filter((t: Transaction) => filter === 'all' || t.type === filter)
      .sort((a: Transaction, b: Transaction) => b.date.getTime() - a.date.getTime());
  }, [monthSummary, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full flex flex-col px-6 pt-3 pb-6 overflow-y-auto"
    >
      {/* Month Selector & Summary */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <IconButton icon={ChevronLeft} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-700">{format(currentMonth, 'yyyy-MM')}</h2>
            <p className={`text-xs font-bold ${monthSummary.balance >= 0 ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
              结余: {monthSummary.balance >= 0 ? `+${monthSummary.balance}` : monthSummary.balance}
            </p>
          </div>
          <IconButton icon={ChevronRight} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <Card className="flex-1 md:w-44 p-3 flex items-center gap-3" inset>
            <div className="w-11 h-11 rounded-xl neumorphic-raised flex items-center justify-center bg-bg-neumorphic">
              <TrendingUp size={20} className="text-[#e74c3c]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">本月总收入</p>
              <p className="text-sm font-bold text-[#e74c3c]">¥{monthSummary.income.toFixed(2)}</p>
            </div>
          </Card>
          <Card className="flex-1 md:w-44 p-3 flex items-center gap-3" inset>
            <div className="w-11 h-11 rounded-xl neumorphic-raised flex items-center justify-center bg-bg-neumorphic">
              <TrendingDown size={20} className="text-[#27ae60]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">本月总支出</p>
              <p className="text-sm font-bold text-[#27ae60]">¥{monthSummary.expense.toFixed(2)}</p>
            </div>
          </Card>
        </div>
      </div>

      {monthSummary.transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50 py-20">
          <BarChart3 size={64} className="mb-4" />
          <p className="text-lg font-medium">本月暂无记账数据</p>
        </div>
      ) : (
        <>
          {/* Main Chart */}
      <Card className="p-6 mb-6 min-h-[320px]" inset>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
            <BarChart3 size={16} /> 每日收支趋势
          </h3>
          <div className="flex gap-4">
            <button 
              onClick={() => setVisibleSeries(prev => ({ ...prev, income: !prev.income }))}
              className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${visibleSeries.income ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="w-3 h-3 rounded-full bg-[#F36B6B]" />
              <span>收入</span>
            </button>
            <button 
              onClick={() => setVisibleSeries(prev => ({ ...prev, expense: !prev.expense }))}
              className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${visibleSeries.expense ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="w-3 h-3 rounded-full bg-[#96CEB4]" />
              <span>支出</span>
            </button>
          </div>
        </div>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                content={<CustomTooltip data={monthData} isMonth={true} />}
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              />
              {visibleSeries.income && <Bar name="收入" dataKey="income" fill="#F36B6B" radius={[4, 4, 0, 0]} barSize={12} />}
              {visibleSeries.expense && <Bar name="支出" dataKey="expense" fill="#96CEB4" radius={[4, 4, 0, 0]} barSize={12} />}
              {visibleSeries.income && <Line name="收入趋势" type="monotone" dataKey="income" stroke="#F36B6B" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />}
              {visibleSeries.expense && <Line name="支出趋势" type="monotone" dataKey="expense" stroke="#96CEB4" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Charts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Income Pie */}
            <Card className="p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-500 mb-4 self-start">收入分类统计</h3>
              <div className="relative w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incomeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">总收入</p>
                  <p className="text-xl font-bold text-slate-700">{monthSummary.income}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full">
                {incomeStats.map(stat => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="text-xs text-slate-500">{stat.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Expense Pie */}
            <Card className="p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-500 mb-4 self-start">支出分类统计</h3>
              <div className="relative w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">总支出</p>
                  <p className="text-xl font-bold text-slate-700">{monthSummary.expense}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full">
                {expenseStats.map(stat => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="text-xs text-slate-500">{stat.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Details List */}
        <Card className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-500">本月明细</h3>
            <div className="relative group">
              <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-theme-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/50">
                <Filter size={14} />
                {filter === 'all' ? '全部' : filter === 'income' ? '收入' : '支出'}
                <ChevronRight size={14} className="rotate-90" />
              </button>
              {/* Hover Bridge & Menu Container */}
              <div className="absolute right-0 top-full pt-2 w-32 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-20">
                <div className="bg-bg-neumorphic rounded-xl neumorphic-raised overflow-hidden border border-white/20 shadow-xl">
                  {(['all', 'income', 'expense'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/60 transition-colors ${filter === f ? 'text-theme-primary font-bold' : 'text-slate-600'}`}
                    >
                      {f === 'all' ? '全部' : f === 'income' ? '收入' : '支出'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {filteredMonthDetails.map((t: Transaction, index: number) => (
              <React.Fragment key={t.id}>
                <TransactionItem transaction={t} flat />
                {index < filteredMonthDetails.length - 1 && <div className="h-px bg-black/5 w-full" />}
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>
    </>
  )}
</motion.div>
  );
}

function YearView({ 
  currentYear, 
  setCurrentYear, 
  transactions,
  filter,
  setFilter
}: any) {
  const [visibleSeries, setVisibleSeries] = useState({ income: true, expense: true });

  const yearData = useMemo(() => {
    const start = startOfYear(currentYear);
    const end = endOfYear(currentYear);
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(month => {
      const monthT = transactions.filter((t: Transaction) => isSameMonth(t.date, month));
      return {
        name: format(month, 'M月'),
        income: monthT.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
        expense: monthT.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
      };
    });
  }, [currentYear, transactions]);

  const yearSummary = useMemo(() => {
    const start = startOfYear(currentYear);
    const end = endOfYear(currentYear);
    const yearT = transactions.filter((t: Transaction) => t.date >= start && t.date <= end);
    const income = yearT.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const expense = yearT.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    return { income, expense, balance: income - expense, transactions: yearT };
  }, [currentYear, transactions]);

  const incomeStats = useMemo(() => getCategoryStats(yearSummary.transactions, 'income'), [yearSummary]);
  const expenseStats = useMemo(() => getCategoryStats(yearSummary.transactions, 'expense'), [yearSummary]);

  const filteredYearDetails = useMemo(() => {
    return yearSummary.transactions
      .filter((t: Transaction) => filter === 'all' || t.type === filter)
      .sort((a: Transaction, b: Transaction) => b.date.getTime() - a.date.getTime());
  }, [yearSummary, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col px-6 pt-3 pb-6 overflow-y-auto"
    >
      {/* Year Selector & Summary */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <IconButton icon={ChevronLeft} onClick={() => setCurrentYear(subYears(currentYear, 1))} />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-700">{format(currentYear, 'yyyy年')}</h2>
            <p className={`text-sm font-bold ${yearSummary.balance >= 0 ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
              年度结余: {yearSummary.balance >= 0 ? `+${yearSummary.balance}` : yearSummary.balance}
            </p>
          </div>
          <IconButton icon={ChevronRight} onClick={() => setCurrentYear(addYears(currentYear, 1))} />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <Card className="flex-1 md:w-48 p-3 flex items-center gap-3" inset>
            <div className="w-11 h-11 rounded-xl neumorphic-raised flex items-center justify-center bg-bg-neumorphic">
              <TrendingUp size={20} className="text-[#e74c3c]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">年度总收入</p>
              <p className="text-base font-bold text-[#e74c3c]">¥{yearSummary.income.toFixed(2)}</p>
            </div>
          </Card>
          <Card className="flex-1 md:w-48 p-3 flex items-center gap-3" inset>
            <div className="w-11 h-11 rounded-xl neumorphic-raised flex items-center justify-center bg-bg-neumorphic">
              <TrendingDown size={20} className="text-[#27ae60]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">年度总支出</p>
              <p className="text-base font-bold text-[#27ae60]">¥{yearSummary.expense.toFixed(2)}</p>
            </div>
          </Card>
        </div>
      </div>

      {yearSummary.transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50 py-20">
          <BarChart3 size={64} className="mb-4" />
          <p className="text-lg font-medium">本年暂无记账数据</p>
        </div>
      ) : (
        <>
          {/* Main Chart */}
      <Card className="p-6 mb-6 min-h-[360px]" inset>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
            <BarChart3 size={16} /> 每月收支趋势
          </h3>
          <div className="flex gap-4">
            <button 
              onClick={() => setVisibleSeries(prev => ({ ...prev, income: !prev.income }))}
              className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${visibleSeries.income ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="w-3 h-3 rounded-full bg-[#F36B6B]" />
              <span>收入</span>
            </button>
            <button 
              onClick={() => setVisibleSeries(prev => ({ ...prev, expense: !prev.expense }))}
              className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${visibleSeries.expense ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="w-3 h-3 rounded-full bg-[#96CEB4]" />
              <span>支出</span>
            </button>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip 
                content={<CustomTooltip data={yearData} isMonth={false} />}
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              />
              {visibleSeries.income && <Bar name="收入" dataKey="income" fill="#F36B6B" radius={[4, 4, 0, 0]} barSize={24} />}
              {visibleSeries.expense && <Bar name="支出" dataKey="expense" fill="#96CEB4" radius={[4, 4, 0, 0]} barSize={24} />}
              {visibleSeries.income && <Line name="收入趋势" type="monotone" dataKey="income" stroke="#F36B6B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
              {visibleSeries.expense && <Line name="支出趋势" type="monotone" dataKey="expense" stroke="#96CEB4" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Charts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Income Pie */}
            <Card className="p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-500 mb-4 self-start">年度收入分类</h3>
              <div className="relative w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incomeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs text-slate-400 font-medium uppercase">年度收入</p>
                  <p className="text-2xl font-bold text-slate-700">{yearSummary.income}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 w-full">
                {incomeStats.map(stat => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="text-sm text-slate-500">{stat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Expense Pie */}
            <Card className="p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-500 mb-4 self-start">年度支出分类</h3>
              <div className="relative w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs text-slate-400 font-medium uppercase">年度支出</p>
                  <p className="text-2xl font-bold text-slate-700">{yearSummary.expense}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 w-full">
                {expenseStats.map(stat => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                      <span className="text-sm text-slate-500">{stat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Details List */}
        <Card className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-500">年度明细</h3>
            <div className="relative group">
              <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-theme-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/50">
                <Filter size={14} />
                {filter === 'all' ? '全部' : filter === 'income' ? '收入' : '支出'}
                <ChevronRight size={14} className="rotate-90" />
              </button>
              {/* Hover Bridge & Menu Container */}
              <div className="absolute right-0 top-full pt-2 w-32 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-20">
                <div className="bg-bg-neumorphic rounded-xl neumorphic-raised overflow-hidden border border-white/20 shadow-xl">
                  {(['all', 'income', 'expense'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/60 transition-colors ${filter === f ? 'text-theme-primary font-bold' : 'text-slate-600'}`}
                    >
                      {f === 'all' ? '全部' : f === 'income' ? '收入' : '支出'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {filteredYearDetails.map((t: Transaction, index: number) => (
              <React.Fragment key={t.id}>
                <TransactionItem transaction={t} flat />
                {index < filteredYearDetails.length - 1 && <div className="h-px bg-black/5 w-full" />}
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>
    </>
  )}
</motion.div>
  );
}
