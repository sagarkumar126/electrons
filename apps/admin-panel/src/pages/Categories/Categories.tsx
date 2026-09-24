import { useEffect, useState } from "react"
import { adminApi } from "../../api/admin.api"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newSub, setNewSub] = useState("")
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await adminApi.getCategories()
      setCategories(res.data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategory.trim()) return alert("Please enter category name")
    try {
      setSaving(true)
      await adminApi.addCategory(newCategory.trim())
      setNewCategory("")
      fetchCategories()
    } catch (error: any) {
      alert(error.response?.data?.message || "❌ Failed to add category")
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = async (id: string) => {
    if (!editName.trim()) return alert("Please enter category name")
    try {
      await adminApi.updateCategory(id, editName.trim())
      setEditingId(null)
      setEditName("")
      fetchCategories()
    } catch (error) {
      alert("❌ Failed to update category")
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?\nAll sub-categories will also be removed.`)) return
    try {
      await adminApi.deleteCategory(id)
      fetchCategories()
    } catch (error) {
      alert("❌ Failed to delete category")
    }
  }

  // ✅ BULK: comma-separated input
  const addSubBulk = async (categoryId: string) => {
    if (!newSub.trim()) return alert("Enter sub-category name(s)")

    // Split by comma, trim, remove empty
    const list = newSub
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    if (list.length === 0) return alert("Enter valid sub-category name(s)")

    try {
      setSaving(true)
      await adminApi.addSubCategories(categoryId, list)
      setNewSub("")
      fetchCategories()
      alert(`✅ ${list.length} sub-category(ies) added!`)
    } catch (error: any) {
      alert(error.response?.data?.message || "❌ Failed to add sub-category")
    } finally {
      setSaving(false)
    }
  }

  const removeSub = async (categoryId: string, subName: string) => {
    if (!confirm(`Remove "${subName}"?`)) return
    try {
      await adminApi.removeSubCategory(categoryId, subName)
      fetchCategories()
    } catch (error) {
      alert("❌ Failed to remove sub-category")
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCategories = categories.length
  const totalSubCategories = categories.reduce(
    (sum, c) => sum + (c.subCategories?.length || 0),
    0
  )

  if (loading) return <LoadingSpinner message="Loading categories..." />

  return (
    <div style={page}>

      {/* ============ HEADER ============ */}
      <div style={header}>
        <div>
          <h1 style={pageTitle}>🏷️ Categories</h1>
          <p style={pageSubtitle}>
            Manage product categories and sub-categories for the entire platform
          </p>
        </div>
      </div>

      {/* ============ STATS ============ */}
      <div style={statsGrid}>
        <div style={statCard}>
          <div style={{ ...statIcon, background: "#dbeafe" }}>📦</div>
          <div>
            <h3 style={statValue}>{totalCategories}</h3>
            <p style={statLabel}>Total Categories</p>
          </div>
        </div>
        <div style={statCard}>
          <div style={{ ...statIcon, background: "#dcfce7" }}>📂</div>
          <div>
            <h3 style={statValue}>{totalSubCategories}</h3>
            <p style={statLabel}>Total Sub-categories</p>
          </div>
        </div>
        <div style={statCard}>
          <div style={{ ...statIcon, background: "#fef3c7" }}>🔍</div>
          <div>
            <h3 style={statValue}>{filteredCategories.length}</h3>
            <p style={statLabel}>Showing</p>
          </div>
        </div>
      </div>

      {/* ============ ADD CATEGORY + SEARCH ============ */}
      <div style={toolbar}>
        <div style={addBox}>
          <input
            type="text"
            placeholder="✨ Enter new category name (e.g., Smart Home Devices)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={input}
            onKeyPress={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            disabled={saving || !newCategory.trim()}
            style={{
              ...addBtn,
              opacity: saving || !newCategory.trim() ? 0.6 : 1,
              cursor: saving || !newCategory.trim() ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Adding..." : "+ Add Category"}
          </button>
        </div>

        <div style={searchBox}>
          <span style={searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInput}
          />
        </div>
      </div>

      {/* ============ CATEGORIES LIST ============ */}
      {filteredCategories.length === 0 ? (
        <div style={emptyState}>
          <div style={emptyIcon}>🏷️</div>
          <h3 style={emptyTitle}>
            {searchQuery ? "No categories match your search" : "No categories yet"}
          </h3>
          <p style={emptyText}>
            {searchQuery
              ? `Try a different search term`
              : `Click "+ Add Category" above to create your first category.`}
          </p>
        </div>
      ) : (
        <div style={list}>
          {filteredCategories.map((cat) => {
            const subs = cat.subCategories || []
            const isExpanded = expandedId === cat._id
            const isEditing = editingId === cat._id

            return (
              <div key={cat._id} style={card}>
                {/* ---- CARD ROW ---- */}
                {isEditing ? (
                  <div style={editRow}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ ...input, flex: 1 }}
                      autoFocus
                      onKeyPress={(e) => e.key === "Enter" && updateCategory(cat._id)}
                    />
                    <button
                      style={{ ...btnGreen }}
                      onClick={() => updateCategory(cat._id)}
                    >
                      ✅ Save
                    </button>
                    <button
                      style={{ ...btnGray }}
                      onClick={() => { setEditingId(null); setEditName("") }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={cardRow}>
                    <div style={cardLeft}>
                      <div style={categoryIcon}>📦</div>
                      <div>
                        <div style={categoryName}>{cat.name}</div>
                        <div style={categoryMeta}>
                          {subs.length} sub-categor{subs.length === 1 ? "y" : "ies"}
                          {cat.productCount ? ` · ${cat.productCount} products` : ""}
                        </div>
                      </div>
                    </div>

                    <div style={cardActions}>
                      <button
                        style={{
                          ...actionBtn,
                          background: isExpanded ? "#7c3aed" : "#ede9fe",
                          color: isExpanded ? "white" : "#7c3aed"
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : cat._id)}
                      >
                        {isExpanded ? "▲ Hide Subs" : "▼ Manage Sub-categories"}
                      </button>
                      <button
                        style={{ ...actionBtn, background: "#dbeafe", color: "#1e40af" }}
                        onClick={() => { setEditingId(cat._id); setEditName(cat.name) }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={{ ...actionBtn, background: "#fee2e2", color: "#dc2626" }}
                        onClick={() => deleteCategory(cat._id, cat.name)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* ---- EXPANDED SUB-CATEGORY SECTION ---- */}
                {isExpanded && (
                  <div style={subSection}>
                    <div style={subHeaderRow}>
                      <div style={subHeaderTitle}>
                        📂 Sub-categories under <b>{cat.name}</b>
                      </div>
                    </div>

                    {/* ✅ BULK ADD — comma separated */}
                    <div style={subAddRow}>
                      <input
                        type="text"
                        placeholder="Type sub-categories separated by commas: Smartphones, Tablets, Accessories"
                        value={newSub}
                        onChange={(e) => setNewSub(e.target.value)}
                        style={{ ...input, flex: 1 }}
                        onKeyPress={(e) => e.key === "Enter" && addSubBulk(cat._id)}
                      />
                      <button
                        onClick={() => addSubBulk(cat._id)}
                        disabled={saving || !newSub.trim()}
                        style={{
                          ...btnGreen,
                          opacity: saving || !newSub.trim() ? 0.6 : 1,
                          cursor: saving || !newSub.trim() ? "not-allowed" : "pointer"
                        }}
                      >
                        + Add Sub
                      </button>
                    </div>

                    {subs.length === 0 ? (
                      <div style={subEmpty}>
                        <span style={subEmptyIcon}>📭</span>
                        No sub-categories yet. Add your first one above.
                      </div>
                    ) : (
                      <div style={chipsWrap}>
                        {subs.map((sub: string) => (
                          <div key={sub} style={chip}>
                            <span style={chipText}>{sub}</span>
                            <button
                              style={chipX}
                              onClick={() => removeSub(cat._id, sub)}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ================= STYLES (UNCHANGED) =================

const page = {
  padding: "28px 32px",
  maxWidth: "1200px",
  margin: "0 auto",
  minHeight: "100vh",
  background: "#f8fafc"
}

const header = {
  marginBottom: "24px"
}

const pageTitle = {
  fontSize: "30px",
  fontWeight: "bold" as const,
  color: "#0f172a",
  margin: 0,
  letterSpacing: "-0.5px"
}

const pageSubtitle = {
  fontSize: "14px",
  color: "#64748b",
  marginTop: "6px"
}

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "24px"
}

const statCard = {
  background: "white",
  padding: "18px 20px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
}

const statIcon = {
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  flexShrink: 0
}

const statValue = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#0f172a"
}

const statLabel = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b"
}

const toolbar = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap" as const,
  alignItems: "stretch"
}

const addBox = {
  display: "flex",
  gap: "10px",
  flex: "2 1 400px",
  background: "white",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
}

const searchBox = {
  position: "relative" as const,
  flex: "1 1 240px",
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  display: "flex",
  alignItems: "center"
}

const searchIcon = {
  position: "absolute" as const,
  left: "14px",
  fontSize: "15px",
  color: "#94a3b8",
  pointerEvents: "none" as const
}

const searchInput = {
  width: "100%",
  padding: "14px 14px 14px 40px",
  border: "none",
  borderRadius: "12px",
  fontSize: "14px",
  outline: "none",
  background: "transparent"
}

const input = {
  flex: 1,
  padding: "12px 16px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  background: "white",
  transition: "border-color 0.2s"
}

const addBtn = {
  padding: "12px 24px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600" as const,
  fontSize: "14px",
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
  transition: "all 0.2s",
  whiteSpace: "nowrap" as const
}

const emptyState = {
  textAlign: "center" as const,
  padding: "60px 20px",
  background: "white",
  borderRadius: "16px",
  border: "2px dashed #e2e8f0"
}

const emptyIcon = {
  fontSize: "56px",
  marginBottom: "16px"
}

const emptyTitle = {
  fontSize: "20px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 8px 0"
}

const emptyText = {
  fontSize: "14px",
  color: "#64748b",
  margin: 0
}

const list = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px"
}

const card = {
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  transition: "all 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
}

const cardRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px",
  gap: "12px",
  flexWrap: "wrap" as const
}

const cardLeft = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flex: 1,
  minWidth: "200px"
}

const categoryIcon = {
  width: "44px",
  height: "44px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  flexShrink: 0
}

const categoryName = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#0f172a",
  marginBottom: "2px"
}

const categoryMeta = {
  fontSize: "13px",
  color: "#64748b"
}

const cardActions = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const
}

const actionBtn = {
  padding: "8px 14px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600" as const,
  transition: "all 0.15s",
  whiteSpace: "nowrap" as const
}

const editRow = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  padding: "16px 20px"
}

const btnGreen = {
  padding: "12px 20px",
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600" as const,
  fontSize: "14px",
  transition: "all 0.2s"
}

const btnGray = {
  padding: "12px 20px",
  background: "#f1f5f9",
  color: "#475569",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600" as const,
  fontSize: "14px",
  transition: "all 0.2s"
}

const subSection = {
  padding: "20px",
  borderTop: "1px solid #f1f5f9",
  background: "linear-gradient(180deg, #fafbfc, #ffffff)"
}

const subHeaderRow = {
  marginBottom: "14px"
}

const subHeaderTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#334155"
}

const subAddRow = {
  display: "flex",
  gap: "10px",
  marginBottom: "16px"
}

const subEmpty = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "16px",
  background: "#f8fafc",
  borderRadius: "8px",
  border: "1px dashed #cbd5e1",
  color: "#94a3b8",
  fontSize: "13px"
}

const subEmptyIcon = {
  fontSize: "20px"
}

const chipsWrap = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const
}

const chip = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px 8px 16px",
  background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
  border: "1px solid #c4b5fd",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "500" as const,
  color: "#5b21b6",
  transition: "all 0.15s"
}

const chipText = {
  lineHeight: "1"
}

const chipX = {
  background: "rgba(124, 58, 237, 0.15)",
  color: "#7c3aed",
  border: "none",
  borderRadius: "50%",
  width: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  transition: "all 0.15s"
}

export default Categories