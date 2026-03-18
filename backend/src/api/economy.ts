/**
 * dime_base - Economy API Routes
 * Virtual currency and donations
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Virtual Coin (vCoin) system
interface UserAccount {
  userId: string;
  balance: number;
  transactions: Transaction[];
  tier: 'free' | 'premium' | 'founder';
}

interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'donate' | 'exchange';
  amount: number;
  description: string;
  timestamp: Date;
}

// In-memory accounts
const accounts = new Map<string, UserAccount>();

// Exchange rates
const EXCHANGE_RATE = 0.01; // 1 vCoin = $0.01 USD

// Server cost estimate (per user per day)
const DAILY_COST_ESTIMATE = 0.50; // $0.50/day

// Get account
function getAccount(userId: string): UserAccount {
  if (!accounts.has(userId)) {
    accounts.set(userId, {
      userId,
      balance: 100, // Welcome bonus
      transactions: [{
        id: uuidv4(),
        type: 'earn',
        amount: 100,
        description: 'Welcome bonus',
        timestamp: new Date()
      }],
      tier: 'free'
    });
  }
  return accounts.get(userId)!;
}

// Get balance
router.get('/balance', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const account = getAccount(userId);
  res.json({
    balance: account.balance,
    tier: account.tier,
    dailyCost: DAILY_COST_ESTIMATE
  });
});

// Get transaction history
router.get('/transactions', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const account = getAccount(userId);
  res.json(account.transactions.slice(-20).reverse());
});

// Earn vCoins (for agents working)
router.post('/earn', (req: Request, res: Response) => {
  const { userId, amount, description } = req.body;
  
  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }
  
  const account = getAccount(userId);
  account.balance += amount;
  account.transactions.push({
    id: uuidv4(),
    type: 'earn',
    amount,
    description: description || 'Earned vCoins',
    timestamp: new Date()
  });
  
  res.json({ success: true, balance: account.balance });
});

// Spend vCoins
router.post('/spend', (req: Request, res: Response) => {
  const { userId, amount, description } = req.body;
  
  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }
  
  const account = getAccount(userId);
  
  if (account.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  account.balance -= amount;
  account.transactions.push({
    id: uuidv4(),
    type: 'spend',
    amount: -amount,
    description: description || 'Spent vCoins',
    timestamp: new Date()
  });
  
  res.json({ success: true, balance: account.balance });
});

// Donate real money (support server costs)
router.post('/donate', (req: Request, res: Response) => {
  const { userId, amount, currency } = req.body;
  
  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }
  
  // In production, this would integrate with payment processor
  // For now, just add bonus vCoins
  const bonus = Math.floor(amount / EXCHANGE_RATE);
  const account = getAccount(userId);
  
  account.balance += bonus;
  account.transactions.push({
    id: uuidv4(),
    type: 'donate',
    amount: bonus,
    description: `Donation: ${amount} ${currency || 'USD'}`,
    timestamp: new Date()
  });
  
  // Update tier based on total donations
  const totalDonated = account.transactions
    .filter(t => t.type === 'donate')
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (totalDonated >= 1000) {
    account.tier = 'founder';
  } else if (totalDonated >= 100) {
    account.tier = 'premium';
  }
  
  res.json({ 
    success: true, 
    balance: account.balance,
    tier: account.tier,
    vCoinsReceived: bonus
  });
});

// Exchange vCoins to real money
router.post('/exchange', (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  
  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }
  
  const account = getAccount(userId);
  
  if (account.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Exchange rate (5% fee)
  const fee = amount * 0.05;
  const net = (amount - fee) * EXCHANGE_RATE;
  
  account.balance -= amount;
  account.transactions.push({
    id: uuidv4(),
    type: 'exchange',
    amount: -amount,
    description: `Exchanged to $${net.toFixed(2)} USD (fee: ${fee} vCoins)`,
    timestamp: new Date()
  });
  
  res.json({ 
    success: true, 
    balance: account.balance,
    usdReceived: net.toFixed(2)
  });
});

// Get server cost status
router.get('/costs', (req: Request, res: Response) => {
  // Estimate total users and costs
  const totalUsers = accounts.size;
  const estimatedDailyCost = totalUsers * DAILY_COST_ESTIMATE;
  
  const totalDonations = Array.from(accounts.values())
    .reduce((sum, acc) => sum + acc.transactions
      .filter(t => t.type === 'donate')
      .reduce((s, t) => s + t.amount, 0), 0);
  
  res.json({
    totalUsers,
    dailyCost: estimatedDailyCost.toFixed(2),
    totalDonations,
    coverage: totalDonations > 0 ? '100%' : '0%',
    perUserCost: DAILY_COST_ESTIMATE
  });
});

export default router;
