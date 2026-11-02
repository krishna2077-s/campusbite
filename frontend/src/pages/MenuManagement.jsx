import React, { useEffect, useState, useCallback } from 'react'
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } from '../api/api'
import MenuItemCard from '../components/MenuItemCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  is_available: true,
}

export default function MenuManagement() {
  const { user } = useAuth()
  const restaurantId = user?.restaurant_id || user?.restaurantId

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const fetchMenu = useCallback(() => {
    if (!restaurantId) {
      setError('No restaurant linked to this account.')
      setLoading(false)
      return
    }
    setLoading(true)
    getMenu(restaurantId)
      .then((res) => {
        const data = res.data
        setItems(Array.isArray(data) ? data : data.items || data.menu || [])
      })
      .catch(() => setError('Failed to load menu items.'))
      .finally(() => setLoading(false))
  }, [restaurantId])

  useEffect(() => { fetchMenu() }, [fetchMenu])

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || '',
      image: item.image || '',
      is_available: item.is_available !== false,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errs.price = 'Valid price is required'
    return errs
  }

  const handleSave = async () => {
    const errs = validateForm()
    if (Object.keys(errs).length) { setFormErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        restaurant_id: restaurantId,
      }
      if (editItem) {
        await updateMenuItem(editItem.id || editItem._id, payload)
      } else {
        await addMenuItem(restaurantId, payload)
      }
      setShowModal(false)
      fetchMenu()
    } catch (e) {
      setFormErrors({ api: e.response?.data?.detail || e.response?.data?.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return
    try {
      await deleteMenuItem(id)
      fetchMenu()
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed')
    }
  }

  const handleToggle = async (id) => {
    try {
      await toggleAvailability(id)
      fetchMenu()
    } catch (e) {
      alert(e.response?.data?.detail || 'Toggle failed')
    }
  }

  const filtered = items.filter(item =>
    !search || item.name?.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🍽️ Menu Management</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Item
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-grid mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card info">
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-value">{items.length}</div>
          <div className="stat-card-label">Total Items</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-value">{items.filter(i => i.is_available !== false).length}</div>
          <div className="stat-card-label">Available</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon">⏸</div>
          <div className="stat-card-value">{items.filter(i => i.is_available === false).length}</div>
          <div className="stat-card-label">Unavailable</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-filter-bar mb-3">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search menu items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <LoadingSpinner text="Loading menu..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🍽️</span>
          <h3>No menu items</h3>
          <p>Add your first menu item to get started</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
        </div>
      ) : (
        <div>
          {/* Group by category */}
          {categories.length > 0 ? categories.map(cat => {
            const catItems = filtered.filter(i => i.category === cat)
            if (!catItems.length) return null
            return (
              <div key={cat} style={{ marginBottom: 28 }}>
                <h3 style={{ marginBottom: 14, color: 'var(--primary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {cat}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {catItems.map(item => (
                    <MenuItemCard
                      key={item.id || item._id}
                      item={item}
                      isOwner
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            )
          }) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(item => (
                <MenuItemCard
                  key={item.id || item._id}
                  item={item}
                  isOwner
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit Item' : '+ Add Menu Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formErrors.api && <div className="alert alert-error">{formErrors.api}</div>}

              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'error' : ''}`}
                  placeholder="e.g. Butter Chicken"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && <span className="form-error">⚠ {formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  placeholder="Brief description of the item"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    className={`form-control ${formErrors.price ? 'error' : ''}`}
                    placeholder="0.00"
                    value={form.price}
                    min="0"
                    step="0.01"
                    onChange={e => setForm({ ...form, price: e.target.value })}
                  />
                  {formErrors.price && <span className="form-error">⚠ {formErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Main Course"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {['Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts', 'Salads', 'Soups'].map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.is_available}
                      onChange={e => setForm({ ...form, is_available: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <span className="form-label" style={{ margin: 0 }}>
                    {form.is_available ? '✅ Available' : '⏸ Unavailable'}
                  </span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
