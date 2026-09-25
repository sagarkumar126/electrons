import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_URL } from "../../config"

const CategoryProducts = () => {
  const { name } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])

  const fetchByCategory = async () => {
    const res = await fetch(`${API_URL}/products`)
    const data = await res.json()
    setProducts(data)
  }

  useEffect(() => {
    fetchByCategory()
  }, [name])

  const filtered = products.filter(
    (p) => p.category === decodeURIComponent(name || "")
  )

  return (
    <div style={{ padding: "20px" }}>

      <h2 style={{ marginBottom: "15px" }}>
        Category: {name}
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "15px"
      }}>
        {filtered.map((item) => (
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

            {item.company && <p>{item.company}</p>}

          </div>
        ))}
      </div>

    </div>
  )
}

export default CategoryProducts