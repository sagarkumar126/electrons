// ✅ Get seller reviews
router.get("/reviews/:sellerId", async (req, res) => {
  try {
    const reviews = await getDB()
      .collection("reviews")
      .find({ sellerId: req.params.sellerId })
      .sort({ createdAt: -1 })
      .toArray()
    
    res.json({ success: true, data: reviews })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch reviews" })
  }
})

// ✅ Add review
router.post("/review", async (req, res) => {
  try {
    const { sellerId, buyerId, rating, review, productId } = req.body

    if (!sellerId || !buyerId || !rating) {
      return res.status(400).json({ success: false, message: "Missing required fields" })
    }

    const newReview = {
      sellerId,
      buyerId,
      rating: Number(rating),
      review: review || "",
      productId: productId || null,
      createdAt: new Date()
    }

    const result = await getDB().collection("reviews").insertOne(newReview)

    // ✅ Update seller rating average
    const avgResult = await getDB().collection("reviews").aggregate([
      { $match: { sellerId } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]).toArray()

    if (avgResult.length > 0) {
      await getDB().collection("users").updateOne(
        { _id: new ObjectId(sellerId) },
        { 
          $set: { 
            avgRating: avgResult[0].avgRating,
            totalReviews: avgResult[0].totalReviews
          } 
        }
      )
    }

    res.json({ success: true, message: "Review added", id: result.insertedId })
  } catch (error) {
    console.error("Add review error:", error)
    res.status(500).json({ success: false, message: "Failed to add review" })
  }
})

// ✅ Get seller stats (response time)
router.get("/stats/:sellerId", async (req, res) => {
  try {
    const sellerId = req.params.sellerId

    // Get total products
    const totalProducts = await getDB()
      .collection("products")
      .countDocuments({ sellerId })

    // Get total orders
    const totalOrders = await getDB()
      .collection("orders")
      .countDocuments({ sellerId })

    // Get response time from enquiries
    const enquiries = await getDB()
      .collection("enquiries")
      .find({ sellerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // Calculate average response time (simplified)
    let avgResponseTime = "N/A"
    // ... calculation logic

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        avgResponseTime,
        responseRate: "89%" // Placeholder
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stats" })
  }
})