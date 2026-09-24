 
import { useEffect, useState } from "react"
import { adminApi } from "../../api/admin.api"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { formatCurrency, formatDate } from "../../utils/format"

const Products = () => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await adminApi.getAllProducts()
      setProducts(res.data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const approveProduct = async (productId: string) => {
    if (!confirm("Approve this product?")) return
    try {
      await adminApi.approveProduct(productId)
      fetchProducts()
      alert("✅ Product approved!")
    } catch (error) {
      alert("❌ Failed to approve product")
    }
  }

  const rejectProduct = async (productId: string) => {
    if (!confirm("Reject this product?")) return
    const reason = prompt("Reason for rejection:")
    if (reason === null) return
    try {
      await adminApi.rejectProduct(productId, reason)
      fetchProducts()
      alert("❌ Product rejected!")
    } catch (error) {
      alert("❌ Failed to reject product")
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Delete this product permanently?")) return
    try {
      await adminApi.deleteProduct(productId)
      fetchProducts()
      alert("✅ Product deleted!")
    } catch (error) {
      alert("❌ Failed to delete product")
    }
  }

  const filteredProducts = filter === "all" 
    ? products 
    : filter === "approved" 
      ? products.filter(p => p.isApproved) 
      : products.filter(p => !p.isApproved)

  if (loading) {
    return <LoadingSpinner message="Loading products..." />
  }

  return (
    <div>
      <div style={header}>
        <h1 style={title}>📦 Products</h1>
        <p style={subtitle}>Manage all products on the platform</p>
      </div>

      <div style={filterContainer}>
        <button
          style={{ ...filterBtn, background: filter === "all" ? "#2563eb" : "white", color: filter === "all" ? "white" : "#1e293b" }}
          onClick={() => setFilter("all")}
        >
          All ({products.length})
        </button>
        <button
          style={{ ...filterBtn, background: filter === "pending" ? "#2563eb" : "white", color: filter === "pending" ? "white" : "#1e293b" }}
          onClick={() => setFilter("pending")}
        >
          Pending ({products.filter(p => !p.isApproved).length})
        </button>
        <button
          style={{ ...filterBtn, background: filter === "approved" ? "#2563eb" : "white", color: filter === "approved" ? "white" : "#1e293b" }}
          onClick={() => setFilter("approved")}
        >
          Approved ({products.filter(p => p.isApproved).length})
        </button>
      </div>

      <div style={tableWrapper}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Seller</th>
              <th style={th}>Price</th>
              <th style={th}>Category</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id} style={tr}>
                <td style={td}>
                  <div style={productInfo}>
                    <img src={product.image} alt={product.name} style={productImg} />
                    <span style={productName}>{product.name}</span>
                  </div>
                </td>
                <td style={td}>{product.company || "N/A"}</td>
                <td style={td}>{formatCurrency(product.price)}</td>
                <td style={td}>{product.category}</td>
                <td style={td}>
                  <span style={{ ...statusBadge, background: product.isApproved ? "#22c55e" : "#f59e0b" }}>
                    {product.isApproved ? "✅ Approved" : "⏳ Pending"}
                  </span>
                </td>
                <td style={td}>
                  <div style={actionButtons}>
                    {!product.isApproved && (
                      <>
                        <button style={{ ...actionBtn, background: "#22c55e" }} onClick={() => approveProduct(product._id)}>
                          ✅ Approve
                        </button>
                        <button style={{ ...actionBtn, background: "#ef4444" }} onClick={() => rejectProduct(product._id)}>
                          ❌ Reject
                        </button>
                      </>
                    )}
                    <button style={{ ...actionBtn, background: "#dc2626" }} onClick={() => deleteProduct(product._id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const header = {
  marginBottom: "24px"
}

const title = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: 0
}

const subtitle = {
  fontSize: "14px",
  color: "#64748b",
  marginTop: "4px"
}

const filterContainer = {
  display: "flex",
  gap: "8px",
  marginBottom: "20px",
  flexWrap: "wrap" as const
}

const filterBtn = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s ease"
}

const tableWrapper = {
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  overflow: "auto" as const
}

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "700px"
}

const th = {
  padding: "12px 16px",
  textAlign: "left" as const,
  borderBottom: "1px solid #e2e8f0",
  fontWeight: "600",
  color: "#64748b",
  fontSize: "12px",
  textTransform: "uppercase" as const
}

const td = {
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#0f172a"
}

const tr = {
  transition: "all 0.2s ease"
}

const productInfo = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
}

const productImg = {
  width: "40px",
  height: "40px",
  objectFit: "cover" as const,
  borderRadius: "4px"
}

const productName = {
  fontWeight: "500"
}

const statusBadge = {
  padding: "4px 12px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
  color: "white"
}

const actionButtons = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap" as const
}

const actionBtn = {
  padding: "4px 10px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "bold",
  color: "white",
  transition: "all 0.2s ease"
}

export default Products