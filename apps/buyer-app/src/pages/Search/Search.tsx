import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"

const Search = () => {

  const [searchParams] = useSearchParams()

  const query = searchParams.get("q") || ""

  const navigate = useNavigate()

  const [products, setProducts] = useState<any[]>([])

  const fetchProducts = async () => {

    const res = await fetch(
      "http://localhost:5000/api/products"
    )

    const data = await res.json()

    const filtered = data.filter((p: any) =>

      p.name?.toLowerCase().includes(query.toLowerCase()) ||

      p.category?.toLowerCase().includes(query.toLowerCase()) ||

      p.company?.toLowerCase().includes(query.toLowerCase())

    )

    setProducts(filtered)

  }

  useEffect(() => {
    fetchProducts()
  }, [query])

  return (

    <div style={{ padding: 20 }}>

      <h2>
        Search Results for: {query}
      </h2>

      {products.length === 0 ? (

        <p>No products found</p>

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16
          }}
        >

          {products.map((item) => (

            <div
              key={item._id}
              onClick={() => navigate(`/product/${item._id}`)}
              style={{
                border: "1px solid gray",
                padding: 10,
                cursor: "pointer",
                borderRadius: 8
              }}
            >

              {item.image && (
                <img
                  src={item.image}
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "contain"
                  }}
                />
              )}

              <h3 style={{ fontSize: 14, margin: "8px 0 4px 0" }}>{item.name}</h3>

              {item.discountEnabled ? (
                <>
                  <p
                    style={{
                      textDecoration: "line-through",
                      color: "gray",
                      fontSize: 12,
                      margin: "2px 0"
                    }}
                  >
                    ₹{item.price}
                  </p>

                  <p style={{ color: "green", fontSize: 15, fontWeight: "bold", margin: "2px 0" }}>
                    ₹{
                      item.price -
                      (item.price * item.discount) / 100
                    }
                  </p>

                  <p style={{ color: "red", fontSize: 12, margin: "2px 0" }}>
                    {item.discount}% OFF
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 15, fontWeight: "bold", margin: "2px 0" }}>₹{item.price}</p>
              )}

              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0" }}>{item.category}</p>

              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0" }}>{item.company}</p>

            </div>

          ))}

        </div>

      )}

    </div>

  )
}

export default Search