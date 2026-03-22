/**
 * dime_base - Economy API Routes
 * Virtual currency and donations
 * Persisted via SQLite
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';

const router = Router();

// Exchange rates
const EXCHANGE_RATE = 0.01; // 1 vCoin = $0.01 USD
const DAILY_COST_ESTIMATE = 0.50; // $0.50/day per user

// Ensure account exists, return balance and tier
function getAccount(userId: string): { userId: string; balance: number; tier: string } {
  const db = getDb();
  const result = db.exec("SELECT * FROM accounts WHERE user_id = ?", [userId]);

  if (result.length === 0 || result[0].values.length === 0) {
    // Create account with welcome bonus
    const now = new Date().toISOString();
    db.run("INSERT INTO accounts (user_id, balance, tier) VALUES (?, ?, ?)", [userId, 100, 'free']);
    db.run(
      "INSERT INTO transactions (id, user_id, type, amount, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [uuidv4(), userId, 'earn', 100, 'Welcome bonus', now]
    );
    saveDatabase();
    return { userId, balance: 100, tier: 'free' };
  }

  const cols = result[0].columns;
  const vals = result[0].values[0];
  const row: any = {};
  cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
  return { userId: row.user_id, balance: row.balance, tier: row.tier };
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

  // Ensure account exists
  getAccount(userId);

  const db = getDb();
  const result = db.exec(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20",
    [userId]
  );

  if (result.length === 0) return res.json([]);

  const cols = result[0].columns;
  const transactions = result[0].values.map((vals: any[]) => {
    const row: any = {};
    cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
    return {
      id: row.id,
      type: row.type,
      amount: row.amount,
      description: row.description,
      timestamp: row.timestamp
    };
  });

  res.json(transactions);
});

// Earn vCoins
router.post('/earn', (req: Request, res: Response) => {
  const { userId, amount, description } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }

  const account = getAccount(userId);
  const newBalance = account.balance + amount;
  const db = getDb();

  db.run("UPDATE accounts SET balance = ? WHERE user_id = ?", [newBalance, userId]);
  db.run(
    "INSERT INTO transactions (id, user_id, type, amount, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [uuidv4(), userId, 'earn', amount, description || 'Earned vCoins', new Date().toISOString()]
  );
  saveDatabase();

  res.json({ success: true, balance: newBalance });
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

  const newBalance = account.balance - amount;
  const db = getDb();

  db.run("UPDATE accounts SET balance = ? WHERE user_id = ?", [newBalance, userId]);
  db.run(
    "INSERT INTO transactions (id, user_id, type, amount, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [uuidv4(), userId, 'spend', -amount, description || 'Spent vCoins', new Date().toISOString()]
  );
  saveDatabase();

  res.json({ success: true, balance: newBalance });
});

// Donate real money
router.post('/donate', (req: Request, res: Response) => {
  const { userId, amount, currency } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount are required' });
  }

  const bonus = Math.floor(amount / EXCHANGE_RATE);
  const account = getAccount(userId);
  const newBalance = account.balance + bonus;
  const db = getDb();

  db.run("UPDATE accounts SET balance = ? WHERE user_id = ?", [newBalance, userId]);
  db.run(
    "INSERT INTO transactions (id, user_id, type, amount, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [uuidv4(), userId, 'donate', bonus, `Donation: ${amount} ${currency || 'USD'}`, new Date().toISOString()]
  );

  // Update tier based on total donations
  const donationResult = db.exec(
    "SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'donate'",
    [userId]
  );
  const totalDonated = donationResult.length > 0 ? (donationResult[0].values[0][0] as number) || 0 : 0;

  let tier = 'free';
  if (totalDonated >= 1000) {
    tier = 'founder';
  } else if (totalDonated >= 100) {
    tier = 'premium';
  }
  db.run("UPDATE accounts SET tier = ? WHERE user_id = ?", [tier, userId]);
  saveDatabase();

  res.json({
    success: true,
    balance: newBalance,
    tier,
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

  const fee = amount * 0.05;
  const net = (amount - fee) * EXCHANGE_RATE;
  const newBalance = account.balance - amount;
  const db = getDb();

  db.run("UPDATE accounts SET balance = ? WHERE user_id = ?", [newBalance, userId]);
  db.run(
    "INSERT INTO transactions (id, user_id, type, amount, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [uuidv4(), userId, 'exchange', -amount, `Exchanged to $${net.toFixed(2)} USD (fee: ${fee} vCoins)`, new Date().toISOString()]
  );
  saveDatabase();

  res.json({
    success: true,
    balance: newBalance,
    usdReceived: net.toFixed(2)
  });
});

// Get server cost status
router.get('/costs', (req: Request, res: Response) => {
  const db = getDb();
  const usersResult = db.exec("SELECT COUNT(*) FROM accounts");
  const totalUsers = usersResult.length > 0 ? usersResult[0].values[0][0] as number : 0;
  const estimatedDailyCost = totalUsers * DAILY_COST_ESTIMATE;

  const donationResult = db.exec("SELECT SUM(amount) FROM transactions WHERE type = 'donate'");
  const totalDonations = donationResult.length > 0 ? (donationResult[0].values[0][0] as number) || 0 : 0;

  res.json({
    totalUsers,
    dailyCost: estimatedDailyCost.toFixed(2),
    totalDonations,
    coverage: totalDonations > 0 ? '100%' : '0%',
    perUserCost: DAILY_COST_ESTIMATE
  });
});

export default router;
