/**
 * Digital Goods Marketplace - Core Domain Model and Service
 * Implements FR-MP (Marketplace) and FR-Skill (Skills) requirements
 */

export type GoodsType = 'skill' | 'icon' | 'badge' | 'theme' | 'avatar' | 'pack' | 'other';

export type PricingType = 'one-time' | 'subscription' | 'free';

export interface GoodsParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  description?: string;
  enum?: any[];  // For enum values
  min?: number;  // For numbers
  max?: number;  // For numbers
}

export interface DigitalGoods {
  id: string;
  developerId: string;              // Owner who published, or 'system'
  type: GoodsType;
  name: string;
  description: string;
  iconUrl?: string;
  previewUrl?: string;
  price: number;                     // 0 = free
  pricingType: PricingType;
  category: string;                   // e.g., 'productivity', 'social', 'gaming'
  parameters?: GoodsParameter[];      // For skills: input schema
  apiSpec?: {
    endpoint: string;                // For skills: execution endpoint
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
  };
  requirements?: {
    minLevel?: number;
    requiredGoods?: string[];
  };
  stats: {
    purchases: number;
    rating: number;
    uses: number;
  };
  publishedAt: Date;
}

export interface DimeScope {
  dimeId: string;
  maxSpendPerTransaction: number;   // Max vCoins per purchase
  dailyLimit: number;                // Max vCoins per day
  monthlyBudget: number;             // Monthly allowance
  allowedCategories: string[];       // Empty = all allowed
  allowedTypes: GoodsType[];         // Empty = all allowed
  canReceiveGifts: boolean;
  canSendGifts: boolean;
  canSellToOthers: boolean;
  dailySpend: number;                // Tracking (resets daily)
  monthlySpend: number;              // Tracking (resets monthly)
  lastResetDate: Date;
}

export interface DimeGoods {
  id: string;
  goodsId: string;
  dimeId: string;
  purchasedBy: 'owner' | 'dime';    // Who made the purchase
  status: 'owned' | 'equipped' | 'active';
  config: Record<string, any>;       // Per-dime configuration
  purchasedAt: Date;
  equippedAt?: Date;
}

// FR-Skill: Skill-specific types
export interface SkillExecution {
  id: string;
  skillId: string;
  executorDimeId: string;
  providerDimeId?: string;           // If using D2D skill sharing
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface SkillReview {
  id: string;
  skillId: string;
  reviewerDimeId: string;
  rating: number;                    // 1-5
  comment?: string;
  createdAt: Date;
}

export interface D2DSkillOffer {
  id: string;
  providerDimeId: string;
  skillId: string;
  pricePerUse: number;
  availability: 'available' | 'busy' | 'offline';
  reputation: number;                // Based on successful executions
  totalExecutions: number;
  createdAt: Date;
}

// Marketplace Service
class MarketplaceService {
  private goods: Map<string, DigitalGoods> = new Map();
  private dimeGoods: Map<string, DimeGoods> = new Map();
  private dimeScopes: Map<string, DimeScope> = new Map();
  private skillExecutions: Map<string, SkillExecution> = new Map();
  private skillReviews: Map<string, SkillReview> = new Map();
  private d2dOffers: Map<string, D2DSkillOffer> = new Map();

  // Initialize with some sample data
  constructor() {
    this.initializeSampleGoods();
  }

  private initializeSampleGoods() {
    const sampleSkills: DigitalGoods[] = [
      {
        id: 'skill-weather',
        developerId: 'system',
        type: 'skill',
        name: 'Weather Oracle',
        description: 'Provides weather forecasts for any location',
        iconUrl: '/api/marketplace/goods/skill-weather/icon',
        price: 10,
        pricingType: 'one-time',
        category: 'utility',
        parameters: [
          {
            name: 'location',
            type: 'string',
            required: true,
            description: 'City name or coordinates'
          },
          {
            name: 'days',
            type: 'number',
            required: false,
            default: 1,
            min: 1,
            max: 7,
            description: 'Number of days to forecast'
          }
        ],
        apiSpec: {
          endpoint: '/api/marketplace/skills/weather',
          method: 'POST'
        },
        stats: { purchases: 0, rating: 0, uses: 0 },
        publishedAt: new Date()
      },
      {
        id: 'skill-translation',
        developerId: 'system',
        type: 'skill',
        name: 'Universal Translator',
        description: 'Translates text between multiple languages',
        iconUrl: '/api/marketplace/goods/skill-translation/icon',
        price: 25,
        pricingType: 'one-time',
        category: 'utility',
        parameters: [
          {
            name: 'text',
            type: 'string',
            required: true,
            description: 'Text to translate'
          },
          {
            name: 'fromLang',
            type: 'string',
            required: true,
            description: 'Source language code (e.g., en, zh, es)'
          },
          {
            name: 'toLang',
            type: 'string',
            required: true,
            description: 'Target language code (e.g., en, zh, es)'
          }
        ],
        apiSpec: {
          endpoint: '/api/marketplace/skills/translate',
          method: 'POST'
        },
        stats: { purchases: 0, rating: 0, uses: 0 },
        publishedAt: new Date()
      }
    ];

    sampleSkills.forEach(skill => this.goods.set(skill.id, skill));
  }

  // FR-MP.1: Browse goods
  browseGoods(filter?: {
    type?: GoodsType;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    pricingType?: PricingType;
    featured?: boolean;
  }): DigitalGoods[] {
    let results = Array.from(this.goods.values());

    if (filter) {
      if (filter.type) {
        results = results.filter(g => g.type === filter.type);
      }
      if (filter.category) {
        results = results.filter(g => g.category === filter.category);
      }
      if (filter.minPrice !== undefined) {
        results = results.filter(g => g.price >= filter.minPrice!);
      }
      if (filter.maxPrice !== undefined) {
        results = results.filter(g => g.price <= filter.maxPrice!);
      }
      if (filter.pricingType) {
        results = results.filter(g => g.pricingType === filter.pricingType);
      }
    }

    return results;
  }

  // FR-MP.1: Get goods details
  getGoodsById(goodsId: string): DigitalGoods | undefined {
    return this.goods.get(goodsId);
  }

  // FR-MP.6: Publish new goods
  publishGoods(goods: Omit<DigitalGoods, 'id' | 'stats' | 'publishedAt'>): DigitalGoods {
    const id = `${goods.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newGoods: DigitalGoods = {
      ...goods,
      id,
      stats: {
        purchases: 0,
        rating: 0,
        uses: 0
      },
      publishedAt: new Date()
    };

    this.goods.set(id, newGoods);
    return newGoods;
  }

  // FR-MP.5: Purchase validation
  private validatePurchase(
    goods: DigitalGoods,
    buyerType: 'owner' | 'dime',
    dimeId?: string
  ): { valid: boolean; error?: string } {
    // For owner purchases, no scope validation needed
    if (buyerType === 'owner') {
      return { valid: true };
    }

    // For dime purchases, check DimeScope
    if (!dimeId) {
      return { valid: false, error: 'dimeId is required for dime purchases' };
    }

    const scope = this.dimeScopes.get(dimeId);
    if (!scope) {
      return { valid: false, error: 'DimeScope not found' };
    }

    // Reset daily/monthly spend if needed
    this.resetSpendIfNeeded(scope);

    // Check max spend per transaction
    if (goods.price > scope.maxSpendPerTransaction) {
      return {
        valid: false,
        error: `Price ${goods.price} exceeds max spend per transaction ${scope.maxSpendPerTransaction}`
      };
    }

    // Check daily limit
    if (scope.dailySpend + goods.price > scope.dailyLimit) {
      return {
        valid: false,
        error: `Purchase would exceed daily limit of ${scope.dailyLimit} vCoins`
      };
    }

    // Check monthly budget
    if (scope.monthlySpend + goods.price > scope.monthlyBudget) {
      return {
        valid: false,
        error: `Purchase would exceed monthly budget of ${scope.monthlyBudget} vCoins`
      };
    }

    // Check type restrictions
    if (scope.allowedTypes.length > 0 && !scope.allowedTypes.includes(goods.type)) {
      return {
        valid: false,
        error: `Goods type '${goods.type}' not allowed for this dime`
      };
    }

    // Check category restrictions
    if (scope.allowedCategories.length > 0 && !scope.allowedCategories.includes(goods.category)) {
      return {
        valid: false,
        error: `Category '${goods.category}' not allowed for this dime`
      };
    }

    return { valid: true };
  }

  private resetSpendIfNeeded(scope: DimeScope) {
    const now = new Date();
    const lastReset = new Date(scope.lastResetDate);

    // Reset daily spend if new day
    if (now.getDate() !== lastReset.getDate() ||
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()) {
      scope.dailySpend = 0;
    }

    // Reset monthly spend if new month
    if (now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()) {
      scope.monthlySpend = 0;
    }

    scope.lastResetDate = now;
    this.dimeScopes.set(scope.dimeId, scope);
  }

  // FR-MP.2 & FR-MP.3: Purchase goods
  purchaseGoods(
    goodsId: string,
    buyerType: 'owner' | 'dime',
    dimeId: string,
    purchaserId: string  // ownerId for owner purchases, dimeId for dime purchases
  ): { success: boolean; error?: string; dimeGoods?: DimeGoods } {
    const goods = this.goods.get(goodsId);
    if (!goods) {
      return { success: false, error: 'Goods not found' };
    }

    // Validate purchase
    const validation = this.validatePurchase(goods, buyerType, buyerType === 'dime' ? dimeId : undefined);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if already owned
    const existing = Array.from(this.dimeGoods.values())
      .find(dg => dg.goodsId === goodsId && dg.dimeId === dimeId);
    if (existing) {
      return { success: false, error: 'Goods already owned by this dime' };
    }

    // Update goods stats
    goods.stats.purchases += 1;
    this.goods.set(goodsId, goods);

    // Create DimeGoods record
    const dimeGoodsId = `dg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dimeGoods: DimeGoods = {
      id: dimeGoodsId,
      goodsId,
      dimeId,
      purchasedBy: buyerType,
      status: 'owned',
      config: {},  // Initialize with empty config
      purchasedAt: new Date()
    };

    this.dimeGoods.set(dimeGoodsId, dimeGoods);

    // Update DimeScope if dime purchased
    if (buyerType === 'dime') {
      const scope = this.dimeScopes.get(dimeId);
      if (scope) {
        scope.dailySpend += goods.price;
        scope.monthlySpend += goods.price;
        this.dimeScopes.set(dimeId, scope);
      }
    }

    return { success: true, dimeGoods };
  }

  // FR-MP.4: Set or update DimeScope
  setDimeScope(scope: DimeScope): DimeScope {
    scope.lastResetDate = scope.lastResetDate || new Date();
    scope.dailySpend = 0;
    scope.monthlySpend = 0;
    this.dimeScopes.set(scope.dimeId, scope);
    return scope;
  }

  // Get DimeScope
  getDimeScope(dimeId: string): DimeScope | undefined {
    const scope = this.dimeScopes.get(dimeId);
    if (scope) {
      this.resetSpendIfNeeded(scope);
    }
    return scope;
  }

  // List owned goods
  listOwnedGoods(dimeId: string): DimeGoods[] {
    return Array.from(this.dimeGoods.values())
      .filter(dg => dg.dimeId === dimeId);
  }

  // Equipped goods
  listEquippedGoods(dimeId: string): DimeGoods[] {
    return Array.from(this.dimeGoods.values())
      .filter(dg => dg.dimeId === dimeId && dg.status === 'equipped');
  }

  // Equip goods
  equipGoods(dimeGoodsId: string): { success: boolean; error?: string } {
    const dimeGoods = this.dimeGoods.get(dimeGoodsId);
    if (!dimeGoods) {
      return { success: false, error: 'DimeGoods not found' };
    }

    if (dimeGoods.status === 'equipped') {
      return { success: true };  // Already equipped
    }

    dimeGoods.status = 'equipped';
    dimeGoods.equippedAt = new Date();
    this.dimeGoods.set(dimeGoodsId, dimeGoods);

    return { success: true };
  }

  // Unequip goods
  unequipGoods(dimeGoodsId: string): { success: boolean; error?: string } {
    const dimeGoods = this.dimeGoods.get(dimeGoodsId);
    if (!dimeGoods) {
      return { success: false, error: 'DimeGoods not found' };
    }

    if (dimeGoods.status !== 'equipped') {
      return { success: true };  // Already unequipped
    }

    dimeGoods.status = 'owned';
    delete dimeGoods.equippedAt;
    this.dimeGoods.set(dimeGoodsId, dimeGoods);

    return { success: true };
  }

  // Configure goods (per-dime parameters)
  configureGoods(dimeGoodsId: string, config: Record<string, any>): { success: boolean; error?: string } {
    const dimeGoods = this.dimeGoods.get(dimeGoodsId);
    if (!dimeGoods) {
      return { success: false, error: 'DimeGoods not found' };
    }

    const goods = this.goods.get(dimeGoods.goodsId);
    if (!goods) {
      return { success: false, error: 'Goods not found' };
    }

    // Validate config against parameters
    if (goods.parameters) {
      for (const param of goods.parameters) {
        if (param.required && !(param.name in config)) {
          return { success: false, error: `Missing required parameter: ${param.name}` };
        }
      }
    }

    dimeGoods.config = config;
    this.dimeGoods.set(dimeGoodsId, dimeGoods);

    return { success: true };
  }

  // ================= FR-SKILL: Skills-Specific Functions =================

  // Execute a skill
  executeSkill(
    skillId: string,
    executorDimeId: string,
    parameters: Record<string, any>,
    providerDimeId?: string  // For D2D skill sharing
  ): { success: boolean; error?: string; execution?: SkillExecution } {
    const goods = this.goods.get(skillId);
    if (!goods) {
      return { success: false, error: 'Skill not found' };
    }

    if (goods.type !== 'skill') {
      return { success: false, error: 'Goods is not a skill' };
    }

    // Verify executor owns the skill
    const owned = Array.from(this.dimeGoods.values())
      .find(dg => dg.goodsId === skillId && dg.dimeId === executorDimeId && dg.status === 'owned');

    if (!owned) {
      return { success: false, error: 'Dime does not own this skill' };
    }

    // If D2D skill sharing, verify provider offers this skill
    if (providerDimeId) {
      const offer = Array.from(this.d2dOffers.values())
        .find(o => o.skillId === skillId && o.providerDimeId === providerDimeId && o.availability === 'available');

      if (!offer) {
        return { success: false, error: 'D2D skill offer not found or not available' };
      }
    }

    // Create execution record
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execution: SkillExecution = {
      id: executionId,
      skillId,
      executorDimeId,
      providerDimeId,
      parameters,
      status: 'running',
      startTime: new Date()
    };

    this.skillExecutions.set(executionId, execution);

    // Update goods usage stats
    goods.stats.uses += 1;
    this.goods.set(skillId, goods);

    // Simulate skill execution (in real implementation, this would call the skill's API)
    // For MVP, we'll just mark as completed with a mock result
    setTimeout(() => {
      const updatedExecution = this.skillExecutions.get(executionId);
      if (updatedExecution) {
        updatedExecution.status = 'completed';
        updatedExecution.endTime = new Date();
        updatedExecution.result = {
          success: true,
          output: `Skill executed with parameters: ${JSON.stringify(parameters)}`
        };
        this.skillExecutions.set(executionId, updatedExecution);

        // Update provider reputation for D2D
        if (providerDimeId) {
          const offer = Array.from(this.d2dOffers.values())
            .find(o => o.skillId === skillId && o.providerDimeId === providerDimeId);
          if (offer) {
            offer.totalExecutions += 1;
            offer.reputation = Math.min(100, offer.reputation + 1);
            this.d2dOffers.set(offer.id, offer);
          }
        }
      }
    }, 100);  // Simulate async execution

    return { success: true, execution };
  }

  // Get skill execution status
  getExecution(executionId: string): SkillExecution | undefined {
    return this.skillExecutions.get(executionId);
  }

  // List executions for a dime
  listExecutions(dimeId: string, skillId?: string): SkillExecution[] {
    let executions = Array.from(this.skillExecutions.values())
      .filter(e => e.executorDimeId === dimeId);

    if (skillId) {
      executions = executions.filter(e => e.skillId === skillId);
    }

    return executions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // Get skill configuration schema
  getSkillConfig(skillId: string): { success: boolean; error?: string; parameters?: GoodsParameter[]; apiSpec?: any } {
    const goods = this.goods.get(skillId);
    if (!goods) {
      return { success: false, error: 'Skill not found' };
    }

    if (goods.type !== 'skill') {
      return { success: false, error: 'Goods is not a skill' };
    }

    return {
      success: true,
      parameters: goods.parameters,
      apiSpec: goods.apiSpec
    };
  }

  // Review a skill
  reviewSkill(
    skillId: string,
    reviewerDimeId: string,
    rating: number,
    comment?: string
  ): { success: boolean; error?: string } {
    const goods = this.goods.get(skillId);
    if (!goods) {
      return { success: false, error: 'Skill not found' };
    }

    if (goods.type !== 'skill') {
      return { success: false, error: 'Goods is not a skill' };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Verify reviewer has used the skill
    const hasUsed = Array.from(this.skillExecutions.values())
      .some(e => e.skillId === skillId && e.executorDimeId === reviewerDimeId && e.status === 'completed');

    if (!hasUsed) {
      return { success: false, error: 'Reviewer has not used this skill' };
    }

    // Create review
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const review: SkillReview = {
      id: reviewId,
      skillId,
      reviewerDimeId,
      rating,
      comment,
      createdAt: new Date()
    };

    this.skillReviews.set(reviewId, review);

    // Update goods rating
    const reviews = Array.from(this.skillReviews.values()).filter(r => r.skillId === skillId);
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    goods.stats.rating = Math.round(avgRating * 10) / 10;
    this.goods.set(skillId, goods);

    return { success: true };
  }

  // List reviews for a skill
  listReviews(skillId: string): SkillReview[] {
    return Array.from(this.skillReviews.values())
      .filter(r => r.skillId === skillId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // FR-Skill: D2D Skill Sharing - Register to offer skill
  registerSkillOffer(
    providerDimeId: string,
    skillId: string,
    pricePerUse: number
  ): { success: boolean; error?: string; offer?: D2DSkillOffer } {
    const goods = this.goods.get(skillId);
    if (!goods) {
      return { success: false, error: 'Skill not found' };
    }

    if (goods.type !== 'skill') {
      return { success: false, error: 'Goods is not a skill' };
    }

    // Verify provider owns the skill
    const owned = Array.from(this.dimeGoods.values())
      .find(dg => dg.goodsId === skillId && dg.dimeId === providerDimeId);

    if (!owned) {
      return { success: false, error: 'Provider does not own this skill' };
    }

    // Check if provider already offers this skill
    const existing = Array.from(this.d2dOffers.values())
      .find(o => o.providerDimeId === providerDimeId && o.skillId === skillId);

    if (existing) {
      existing.pricePerUse = pricePerUse;
      existing.availability = 'available';
      this.d2dOffers.set(existing.id, existing);
      return { success: true, offer: existing };
    }

    // Create new offer
    const offerId = `d2d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const offer: D2DSkillOffer = {
      id: offerId,
      providerDimeId,
      skillId,
      pricePerUse,
      availability: 'available',
      reputation: 50,  // Start with neutral reputation
      totalExecutions: 0,
      createdAt: new Date()
    };

    this.d2dOffers.set(offerId, offer);
    return { success: true, offer };
  }

  // List available D2D skill offers
  listD2DOffers(skillId?: string): D2DSkillOffer[] {
    let offers = Array.from(this.d2dOffers.values())
      .filter(o => o.availability === 'available');

    if (skillId) {
      offers = offers.filter(o => o.skillId === skillId);
    }

    return offers.sort((a, b) => b.reputation - a.reputation);
  }

  // Update offer availability
  updateOfferAvailability(offerId: string, availability: 'available' | 'busy' | 'offline'): { success: boolean; error?: string } {
    const offer = this.d2dOffers.get(offerId);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    offer.availability = availability;
    this.d2dOffers.set(offerId, offer);
    return { success: true };
  }

  // Get skill reputation stats
  getSkillReputation(skillId: string): {
    totalExecutions: number;
    avgRating: number;
    d2dOffersCount: number;
  } {
    const goods = this.goods.get(skillId);
    if (!goods) {
      return { totalExecutions: 0, avgRating: 0, d2dOffersCount: 0 };
    }

    const reviews = Array.from(this.skillReviews.values()).filter(r => r.skillId === skillId);
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const d2dOffers = Array.from(this.d2dOffers.values()).filter(o => o.skillId === skillId);

    return {
      totalExecutions: goods.stats.uses,
      avgRating: Math.round(avgRating * 10) / 10,
      d2dOffersCount: d2dOffers.length
    };
  }
}

// Singleton instance
export const marketplaceService = new MarketplaceService();
