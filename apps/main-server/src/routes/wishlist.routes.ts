import express from "express"
import { getDB } from "../db/mongo"

const router = express.Router()

// Get wishlist
router.get("/:buyerId", async (req, res) => {
  try {
    let wishlist = await getDB().collection("wishlists").findOne({
      buyerId: req.params.buyerId
    })
    
    if (!wishlist) {
      wishlist = {
        buyerId: req.params.buyerId,
        items: [],
        createdAt: new Date()
      }
    }
    
    res.json(wishlist)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist" })
  }
})

// Add to wishlist
router.post("/add", async (req, res) => {
  try {
    const { buyerId, productId, productName, productImage, price, sellerId } = req.body

    const existingWishlist = await getDB().collection("wishlists").findOne({ buyerId })

    if (existingWishlist) {
      const exists = existingWishlist.items.some((item: any) => item.productId === productId)
      if (exists) {
        return res.json({ success: true, message: "Already in wishlist" })
      }
      
      existingWishlist.items.push({ productId, productName, productImage, price, sellerId, addedAt: new Date() })
      await getDB().collection("wishlists").updateOne(
        { buyerId },
        { $set: { items: existingWishlist.items, updatedAt: new Date() } }
      )
    } else {
      await getDB().collection("wishlists").insertOne({
        buyerId,
        items: [{ productId, productName, productImage, price, sellerId, addedAt: new Date() }],
        createdAt: new Date()
      })
    }

    res.json({ success: true, message: "Added to wishlist" })
  } catch (err) {
    res.status(500).json({ message: "Failed to add to wishlist" })
  }
})

// Remove from wishlist
router.delete("/remove/:buyerId/:productId", async (req, res) => {
  try {
    const { buyerId, productId } = req.params
    
    const wishlist = await getDB().collection("wishlists").findOne({ buyerId })
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" })

    wishlist.items = wishlist.items.filter((item: any) => item.productId !== productId)
    await getDB().collection("wishlists").updateOne(
      { buyerId },
      { $set: { items: wishlist.items, updatedAt: new Date() } }
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: "Failed to remove from wishlist" })
  }
})

export default router