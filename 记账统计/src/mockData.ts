import { Transaction, CategoryStat } from './types';
import { subDays, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

const CATEGORIES = {
  expense: [
    { name: '餐饮', color: '#FF6B6B' },
    { name: '购物', color: '#4ECDC4' },
    { name: '交通', color: '#45B7D1' },
    { name: '娱乐', color: '#96CEB4' },
    { name: '居住', color: '#FFEEAD' },
    { name: '投资', color: '#A3A1FB' },
  ],
  income: [
    { name: '工资', color: '#6B7CFF' },
    { name: '理财', color: '#FFD93D' },
    { name: '兼职', color: '#6BCB77' },
  ],
};

export const generateMockTransactions = (count: number = 100): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();

  const notes: Record<string, string[]> = {
    '餐饮': ['午餐', '晚餐', '下午茶', '火锅', '咖啡'],
    '购物': ['淘宝', '超市', '衣服', '日用品'],
    '交通': ['打车', '地铁', '加油'],
    '娱乐': ['电影', '游戏', 'KTV'],
    '居住': ['房租', '水电费'],
    '投资': ['股票亏损', '基金定投', '期权交易'],
    '工资': ['月度工资', '季度奖金'],
    '理财': ['利息收入', '基金分红'],
    '兼职': ['设计外快', '翻译费用'],
  };

  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() > 0.7;
    const type = isIncome ? 'income' : 'expense';
    const categories = CATEGORIES[type];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryNotes = notes[category.name] || ['测试账单'];
    
    transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      category: category.name,
      amount: isIncome ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 500) + 10,
      date: subDays(now, Math.floor(Math.random() * 730)), // Last 2 years
      note: categoryNotes[Math.floor(Math.random() * categoryNotes.length)],
    });
  }

  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const MOCK_TRANSACTIONS = generateMockTransactions(500);

export const getCategoryStats = (transactions: Transaction[], type: 'income' | 'expense'): CategoryStat[] => {
  const filtered = transactions.filter(t => t.type === type);
  const statsMap: Record<string, number> = {};
  
  filtered.forEach(t => {
    statsMap[t.category] = (statsMap[t.category] || 0) + t.amount;
  });

  const categories = CATEGORIES[type];
  return Object.entries(statsMap).map(([name, value]) => ({
    name,
    value,
    color: categories.find(c => c.name === name)?.color || '#ccc',
  }));
};
