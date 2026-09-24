import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const StockManagement = () => {

  const [products, setProducts] = useState<any[]>([])
  const [tab, setTab] = useState<"out" | "low">("out")

  const navigate = useNavigate()

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  )

  const fetchProducts = async () => {

    const res = await fetch(
      `http://localhost:5000/api/products/seller/${user._id}`
    )

    const data = await res.json()

    setProducts(data || [])
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = products.filter((p) => {

    const stock = Number(p.stock || 0)

    if (tab === "out") {
      return stock === 0
    }

    if (tab === "low") {
      return stock > 0 && stock <= 15
    }

    return true
  })

  return (

    <div style={{ padding: "20px" }}>

      {/* HEADER */}
      <h1 style={{ marginBottom: "15px" }}>
        Check Stock
      </h1>

      {/* NAVBAR BUTTONS */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "20px"
      }}>

        <button
          onClick={() => setTab("out")}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            background:
              tab === "out"
                ? "#ef4444"
                : "#e5e7eb",
            color:
              tab === "out"
                ? "white"
                : "black"
          }}
        >
          Out of Stock
        </button>

        <button
          onClick={() => setTab("low")}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            background:
              tab === "low"
                ? "#f59e0b"
                : "#e5e7eb",
            color:
              tab === "low"
                ? "white"
                : "black"
          }}
        >
          Low Stock
        </button>

      </div>

      {/* PRODUCTS */}
      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "15px"
      }}>

        {filteredProducts.length === 0 ? (

          <div style={{
            padding: "20px",
            background: "#f9fafb",
            borderRadius: "10px"
          }}>
            No products found
          </div>

        ) : (

          filteredProducts.map((p) => (

            <div
              key={p._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "12px",
                background: "white"
              }}
            >

              {p.image && (

                <img
                  src={p.image}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "8px"
                  }}
                />

              )}

              <h3 style={{ marginTop: "10px" }}>
                {p.name}
              </h3>

              <p>
                Stock: {p.stock}
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/products?editId=${p._id}`
                  )
                }
                style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Edit Stock
              </button>

            </div>

          ))

        )}

      </div>

    </div>
  )
}

export default StockManagement