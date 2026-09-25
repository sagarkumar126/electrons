import { useEffect, useState, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { socket } from "../../socket"
// ✅ NEW IMPORT - LOCAL CATALOG
import { searchCatalog } from "../../data/localProductCatalog"

const SellerProducts = () => {

  const formRef = useRef<HTMLDivElement | null>(null)

  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const [name, setName] = useState("")
  const [details, setDetails] = useState("")
  const [company, setCompany] = useState("")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [moq, setMoq] = useState("")

  const [imageInputs, setImageInputs] = useState([0])
  const [imageFiles, setImageFiles] = useState<any[]>([])

  const [extraFields, setExtraFields] = useState([
    { title: "", description: "" }
  ])

  const [oldImage, setOldImage] = useState("")
  const [oldImages, setOldImages] = useState<any[]>([])

  const [editingId, setEditingId] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // ✅ FIXED: categories & sub-categories from API
  const [apiCategories, setApiCategories] = useState<any[]>([])

  // ✅ AI SEARCH STATES
  const [aiQuery, setAiQuery] = useState("")
  const [aiResults, setAiResults] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiResults, setShowAiResults] = useState(false)

  const [rfqCount, setRfqCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [requirementCount, setRequirementCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  // ✅ REFS FOR SCROLLING TO EMPTY FIELDS
  const nameRef = useRef<HTMLInputElement | null>(null)
  const detailsRef = useRef<HTMLTextAreaElement | null>(null)
  const companyRef = useRef<HTMLInputElement | null>(null)
  const categoryRef = useRef<HTMLSelectElement | null>(null)
  const priceRef = useRef<HTMLInputElement | null>(null)
  const stockRef = useRef<HTMLInputElement | null>(null)
  const imagesRef = useRef<HTMLDivElement | null>(null)

  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user") || "null")

  // ✅ Total Notifications
  const totalNotifications = rfqCount + chatCount + orderCount + requirementCount

  // ✅ Clear Notifications
  const clearNotifications = (type: string) => {
    if (type === "rfq") setRfqCount(0)
    else if (type === "chat") setChatCount(0)
    else if (type === "order") setOrderCount(0)
    else if (type === "requirement") setRequirementCount(0)
  }

  // ✅ Notification Listeners
  useEffect(() => {
    if (user?._id) {
      socket.emit("join_seller", user._id)

      socket.on("new-rfq", (data) => {
        setRfqCount(prev => prev + 1)
      })

      socket.on("receive_message", (data) => {
        if (data.receiverId === user._id || data.senderId !== user._id) {
          setChatCount(prev => prev + 1)
        }
      })

      socket.on("new-order", (data) => {
        setOrderCount(prev => prev + 1)
      })

      socket.on("new-buyer-requirement", (data) => {
        setRequirementCount(prev => prev + 1)
      })
    }

    return () => {
      socket.off("new-rfq")
      socket.off("receive_message")
      socket.off("new-order")
      socket.off("new-buyer-requirement")
    }
  }, [user?._id])

  // ✅ FIXED: load categories from API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://https://electrons-1.onrender.com/api/categories/all")
        const data = await res.json()
        setApiCategories(data.data || [])
      } catch (err) {
        console.error("Failed to load categories:", err)
      }
    }
    load()
  }, [])

  const fetchProducts = async () => {
    const res = await fetch(
      `http://https://electrons-1.onrender.com/api/products/seller/${user._id}`
    )
    const data = await res.json()
    setProducts(data || [])
  }

  useEffect(() => {
    if (user?._id) {
      fetchProducts()
    }
  }, [user?._id])

  useEffect(() => {
    const editId = query.get("editId")
    if (!editId || products.length === 0) return
    const product = products.find((p) => p._id === editId)
    if (product) editProduct(product)
  }, [location.search, products])

  // ✅ DEBOUNCED AI SEARCH - NOW USING LOCAL CATALOG
  useEffect(() => {
    if (!aiQuery.trim() || aiQuery.trim().length < 2) {
      setAiResults([])
      setShowAiResults(false)
      return
    }

    const timer = setTimeout(() => {
      try {
        setAiLoading(true)
        const results = searchCatalog(aiQuery.trim())
        setAiResults(results)
        setShowAiResults(true)
      } catch (err) {
        console.error("AI search error:", err)
        setAiResults([])
      } finally {
        setAiLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [aiQuery])

  // ✅ AUTO-FILL FROM AI RESULT
  const applyAiSuggestion = (item: any) => {
    setName(item.name || "")
    setDetails(item.details || "")
    setCompany(item.company || "")
    setCategory(item.category || "")
    setSubCategory(item.subCategory || "")
    setPrice(String(item.price || ""))
    if (item.extraFields?.length) {
      setExtraFields(item.extraFields)
    }

    setAiQuery("")
    setAiResults([])
    setShowAiResults(false)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const uploadImages = async () => {
    const uploadedImages: any[] = []
    for (let file of imageFiles) {
      if (!file) continue
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch("http://https://electrons-1.onrender.com/api/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      uploadedImages.push(data.imageUrl)
    }
    return uploadedImages
  }

  // ✅ SCROLL TO FIELD HELPER
  const scrollToField = (ref: React.RefObject<any>, fieldName: string) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" })
      ref.current.focus()
      ref.current.style.border = "2px solid #ef4444"
      ref.current.style.boxShadow = "0 0 0 4px rgba(239, 68, 68, 0.15)"
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.border = "1px solid #e5e7eb"
          ref.current.style.boxShadow = "none"
        }
      }, 2500)
    }
  }

  // ✅ VALIDATION FUNCTION
  const validateForm = () => {
    const errors: string[] = []
    let firstErrorRef: React.RefObject<any> | null = null

    if (!name.trim()) {
      errors.push("Product Name is required")
      if (!firstErrorRef) firstErrorRef = nameRef
    }
    if (!details.trim()) {
      errors.push("Product Details is required")
      if (!firstErrorRef) firstErrorRef = detailsRef
    }
    if (!company.trim()) {
      errors.push("Company/Brand is required")
      if (!firstErrorRef) firstErrorRef = companyRef
    }
    if (!category) {
      errors.push("Category is required")
      if (!firstErrorRef) firstErrorRef = categoryRef
    }
    if (!price.trim()) {
      errors.push("Price is required")
      if (!firstErrorRef) firstErrorRef = priceRef
    }
    if (!stock.trim()) {
      errors.push("Stock is required")
      if (!firstErrorRef) firstErrorRef = stockRef
    }

    if (!editingId) {
      const hasImage = imageFiles.some(f => f)
      if (!hasImage) {
        errors.push("At least one product image is required")
        if (!firstErrorRef) firstErrorRef = imagesRef
      }
    } else {
      const hasNewImage = imageFiles.some(f => f)
      const hasOldImage = oldImages.length > 0 || oldImage
      if (!hasNewImage && !hasOldImage) {
        errors.push("At least one product image is required")
        if (!firstErrorRef) firstErrorRef = imagesRef
      }
    }

    if (firstErrorRef) {
      const fieldName = errors[0].replace(" is required", "")
      scrollToField(firstErrorRef, fieldName)
    }

    return errors
  }

  const addProduct = async () => {
    setErrorMessage("")
    setSuccessMessage("")

    const errors = validateForm()
    if (errors.length > 0) {
      setErrorMessage(errors.join(", "))
      return
    }

    const uploadedImages = await uploadImages()

    await fetch("http://https://electrons-1.onrender.com/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        details,
        company,
        category,
        subCategory,
        price,
        stock,
        moq: Number(moq) || 0,
        sellerId: user._id,
        image: uploadedImages[0] || "",
        images: uploadedImages,
        extraFields
      })
    })

    setSuccessMessage("Product added successfully")
    setTimeout(() => setSuccessMessage(""), 2500)
    clearForm()
    fetchProducts()
  }

  const updateProduct = async () => {
    setErrorMessage("")
    setSuccessMessage("")

    const errors = validateForm()
    if (errors.length > 0) {
      setErrorMessage(errors.join(", "))
      return
    }

    let uploadedImages: any[] = []
    if (imageFiles.length > 0) {
      uploadedImages = await uploadImages()
    }
    const finalImages = [...oldImages, ...uploadedImages]

    await fetch(`http://https://electrons-1.onrender.com/api/products/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        details,
        company,
        category,
        subCategory,
        price,
        stock,
        moq: Number(moq) || 0,
        image: finalImages[0] || oldImage,
        images: finalImages,
        extraFields
      })
    })

    setSuccessMessage("Product updated successfully")
    setTimeout(() => setSuccessMessage(""), 2500)
    clearForm()
    fetchProducts()
  }

  const editProduct = (item: any) => {
    setEditingId(item._id)
    setName(item.name)
    setDetails(item.details)
    setCompany(item.company)
    setCategory(item.category)
    setSubCategory(item.subCategory || "")
    setPrice(item.price)
    setStock(item.stock)
    setMoq(item.moq || "")
    setOldImage(item.image || "")
    setOldImages(item.images || [])
    setExtraFields(item.extraFields || [{ title: "", description: "" }])
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const clearForm = () => {
    setName("")
    setDetails("")
    setCompany("")
    setCategory("")
    setSubCategory("")
    setPrice("")
    setStock("")
    setMoq("")
    setImageFiles([])
    setImageInputs([0])
    setExtraFields([{ title: "", description: "" }])
    setOldImage("")
    setOldImages([])
    setEditingId("")
    setErrorMessage("")
  }

  const handleNumberOnly = (v: string) => v.replace(/[^0-9]/g, "")

  const logout = () => {
    if (!window.confirm("Do you really want to logout?")) return
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  // ✅ Get sub-categories for selected category from API
  const selectedCategoryData = apiCategories.find((c: any) => c.name === category)
  const availableSubCategories: string[] = selectedCategoryData?.subCategories || []

  return (
    <div style={styles.page}>
      
      {/* ✅ TOP BAR - Notification Bell + Logout + View All Button */}
      <div style={topBar}>
        <div style={topBarLeft}>
          <h2 style={pageTitle}>📦 Products</h2>
          <button 
            onClick={() => navigate("/all-products")}
            style={viewAllBtn}
          >
            👁️ View All Products 
          </button>
        </div>
        <div style={topBarRight}>
          <div style={bellContainer}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={bellBtn}
            >
              🔔
              {totalNotifications > 0 && (
                <span style={bellBadge}>{totalNotifications}</span>
              )}
            </button>

            {showNotifications && (
              <div style={dropdown}>
                <h4 style={dropdownTitle}>🔔 Notifications</h4>
                {totalNotifications === 0 ? (
                  <p style={dropdownEmpty}>No new notifications</p>
                ) : (
                  <div style={dropdownList}>
                    {rfqCount > 0 && (
                      <div style={dropdownItem} onClick={() => { navigate("/seller/rfqs"); setShowNotifications(false); clearNotifications("rfq") }}>
                        <span>📩</span>
                        <span><b>{rfqCount}</b> new RFQ{rfqCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {chatCount > 0 && (
                      <div style={dropdownItem} onClick={() => { navigate("/chats"); setShowNotifications(false); clearNotifications("chat") }}>
                        <span>💬</span>
                        <span><b>{chatCount}</b> new message{chatCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {orderCount > 0 && (
                      <div style={dropdownItem} onClick={() => { navigate("/orders"); setShowNotifications(false); clearNotifications("order") }}>
                        <span>🛒</span>
                        <span><b>{orderCount}</b> new order{orderCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {requirementCount > 0 && (
                      <div style={dropdownItem} onClick={() => { navigate("/buyer-requirements"); setShowNotifications(false); clearNotifications("requirement") }}>
                        <span>📩</span>
                        <span><b>{requirementCount}</b> new requirement{requirementCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}
                {totalNotifications > 0 && (
                  <button style={markAllBtn} onClick={() => { setRfqCount(0); setChatCount(0); setOrderCount(0); setRequirementCount(0); setShowNotifications(false) }}>
                    Mark all as read
                  </button>
                )}
              </div>
            )}
          </div>

          <button onClick={logout} style={logoutBtn}>🚪 Logout</button>
        </div>
      </div>

      {/* ======== AI PRODUCT ASSISTANT ======== */}
      <div style={styles.card}>
        <h2 style={styles.title}>🤖 AI Product Assistant</h2>
        <p style={styles.aiHelper}>
          Type a product name (e.g. <b>"iPhone"</b>, <b>"Dell Laptop"</b>, <b>"Samsung TV"</b>, <b>"A57"</b>) and click a suggestion to auto-fill the form.
        </p>

        <div style={aiSearchWrapper}>
          <input
            style={aiInput}
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onFocus={() => aiResults.length > 0 && setShowAiResults(true)}
            placeholder="🔍 Search product for AI auto-fill..."
          />

          {aiLoading && <span style={aiLoadingBadge}>Searching...</span>}

          {showAiResults && aiResults.length > 0 && (
            <div style={aiResultsBox}>
              {aiResults.map((item, idx) => (
                <div
                  key={idx}
                  style={aiResultItem}
                  onClick={() => applyAiSuggestion(item)}
                >
                  <div style={aiResultTitle}>
                    <span>{item.name}</span>
                    <span style={aiResultBadge}>{item.category}</span>
                  </div>
                  <div style={aiResultMeta}>
                    🏢 {item.company} &nbsp;•&nbsp; 💰 ₹{item.price}
                  </div>
                  <div style={aiResultDetails}>{item.details}</div>
                </div>
              ))}
            </div>
          )}

          {showAiResults && !aiLoading && aiResults.length === 0 && aiQuery.trim().length >= 2 && (
            <div style={aiResultsBox}>
              <div style={aiNoResult}>No AI suggestions found. Fill the form manually below.</div>
            </div>
          )}
        </div>
      </div>

      {/* ======== ADD/EDIT PRODUCT FORM ======== */}
      <div ref={formRef} style={styles.card}>
        <h2 style={styles.title}>
          {editingId ? "Update Product" : "Add Product"}
        </h2>

        {errorMessage && (
          <div style={styles.error}>
            ⚠️ {errorMessage}
          </div>
        )}

        <input
          ref={nameRef}
          style={styles.input}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Product Name *"
        />
        <textarea
          ref={detailsRef}
          style={{ ...styles.input, height: 90 }}
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Product Details *"
        />
        <input
          ref={companyRef}
          style={styles.input}
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="Company/Brand *"
        />

        {/* ✅ FIXED: category dropdown from API */}
        <select
          ref={categoryRef}
          style={styles.input}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setSubCategory("")
          }}
        >
          <option value="">Select Category *</option>
          {apiCategories.map((c: any) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* ✅ FIXED: sub-category dropdown from API */}
        {category && availableSubCategories.length > 0 && (
          <select 
            style={styles.input} 
            value={subCategory} 
            onChange={e => setSubCategory(e.target.value)}
          >
            <option value="">Select Sub-Category</option>
            {availableSubCategories.map((sub: string) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        )}

        <input
          ref={priceRef}
          style={styles.input}
          value={price}
          onChange={e => setPrice(handleNumberOnly(e.target.value))}
          placeholder="Price *"
        />
        <input
          ref={stockRef}
          style={styles.input}
          value={stock}
          onChange={e => setStock(handleNumberOnly(e.target.value))}
          placeholder="Stock *"
        />

        <div style={styles.inputGroup}>
          <label>Minimum Order Quantity (MOQ)</label>
          <input
            type="number"
            value={moq}
            onChange={e => setMoq(e.target.value)}
            placeholder="e.g., 100"
            style={styles.input}
          />
          <small style={styles.helper}>Minimum quantity buyer must order</small>
        </div>

        <button style={styles.btn} onClick={() => setExtraFields([...extraFields, { title: "", description: "" }])}>
          + Add More Title & Description
        </button>

        {extraFields.map((f, i) => (
          <div key={i} style={styles.extraBox}>
            <input
              style={styles.input}
              value={f.title}
              placeholder="Title"
              onChange={e => {
                const u = [...extraFields]
                u[i].title = e.target.value
                setExtraFields(u)
              }}
            />
            <textarea
              style={{ ...styles.input, height: 70 }}
              value={f.description}
              placeholder="Description"
              onChange={e => {
                const u = [...extraFields]
                u[i].description = e.target.value
                setExtraFields(u)
              }}
            />
          </div>
        ))}

        {successMessage && (
          <div style={styles.success}>
            {successMessage}
          </div>
        )}

        {/* ✅ ORIGINAL ADD BUTTON - KEEP AS IS */}
        <button style={styles.mainBtn} onClick={editingId ? updateProduct : addProduct}>
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </div>

      {/* ✅ FLOATING RIGHT-SIDE PANEL - "+ Add More Photos" + File Inputs */}
      <div style={floatingPhotoPanel} ref={imagesRef}>
        <div style={panelHeader}>
          <span style={{ fontSize: "16px" }}>📸</span>
          <span style={panelTitle}>Photos</span>
        </div>

        <button
          style={panelAddBtn}
          onClick={() => setImageInputs([...imageInputs, imageInputs.length])}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #60a5fa, #2563eb)"
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.5)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8)"
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(59, 130, 246, 0.35)"
          }}
        >
          + Add More Photos
        </button>

        <div style={fileInputsContainer}>
          {imageInputs.map((_, i) => (
            <input
              key={i}
              style={panelFileInput}
              type="file"
              onChange={e => {
                const u = [...imageFiles]
                u[i] = e.target.files?.[0]
                setImageFiles(u)
              }}
            />
          ))}
        </div>
      </div>

      {/* ✅ FLOATING SAVE BUTTON - ALWAYS VISIBLE (RIGHT SIDE) */}
      <button
        onClick={editingId ? updateProduct : addProduct}
        style={floatingSaveBtn}
        title={editingId ? "Update Product" : "Save Product"}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px) scale(1.05)"
          e.currentTarget.style.boxShadow = "0 14px 34px rgba(34, 197, 94, 0.55)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)"
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(34, 197, 94, 0.45)"
        }}
      >
        {editingId ? "💾 Update" : "💾 Save Product"}
      </button>
    </div>
  )
}

// ================= STYLES =================

const styles: any = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    paddingBottom: "110px",
    fontFamily: "Segoe UI",
    background: "linear-gradient(135deg,#0f172a,#1e293b,#0ea5e9)"
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    maxWidth: 800,
    margin: "auto",
    marginBottom: "20px"
  },
  title: {
    marginBottom: "12px"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    outline: "none"
  },
  inputGroup: {
    marginTop: "15px"
  },
  helper: {
    fontSize: "12px",
    color: "#666",
    display: "block",
    marginTop: "5px"
  },
  aiHelper: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "0",
    marginBottom: "12px"
  },
  btn: {
    marginTop: "14px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },
  mainBtn: {
    marginTop: "18px",
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%"
  },
  success: {
    marginTop: "12px",
    background: "#dcfce7",
    color: "#166534",
    padding: "10px",
    borderRadius: "10px"
  },
  error: {
    marginTop: "12px",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px",
    borderRadius: "10px",
    fontWeight: "500"
  },
  extraBox: {
    marginTop: "10px",
    padding: "10px",
    borderRadius: "12px",
    background: "#f1f5f9"
  }
}

const floatingPhotoPanel = {
  position: "fixed" as const,
  top: "50%",
  right: "20px",
  transform: "translateY(-50%)",
  width: "260px",
  maxHeight: "70vh",
  overflowY: "auto" as const,
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(59, 130, 246, 0.15)",
  zIndex: 9998,
  border: "1px solid rgba(59, 130, 246, 0.2)",
  backdropFilter: "blur(10px)"
}

const panelHeader = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "12px",
  paddingBottom: "10px",
  borderBottom: "2px solid #e2e8f0"
}

const panelTitle = {
  fontSize: "15px",
  fontWeight: "bold" as const,
  color: "#0f172a"
}

const panelAddBtn = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "13px",
  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  marginBottom: "10px"
}

const fileInputsContainer = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginTop: "8px"
}

const panelFileInput = {
  width: "100%",
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  fontSize: "11px",
  cursor: "pointer",
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box" as const
}

const floatingSaveBtn = {
  position: "fixed" as const,
  bottom: "30px",
  right: "30px",
  padding: "16px 28px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  border: "none",
  borderRadius: "50px",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "15px",
  boxShadow: "0 8px 24px rgba(34, 197, 94, 0.45)",
  zIndex: 9999,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap" as const
}

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 20px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "12px",
  marginBottom: "20px",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.1)"
}

const topBarLeft = {
  display: "flex",
  alignItems: "center",
  gap: "15px"
}

const pageTitle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "white"
}

const viewAllBtn = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600" as const,
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
  transition: "all 0.3s ease",
  whiteSpace: "nowrap" as const
}

const topBarRight = {
  display: "flex",
  alignItems: "center",
  gap: "15px"
}

const bellContainer = {
  position: "relative" as const
}

const bellBtn = {
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  fontSize: "18px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  transition: "all 0.3s ease"
}

const bellBadge = {
  position: "absolute" as const,
  top: "-4px",
  right: "-4px",
  background: "#ef4444",
  color: "white",
  borderRadius: "50%",
  padding: "2px 6px",
  fontSize: "10px",
  fontWeight: "bold" as const,
  minWidth: "18px",
  textAlign: "center" as const,
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
}

const logoutBtn = {
  padding: "8px 18px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600" as const,
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
}

const dropdown = {
  position: "absolute" as const,
  top: "45px",
  right: "0",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
  padding: "14px",
  minWidth: "260px",
  maxWidth: "320px",
  zIndex: 1000,
  border: "1px solid #e2e8f0"
}

const dropdownTitle = {
  margin: "0 0 8px 0",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "bold" as const
}

const dropdownEmpty = {
  color: "#94a3b8",
  fontSize: "13px",
  textAlign: "center" as const,
  padding: "8px 0"
}

const dropdownList = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px"
}

const dropdownItem = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  background: "#f8fafc",
  transition: "all 0.2s",
  fontSize: "12px"
}

const markAllBtn = {
  marginTop: "8px",
  padding: "6px 12px",
  background: "#e2e8f0",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  width: "100%",
  fontWeight: "500" as const,
  color: "#1e293b"
}

const aiSearchWrapper = {
  position: "relative" as const
}

const aiInput = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: "12px",
  border: "2px solid #8b5cf6",
  outline: "none",
  fontSize: "15px",
  background: "white",
  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.15)"
}

const aiLoadingBadge = {
  position: "absolute" as const,
  right: "16px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "12px",
  color: "#8b5cf6",
  fontWeight: "600" as const
}

const aiResultsBox = {
  position: "absolute" as const,
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
  maxHeight: "360px",
  overflowY: "auto" as const,
  zIndex: 50,
  border: "1px solid #e2e8f0"
}

const aiResultItem = {
  padding: "12px 16px",
  cursor: "pointer",
  borderBottom: "1px solid #f1f5f9",
  transition: "all 0.15s"
}

const aiResultTitle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  fontWeight: "600" as const,
  fontSize: "14px",
  color: "#0f172a"
}

const aiResultBadge = {
  background: "#ede9fe",
  color: "#7c3aed",
  padding: "2px 10px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "600" as const,
  whiteSpace: "nowrap" as const
}

const aiResultMeta = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "4px"
}

const aiResultDetails = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "4px",
  lineHeight: "1.4"
}

const aiNoResult = {
  padding: "16px",
  textAlign: "center" as const,
  color: "#94a3b8",
  fontSize: "13px"
}

export default SellerProducts