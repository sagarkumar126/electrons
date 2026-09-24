import express from "express"
import { users } from "../db/user.collection"
import { ObjectId } from "mongodb"

const router = express.Router()

router.get("/profile/:id", async (req, res) => {
  try {
    const seller = await users().findOne({
      _id: new ObjectId(req.params.id)
    })

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found"
      })
    }

    res.json(seller)

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    })
  }
})

export default router