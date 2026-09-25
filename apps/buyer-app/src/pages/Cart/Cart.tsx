import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import RFQModal from "../../components/RFQModal/RFQModal"
import { API_URL } from "../../config"

const Cart = () => {
  const [cart, setCart] = useState<any>({ items: [], totalItems: 0, totalAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [showRFQModal, setShowRFQModal] = useState(false)
  const [sellerInfo, setSellerInfo] = useState<any>(null)
  const buyer = JSON.parse(localStorage.getItem("user") || "{}")
  const navigate = useNavigate()

  useEffect(() => {
    if (buyer._id) {
      fetchCart()
    }
  }, [buyer._id])

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_URL}/cart/${buyer._id}`)
      const data = await res.json()
      setCart(data)
      
      // ✅ Get seller info from first item
      if (data.items && data.items.length > 0) {
        const sellerId = data.items[0].sellerId
        const sellerRes = await fetch(`${API_URL}/seller/profile/${sellerId}`)
        const sellerData = await sellerRes.json()
        setSellerInfo(sellerData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return
    await fetch(`${API_URL}/cart/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId: buyer._id, productId, quantity })
    })
    fetchCart()
  }

  const removeItem = async (productId: string) => {
    await fetch(`${API_URL}/cart/remove/${buyer._id}/${productId}`, {
      method: "DELETE"
    })
    fetchCart()
  }

  const chatWithSeller = (sellerId: string, productId: string, productName: string, productImage: string) => {
    navigate(`/chat/${sellerId}`, {
      state: {
        productId: productId,
        productName: productName,
        productImage: productImage
      }
    })
  }

  const goToProduct = (productId: string) => {
    navigate(`/product/${productId}`)
  }

  if (loading) return <div style={styles.loading}>Loading cart...</div>

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Shopping Cart</h1>
      
      {cart.items.length === 0 ? (
        <div style={styles.empty}>
          <p>Your cart is empty</p>
          <button onClick={() => navigate("/")} style={styles.shopBtn}>Continue Shopping</button>
        </div>
      ) : (
        <>
          <div style={styles.items}>
            {cart.items.map((item: any) => (
              <div key={item.productId} style={styles.item}>
                <div style={styles.productClickArea} onClick={() => goToProduct(item.productId)}>
                  <img src={item.productImage} alt={item.productName} style={styles.image} />
                  <div style={styles.details}>
                    <h3>{item.productName}</h3>
                    <p>Price: ₹{item.price} per unit</p>
                    {item.moq > 0 && <p style={styles.moq}>MOQ: {item.moq} units</p>}
                    <div style={styles.quantity} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <p style={styles.total}>Total: ₹{item.totalPrice}</p>
                  </div>
                </div>
                <div style={styles.itemActions}>
                  <button 
                    onClick={() => chatWithSeller(item.sellerId, item.productId, item.productName, item.productImage)} 
                    style={styles.chatBtn}
                  >
                    💬 Chat with Seller
                  </button>
                  <button onClick={() => removeItem(item.productId)} style={styles.removeBtn}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          
          <div style={styles.summary}>
            <h3>Order Summary</h3>
            <div style={styles.summaryRow}>
              <span>Total Items:</span>
              <span>{cart.totalItems}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Total Amount:</span>
              <span style={styles.totalAmount}>₹{cart.totalAmount}</span>
            </div>
            
            {/* ✅ RFQ BUTTON - Always Visible */}
            <button 
              onClick={() => {
                if (!sellerInfo) {
                  alert("No seller found. Please add products to cart first.")
                  return
                }
                setShowRFQModal(true)
              }} 
              style={styles.rfqBtn}
            >
              📩 Request Quote for All Items
            </button>
            
            <button onClick={() => navigate("/")} style={styles.shopBtn}>
              Continue Shopping
            </button>
            <p style={styles.note}>* Click "Chat with Seller" to negotiate price</p>
          </div>
        </>
      )}

      {/* ✅ RFQ Modal */}
      {showRFQModal && sellerInfo && (
        <RFQModal
          isOpen={showRFQModal}
          onClose={() => setShowRFQModal(false)}
          cartItems={cart.items}
          sellerId={sellerInfo._id}
          sellerName={sellerInfo.companyName || sellerInfo.name}
          buyerId={buyer._id}
          buyerName={buyer.name}
          totalAmount={cart.totalAmount}
        />
      )}
    </div>
  )
}

const styles = {
  container: { padding: 20, maxWidth: 1200, margin: "auto", minHeight: "100vh" },
  title: { marginBottom: 20 },
  loading: { textAlign: "center" as const, padding: 40 },
  empty: { textAlign: "center" as const, padding: 40, background: "#f3f4f6", borderRadius: 12 },
  shopBtn: { padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" },
  items: { display: "flex", flexDirection: "column" as const, gap: 15 },
  item: { display: "flex", gap: 15, background: "white", padding: 15, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flexWrap: "wrap" as const, justifyContent: "space-between" },
  productClickArea: { display: "flex", gap: 15, flex: 2, cursor: "pointer" },
  image: { width: 100, height: 100, objectFit: "cover" as const, borderRadius: 8 },
  details: { flex: 1, minWidth: 200 },
  moq: { fontSize: 12, color: "#f59e0b" },
  quantity: { display: "flex", gap: 10, alignItems: "center", marginTop: 10 },
  total: { fontWeight: "bold", marginTop: 10 },
  itemActions: { display: "flex", flexDirection: "column" as const, gap: 8, justifyContent: "center" },
  chatBtn: { padding: "8px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
  removeBtn: { padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
  summary: { background: "white", padding: 20, borderRadius: 12, marginTop: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" },
  totalAmount: { fontWeight: "bold", fontSize: 18, color: "#16a34a" },
  rfqBtn: { 
    width: "100%", 
    padding: "12px", 
    background: "#f59e0b", 
    color: "white", 
    border: "none", 
    borderRadius: 8, 
    cursor: "pointer", 
    fontWeight: "bold", 
    marginTop: 15,
    marginBottom: 10
  },
  note: { fontSize: 12, color: "#6b7280", marginTop: 10, textAlign: "center" as const }
}

export default Cart