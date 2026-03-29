/**
 * dime_base - Marketplace API Routes
 *
 * Unified marketplace for owner and dime purchases
 * One marketplace, two players
 */

import { Router, Request, Response } from 'express';
import { marketplaceService } from '../agents/marketplace';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';

const router = Router();

// Helper: Get user account balance
function getAccount(userId: string): { balance: number } {
  const db = getDb();
  const result = db.exec("SELECT balance FROM accounts WHERE user_id = ?", [userId]);

  if (result.length === 0 || result[0].values.length === 0) {
    return { balance: 100 };
  }

  return { balance: result[0].values[0][0] as number };
}

// Helper: Update account balance
function updateAccountBalance(userId: string, newBalance: number): void {
  const db = getDb();
  db.run("UPDATE accounts SET balance = ? WHERE user_id = ?", [newBalance, userId]);
  saveDatabase();
}

// Helper: Record transaction
function recordTransaction(userId: string, amount: number, description: string): void {
  const db = getDb();
  db.run(
    "INSERT INTO transactions (id, user_id, type, amount, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [uuidv4(), userId, 'spend', -amount, description, new Date().toISOString()]
  );
  saveDatabase();
}

// Browse goods catalog
router.get('/goods', (req: Request, res: Response) => {
  const { type, category, minPrice, maxPrice, pricingType } = req.query;

  const goods = marketplaceService.browseGoods({
    type: type as any,
    category: category as string | undefined,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    pricingType: pricingType as any
  });

  res.json({
    success: true,
    data: goods,
    count: goods.length
  });
});

// Get goods details
router.get('/goods/:goodsId', (req: Request, res: Response) => {
  const { goodsId } = req.params;
  const goods = marketplaceService.getGoodsById(goodsId);

  if (!goods) {
    return res.status(404).json({
      success: false,
      error: 'Goods not found',
      code: 'GOODS_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: goods
  });
});

// Purchase goods
router.post('/goods/:goodsId/purchase', (req: Request, res: Response) => {
  const { goodsId } = req.params;
  const { buyerType, dimeId, ownerId } = req.body;

  if (!buyerType || !['owner', 'dime'].includes(buyerType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid buyerType. Must be "owner" or "dime"',
      code: 'INVALID_INPUT'
    });
  }

  if (buyerType === 'owner' && !ownerId) {
    return res.status(400).json({
      success: false,
      error: 'ownerId is required when buyerType is owner',
      code: 'INVALID_INPUT'
    });
  }

  if (buyerType === 'owner' && !dimeId) {
    return res.status(400).json({
      success: false,
      error: 'dimeId is required to assign goods',
      code: 'INVALID_INPUT'
    });
  }

  if (buyerType === 'dime' && !dimeId) {
    return res.status(400).json({
      success: false,
      error: 'dimeId is required when buyerType is dime',
      code: 'INVALID_INPUT'
    });
  }

  const goods = marketplaceService.getGoodsById(goodsId);

  if (!goods) {
    return res.status(404).json({
      success: false,
      error: 'Goods not found',
      code: 'GOODS_NOT_FOUND'
    });
  }

  // Determine purchaserId (ownerId for owner purchases, dimeId for dime purchases)
  const purchaserId = buyerType === 'owner' ? ownerId : dimeId;

  // Check balance
  const account = getAccount(purchaserId);
  if (account.balance < goods.price) {
    return res.status(400).json({
      success: false,
      error: 'Insufficient vCoin balance',
      code: 'INSUFFICIENT_BALANCE'
    });
  }

  // Process purchase
  const result = marketplaceService.purchaseGoods(goodsId, buyerType, dimeId, purchaserId);

  if (!result.success) {
    let statusCode = 400;
    if (result.error?.includes('not found')) {
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      error: result.error,
      code: result.error?.includes('not found') ? 'NOT_FOUND' :
             result.error?.includes('Insufficient') ? 'INSUFFICIENT_BALANCE' :
             result.error?.includes('already owned') ? 'ALREADY_OWNED' :
             result.error?.includes('exceeds') ? 'SCOPE_LIMIT_EXCEEDED' :
             result.error?.includes('not allowed') ? 'SCOPE_RESTRICTION' :
             'PURCHASE_FAILED'
    });
  }

  // Deduct balance and record transaction
  const newBalance = account.balance - goods.price;
  updateAccountBalance(purchaserId, newBalance);
  recordTransaction(
    purchaserId,
    goods.price,
    `Purchased ${goods.name} (${goods.id}) for ${buyerType === 'owner' ? 'dime' : 'self'}`
  );

  res.status(201).json({
    success: true,
    data: result.dimeGoods,
    message: buyerType === 'owner'
      ? 'Goods purchased and assigned to dime'
      : 'Goods purchased successfully'
  });
});

// List owned goods
router.get('/my', (req: Request, res: Response) => {
  const ownerId = req.headers['x-owner-id'] as string;
  const { dimeId } = req.query;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  let goods: any[];
  if (dimeId) {
    // Verify ownership of dime
    const db = getDb();
    const result = db.exec("SELECT owner_id FROM dimes WHERE id = ?", [dimeId as string]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dime not found',
        code: 'NOT_FOUND'
      });
    }

    const dimeOwnerId = result[0].values[0][0] as string;
    if (dimeOwnerId !== ownerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this dime',
        code: 'NOT_AUTHORIZED'
      });
    }

    goods = marketplaceService.listOwnedGoods(dimeId as string);
  } else {
    // List all goods owned by all dimes of this owner
    const db = getDb();
    const result = db.exec("SELECT id FROM dimes WHERE owner_id = ?", [ownerId]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    const allOwned: any[] = [];
    result[0].values.forEach((row: any[]) => {
      const dId = row[0] as string;
      const dimesGoods = marketplaceService.listOwnedGoods(dId);
      allOwned.push(...dimesGoods);
    });

    goods = allOwned;
  }

  res.json({
    success: true,
    data: goods,
    count: goods.length
  });
});

// Get dime's purchase transactions
router.get('/dimes/:dimeId/transactions', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  // Verify ownership
  const db = getDb();
  const dimeResult = db.exec("SELECT owner_id FROM dimes WHERE id = ?", [dimeId]);
  if (dimeResult.length === 0 || dimeResult[0].values.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Dime not found',
      code: 'NOT_FOUND'
    });
  }

  const dimeOwnerId = dimeResult[0].values[0][0] as string;
  if (dimeOwnerId !== ownerId) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this dime',
      code: 'NOT_AUTHORIZED'
    });
  }

  // Query dime_goods joined with digital_goods to get transaction history
  const transactionsResult = db.exec(`
    SELECT
      dg.id,
      dg.goods_id,
      dg.dime_id,
      dg.purchased_by,
      dg.status,
      dg.purchased_at,
      dg.name,
      dg.description,
      dg.price,
      dg.type as goods_type
    FROM dime_goods dg
    JOIN digital_goods dg2 ON dg.goods_id = dg2.id
    WHERE dg.dime_id = ?
    ORDER BY dg.purchased_at DESC
  `, [dimeId]);

  if (transactionsResult.length === 0) {
    return res.json({
      success: true,
      data: [],
      count: 0,
      summary: {
        totalSpent: 0,
        dimeSpent: 0,
        ownerSpent: 0
      }
    });
  }

  const transactions = transactionsResult[0].values.map((row: any[]) => ({
    id: row[0],
    goodsId: row[1],
    dimeId: row[2],
    purchasedBy: row[3],
    status: row[4],
    purchasedAt: row[5],
    goodsName: row[6],
    goodsDescription: row[7],
    price: row[8],
    goodsType: row[9]
  }));

  // Calculate summary
  const totalSpent = transactions.reduce((sum: number, t: any) => sum + t.price, 0);
  const dimeSpent = transactions
    .filter((t: any) => t.purchasedBy === 'dime')
    .reduce((sum: number, t: any) => sum + t.price, 0);
  const ownerSpent = transactions
    .filter((t: any) => t.purchasedBy === 'owner')
    .reduce((sum: number, t: any) => sum + t.price, 0);

  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
    summary: {
      totalSpent,
      dimeSpent,
      ownerSpent
    }
  });
});

// Get dime's scope
router.get('/scope/:dimeId', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  // Verify ownership
  const db = getDb();
  const result = db.exec("SELECT owner_id FROM dimes WHERE id = ?", [dimeId]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Dime not found',
      code: 'NOT_FOUND'
    });
  }

  const dimeOwnerId = result[0].values[0][0] as string;
  if (dimeOwnerId !== ownerId) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this dime',
      code: 'NOT_AUTHORIZED'
    });
  }

  const scope = marketplaceService.getDimeScope(dimeId);

  if (!scope) {
    return res.status(404).json({
      success: false,
      error: 'Dime scope not found',
      code: 'NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: scope
  });
});

// Update dime's scope
router.put('/scope/:dimeId', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;
  const scopeUpdates = req.body;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  // Verify ownership
  const db = getDb();
  const result = db.exec("SELECT owner_id FROM dimes WHERE id = ?", [dimeId]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Dime not found',
      code: 'NOT_FOUND'
    });
  }

  const dimeOwnerId = result[0].values[0][0] as string;
  if (dimeOwnerId !== ownerId) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to modify this dime',
      code: 'NOT_AUTHORIZED'
    });
  }

  // Get current scope or create default
  const currentScope = marketplaceService.getDimeScope(dimeId) || {
    dimeId,
    maxSpendPerTransaction: 50,
    dailyLimit: 100,
    monthlyBudget: 500,
    allowedCategories: [],
    allowedTypes: [],
    canReceiveGifts: true,
    canSendGifts: false,
    canSellToOthers: false,
    dailySpend: 0,
    monthlySpend: 0,
    lastResetDate: new Date()
  };

  // Merge updates
  const updatedScope = {
    ...currentScope,
    ...scopeUpdates,
    dimeId  // Ensure dimeId is preserved
  };

  const scopeResult = marketplaceService.setDimeScope(updatedScope);

  res.json({
    success: true,
    data: scopeResult,
    message: 'Dime scope updated successfully'
  });
});

// Publish new goods (developer endpoint)
router.post('/publish', (req: Request, res: Response) => {
  const { developerId, type, name, description, price, pricingType, category, iconUrl, previewUrl } = req.body;

  if (!developerId || !type || !name || !description || price === undefined || !pricingType || !category) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: developerId, type, name, description, price, pricingType, category',
      code: 'INVALID_INPUT'
    });
  }

  const result = marketplaceService.publishGoods({
    developerId,
    type,
    name,
    description,
    iconUrl,
    previewUrl,
    price,
    pricingType,
    category
  });

  res.status(201).json({
    success: true,
    data: result,
    message: 'Goods published successfully'
  });
});

// Get equipped goods for a dime
router.get('/equipped/:dimeId', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  // Verify ownership
  const db = getDb();
  const result = db.exec("SELECT owner_id FROM dimes WHERE id = ?", [dimeId]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Dime not found',
      code: 'NOT_FOUND'
    });
  }

  const dimeOwnerId = result[0].values[0][0] as string;
  if (dimeOwnerId !== ownerId) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this dime',
      code: 'NOT_AUTHORIZED'
    });
  }

  const goods = marketplaceService.listEquippedGoods(dimeId);

  res.json({
    success: true,
    data: goods,
    count: goods.length
  });
});

// Equip goods
router.post('/equip/:dimeGoodsId', (req: Request, res: Response) => {
  const { dimeGoodsId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  const result = marketplaceService.equipGoods(dimeGoodsId);

  if (!result.success) {
    const statusCode = result.error?.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: result.error,
      code: result.error?.includes('not found') ? 'NOT_FOUND' : 'EQUIP_FAILED'
    });
  }

  res.json({
    success: true,
    message: 'Goods equipped successfully'
  });
});

// Unequip goods
router.post('/unequip/:dimeGoodsId', (req: Request, res: Response) => {
  const { dimeGoodsId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  const result = marketplaceService.unequipGoods(dimeGoodsId);

  if (!result.success) {
    const statusCode = result.error?.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: result.error,
      code: result.error?.includes('not found') ? 'NOT_FOUND' : 'UNEQUIP_FAILED'
    });
  }

  res.json({
    success: true,
    message: 'Goods unequipped successfully'
  });
});

// Configure goods
router.post('/configure/:dimeGoodsId', (req: Request, res: Response) => {
  const { dimeGoodsId } = req.params;
  const { config } = req.body;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({
      success: false,
      error: 'x-owner-id header required',
      code: 'INVALID_INPUT'
    });
  }

  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'config is required',
      code: 'INVALID_INPUT'
    });
  }

  const result = marketplaceService.configureGoods(dimeGoodsId, config);

  if (!result.success) {
    const statusCode = result.error?.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: result.error,
      code: result.error?.includes('not found') ? 'NOT_FOUND' : 'CONFIGURE_FAILED'
    });
  }

  res.json({
    success: true,
    message: 'Goods configured successfully'
  });
});

export default router;
