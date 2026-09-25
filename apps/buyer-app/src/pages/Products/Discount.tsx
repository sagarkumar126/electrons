import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../config"

const Discount = () => {
  const [products, setProducts] = useState<any[]>([])
  const navigate = useNavigate()

  const fetchDiscounted = async () => {
    const res = await fetch(`${API_URL}/products`)
    const data = await res.json()

    const filtered = data.filter(
      (p: any) => p.discount && Number(p.discount) > 0
    )

    setProducts(filtered)
  }

  useEffect(() => {
    fetchDiscounted()
  }, [])

  return (
    <div style={{ padding: "20px" }}>

      <h1>🔥 Discounted Products</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "15px"
      }}>
        {products.map((item) => (
          <div
            key={item._id}
            onClick={() => navigate(`/product/${item._id}`)}
            style={{
              border: "1px solid #ddd",
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
{item.image && (
  <img
    src={item.image}
    style={{
      width: "100%",
      height: "220px",
      objectFit: "contain",
      display: "block",
      background: "#fff"
    }}
  />
)}


            <h3>{item.name}</h3>
            <p>₹ {item.price}</p>
            <p>Stock: {item.stock}</p>
            <p>Company: {item.company}</p>

            <p style={{ color: "red" }}>
              🔥 {item.discount}% OFF
            </p>

          </div>
        ))}
      </div>

    </div>
  )
}

export default Discount