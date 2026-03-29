import { useState, useEffect } from 'react'
import './pages.css'

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api`

interface Goods {
  id: string
  name: string
  description: string
  type: string
  price: number
  currency: string
  parameters?: any[]
  apiSpec?: any
}

interface DimeGoods {
  id: string
  goodsId: string
  dimeId: string
  status: string
  purchasedAt: string
  equippedAt?: string
  config: any
  goods: Goods
}

interface DimeTransaction {
  id: string
  goodsId: string
  dimeId: string
  purchasedBy: 'owner' | 'dime'
  status: string
  purchasedAt: string
  goodsName: string
  goodsDescription: string
  price: number
  goodsType: string
}

interface SpendingSummary {
  totalSpent: number
  dimeSpent: number
  ownerSpent: number
}

interface Props {
  ownerId: string
  dimeId?: string
}

export default function Marketplace({ ownerId, dimeId }: Props) {
  const [goods, setGoods] = useState<Goods[]>([])
  const [myGoods, setMyGoods] = useState<DimeGoods[]>([])
  const [activeTab, setActiveTab] = useState<'browse' | 'inventory' | 'scope' | 'spending'>('browse')
  const [spendingFilter, setSpendingFilter] = useState<'all' | 'dime' | 'owner'>('all')
  const [dimeTransactions, setDimeTransactions] = useState<DimeTransaction[]>([])
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary>({ totalSpent: 0, dimeSpent: 0, ownerSpent: 0 })
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [scope, setScope] = useState<any>(null)
  const [selectedGoods, setSelectedGoods] = useState<Goods | null>(null)

  useEffect(() => {
    fetchGoods()
    if (dimeId) {
      fetchMyGoods()
      fetchScope()
      fetchDimeSpending()
    }
  }, [dimeId])

  const fetchGoods = async () => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/goods`)
      const data = await res.json()
      if (data.success) setGoods(data.data || [])
    } catch (err) {
      console.error('Failed to fetch goods:', err)
    }
    setLoading(false)
  }

  const fetchMyGoods = async () => {
    if (!dimeId) return
    try {
      const res = await fetch(`${API_BASE}/marketplace/dimes/${dimeId}/goods`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) setMyGoods(data.data || [])
    } catch (err) {
      console.error('Failed to fetch my goods:', err)
    }
  }

  const fetchScope = async () => {
    if (!dimeId) return
    try {
      const res = await fetch(`${API_BASE}/marketplace/dimes/${dimeId}/scope`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) setScope(data.data)
    } catch (err) {
      console.error('Failed to fetch scope:', err)
    }
  }

  const fetchDimeSpending = async () => {
    if (!dimeId) return
    try {
      const res = await fetch(`${API_BASE}/marketplace/dimes/${dimeId}/transactions`, {
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        setDimeTransactions(data.data || [])
        setSpendingSummary(data.summary || { totalSpent: 0, dimeSpent: 0, ownerSpent: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch dime spending:', err)
    }
  }

  const purchase = async (goodsId: string, asDime: boolean) => {
    setPurchasing(goodsId)
    try {
      const body: any = { goodsId, buyerType: asDime ? 'dime' : 'owner' }
      if (asDime && dimeId) {
        body.dimeId = dimeId
      } else {
        body.ownerId = ownerId
      }

      const res = await fetch(`${API_BASE}/marketplace/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (data.success) {
        alert(asDime ? 'Dime purchased successfully!' : 'Purchased for your dime!')
        fetchMyGoods()
      } else {
        alert(data.error || 'Purchase failed')
      }
    } catch (err) {
      alert('Purchase failed')
    }
    setPurchasing(null)
  }

  const equip = async (dimeGoodsId: string) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/dime-goods/${dimeGoodsId}/equip`, {
        method: 'POST',
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        fetchMyGoods()
      }
    } catch (err) {
      console.error('Failed to equip:', err)
    }
  }

  const unequip = async (dimeGoodsId: string) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/dime-goods/${dimeGoodsId}/unequip`, {
        method: 'POST',
        headers: { 'x-owner-id': ownerId }
      })
      const data = await res.json()
      if (data.success) {
        fetchMyGoods()
      }
    } catch (err) {
      console.error('Failed to unequip:', err)
    }
  }

  const getGoodsIcon = (type: string) => {
    switch (type) {
      case 'skill': return '⚡'
      case 'icon': return '🖼️'
      case 'badge': return '🏆'
      case 'theme': return '🎨'
      case 'avatar': return '👤'
      case 'pack': return '📦'
      default: return '📦'
    }
  }

  if (loading) return <div className="page-loading">Loading marketplace...</div>

  return (
    <div className="page marketplace">
      <div className="page-header">
        <h1>Marketplace</h1>
        <p className="subtitle">Digital goods for your dimes</p>
      </div>

      <div className="marketplace-tabs">
        <button className={`tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          Browse Goods
        </button>
        <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          My Inventory
        </button>
        {dimeId && (
          <button className={`tab ${activeTab === 'scope' ? 'active' : ''}`} onClick={() => setActiveTab('scope')}>
            DimeScope
          </button>
        )}
        {dimeId && (
          <button className={`tab ${activeTab === 'spending' ? 'active' : ''}`} onClick={() => { setActiveTab('spending'); fetchDimeSpending(); }}>
            Dime Spending
          </button>
        )}
      </div>

      {activeTab === 'browse' && (
        <div className="goods-grid">
          {goods.map(item => (
            <div key={item.id} className="goods-card glass-panel" onClick={() => setSelectedGoods(item)}>
              <div className="goods-icon">{getGoodsIcon(item.type)}</div>
              <div className="goods-info">
                <h3>{item.name}</h3>
                <p className="goods-type">{item.type}</p>
                <p className="goods-desc">{item.description}</p>
              </div>
              <div className="goods-price">
                <span className="price">{item.price}</span>
                <span className="currency">{item.currency}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="inventory-list">
          {myGoods.length === 0 ? (
            <div className="empty-state glass-panel">
              <p>No goods yet. Browse the marketplace to purchase!</p>
            </div>
          ) : (
            myGoods.map(item => (
              <div key={item.id} className="inventory-item glass-panel">
                <div className="item-icon">{getGoodsIcon(item.goods?.type || 'other')}</div>
                <div className="item-info">
                  <h3>{item.goods?.name}</h3>
                  <p className="item-status">
                    Status: <span className={item.status}>{item.status}</span>
                  </p>
                </div>
                <div className="item-actions">
                  {item.status === 'purchased' && (
                    <button className="btn-primary btn-small" onClick={() => equip(item.id)}>Equip</button>
                  )}
                  {item.status === 'equipped' && (
                    <button className="btn-secondary btn-small" onClick={() => unequip(item.id)}>Unequip</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'scope' && scope && (
        <div className="scope-panel glass-panel">
          <h2>DimeScope</h2>
          <p className="scope-desc">Spending limits for your dime's marketplace purchases</p>

          <div className="scope-grid">
            <div className="scope-item">
              <label>Max Spend Per Transaction</label>
              <span className="scope-value">{scope.maxSpendPerTransaction} vCoin</span>
            </div>
            <div className="scope-item">
              <label>Daily Limit</label>
              <span className="scope-value">{scope.dailyLimit} vCoin</span>
            </div>
            <div className="scope-item">
              <label>Monthly Budget</label>
              <span className="scope-value">{scope.monthlyBudget} vCoin</span>
            </div>
          </div>

          {scope.allowedCategories && scope.allowedCategories.length > 0 && (
            <div className="scope-categories">
              <label>Allowed Categories</label>
              <div className="category-tags">
                {scope.allowedCategories.map((cat: string) => (
                  <span key={cat} className="tag">{cat}</span>
                ))}
              </div>
            </div>
          )}

          {scope.allowedTypes && scope.allowedTypes.length > 0 && (
            <div className="scope-types">
              <label>Allowed Types</label>
              <div className="category-tags">
                {scope.allowedTypes.map((type: string) => (
                  <span key={type} className="tag">{type}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'spending' && (
        <div className="spending-panel">
          <div className="spending-summary glass-panel">
            <h2>Dime Spending Tracker</h2>
            <p className="spending-desc">Track what your dime has purchased</p>

            <div className="spending-stats">
              <div className="spending-stat">
                <label>Total Spent</label>
                <span className="stat-value spending-total">{spendingSummary.totalSpent}</span>
                <span className="stat-currency">vCoin</span>
              </div>
              <div className="spending-stat dime">
                <label>Dime Purchases</label>
                <span className="stat-value">{spendingSummary.dimeSpent}</span>
                <span className="stat-currency">vCoin</span>
              </div>
              <div className="spending-stat owner">
                <label>Owner Purchases</label>
                <span className="stat-value">{spendingSummary.ownerSpent}</span>
                <span className="stat-currency">vCoin</span>
              </div>
            </div>

            <div className="spending-filters">
              <button
                className={`filter-btn ${spendingFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSpendingFilter('all')}
              >
                All Purchases
              </button>
              <button
                className={`filter-btn ${spendingFilter === 'dime' ? 'active' : ''}`}
                onClick={() => setSpendingFilter('dime')}
              >
                Dime Purchases
              </button>
              <button
                className={`filter-btn ${spendingFilter === 'owner' ? 'active' : ''}`}
                onClick={() => setSpendingFilter('owner')}
              >
                Owner Purchases
              </button>
            </div>
          </div>

          <div className="transactions-list">
            {dimeTransactions.length === 0 ? (
              <div className="empty-state glass-panel">
                <p>No purchases yet. Browse the marketplace to get started!</p>
              </div>
            ) : (
              dimeTransactions
                .filter(t => spendingFilter === 'all' || t.purchasedBy === spendingFilter)
                .map(transaction => (
                  <div key={transaction.id} className={`transaction-item glass-panel ${transaction.purchasedBy}`}>
                    <div className="transaction-icon">{getGoodsIcon(transaction.goodsType)}</div>
                    <div className="transaction-info">
                      <h3>{transaction.goodsName}</h3>
                      <p className="transaction-desc">{transaction.goodsDescription}</p>
                      <p className="transaction-date">
                        {new Date(transaction.purchasedAt).toLocaleDateString()} at{' '}
                        {new Date(transaction.purchasedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="transaction-meta">
                      <span className={`purchaser-badge ${transaction.purchasedBy}`}>
                        {transaction.purchasedBy === 'dime' ? 'Dime' : 'Owner'}
                      </span>
                      <span className="transaction-price">
                        {transaction.price} <span className="currency">vCoin</span>
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {selectedGoods && (
        <div className="modal-overlay" onClick={() => setSelectedGoods(null)}>
          <div className="modal glass-panel" onClick={e => e.stopPropagation()}>
            <h2>{selectedGoods.name}</h2>
            <p className="modal-type">{selectedGoods.type}</p>
            <p className="modal-desc">{selectedGoods.description}</p>

            {selectedGoods.parameters && selectedGoods.parameters.length > 0 && (
              <div className="modal-params">
                <h4>Parameters</h4>
                {selectedGoods.parameters.map((p: any, i: number) => (
                  <div key={i} className="param">
                    <span className="param-name">{p.name}</span>
                    <span className="param-required">{p.required ? 'required' : 'optional'}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-price">
              <span className="price">{selectedGoods.price}</span>
              <span className="currency">{selectedGoods.currency}</span>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedGoods(null)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={purchasing === selectedGoods.id}
                onClick={() => purchase(selectedGoods.id, false)}
              >
                {purchasing === selectedGoods.id ? 'Purchasing...' : 'Buy as Owner'}
              </button>
              {dimeId && (
                <button
                  className="btn-accent"
                  disabled={purchasing === selectedGoods.id}
                  onClick={() => purchase(selectedGoods.id, true)}
                >
                  Dime Buys
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
