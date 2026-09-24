import express from "express"
import { getDB } from "../db/mongo"
import { ObjectId } from "mongodb"

const router = express.Router()

// Get cart by buyer ID
router.get("/:buyerId", async (req, res) => {
  try {
    let cart = await getDB().collection("carts").findOne({
      buyerId: req.params.buyerId
    })
    
    if (!cart) {
      cart = {
        buyerId: req.params.buyerId,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cart" })
  }
})

// Add item to cart
router.post("/add", async (req, res) => {
  try {
    const { buyerId, productId, productName, productImage, price, quantity, sellerId, moq } = req.body

    if (!buyerId || !productId || !quantity) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const existingCart = await getDB().collection("carts").findOne({ buyerId })

    if (existingCart) {
      // Check if product already exists
      const existingItem = existingCart.items.find((item: any) => item.productId === productId)

      if (existingItem) {
        // Update quantity
        existingItem.quantity += quantity
        existingItem.totalPrice = existingItem.quantity * existingItem.price
      } else {
        // Add new item
        existingCart.items.push({
          productId,
          productName,
          productImage,
          price,
          quantity,
          totalPrice: price * quantity,
          sellerId,
          moq: moq || 1
        })
      }

      // Recalculate totals
      existingCart.totalItems = existingCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      existingCart.totalAmount = existingCart.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
      existingCart.updatedAt = new Date()

      await getDB().collection("carts").updateOne(
        { buyerId },
        { $set: existingCart }
      )

      res.json({ success: true, cart: existingCart })
    } else {
      // Create new cart
      const newCart = {
        buyerId,
        items: [{
          productId,
          productName,
          productImage,
          price,
          quantity,
          totalPrice: price * quantity,
          sellerId,
          moq: moq || 1
        }],
        totalItems: quantity,
        totalAmount: price * quantity,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await getDB().collection("carts").insertOne(newCart)
      res.json({ success: true, cart: newCart })
    }
  } catch (err) {
    console.error("Add to cart error:", err)
    res.status(500).json({ message: "Failed to add to cart" })
  }
})

// Update cart item quantity
router.put("/update", async (req, res) => {
  try {
    const { buyerId, productId, quantity } = req.body

    const cart = await getDB().collection("carts").findOne({ buyerId })
    if (!cart) return res.status(404).json({ message: "Cart not found" })

    const itemIndex = cart.items.findIndex((item: any) => item.productId === productId)
    if (itemIndex === -1) return res.status(404).json({ message: "Item not found" })

    cart.items[itemIndex].quantity = quantity
    cart.items[itemIndex].totalPrice = quantity * cart.items[itemIndex].price
    cart.totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    cart.totalAmount = cart.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
    cart.updatedAt = new Date()

    await getDB().collection("carts").updateOne(
      { buyerId },
      { $set: cart }
    )

    res.json({ success: true, cart })
  } catch (err) {
    res.status(500).json({ message: "Failed to update cart" })
  }
})

// Remove item from cart
router.delete("/remove/:buyerId/:productId", async (req, res) => {
  try {
    const { buyerId, productId } = req.params

    const cart = await getDB().collection("carts").findOne({ buyerId })
    if (!cart) return res.status(404).json({ message: "Cart not found" })

    cart.items = cart.items.filter((item: any) => item.productId !== productId)
    cart.totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    cart.totalAmount = cart.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
    cart.updatedAt = new Date()

    await getDB().collection("carts").updateOne(
      { buyerId },
      { $set: cart }
    )

    res.json({ success: true, cart })
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item" })
  }
})

// Clear cart
router.delete("/clear/:buyerId", async (req, res) => {
  try {
    await getDB().collection("carts").deleteOne({ buyerId: req.params.buyerId })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart" })
  }
})

// Request quote for cart items (B2B specific)
router.post("/request-quote", async (req, res) => {
  try {
    const { buyerId, cartItems, buyerName } = req.body

    // Group items by seller
    const sellerGroups: any = {}
    cartItems.forEach((item: any) => {
      if (!sellerGroups[item.sellerId]) {
        sellerGroups[item.sellerId] = {
          sellerId: item.sellerId,
          items: [],
          buyerId,
          buyerName
        }
      }
      sellerGroups[item.sellerId].items.push(item)
    })

    // Create enquiry for each seller
    for (const sellerId in sellerGroups) {
      const group = sellerGroups[sellerId]
      
      const enquiry = {
        buyerId: group.buyerId,
        sellerId: group.sellerId,
        buyerName: group.buyerName,
        items: group.items,
        status: "Pending",
        type: "cart_quote",
        createdAt: new Date()
      }

      await getDB().collection("enquiries").insertOne(enquiry)
      
      // Socket notification
      const io = req.app.get("io")
      if (io) {
        io.to(`seller_${sellerId}`).emit("receive_enquiry", enquiry)
      }
    }

    res.json({ success: true, message: "Quote request sent to sellers" })
  } catch (err) {
    res.status(500).json({ message: "Failed to request quote" })
  }
})

export default router