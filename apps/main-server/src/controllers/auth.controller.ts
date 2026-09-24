import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { users } from "../db/user.collection"

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { email, displayName } = req.body

    const existing = await users().findOne({ email })

    let user

    if (!existing) {
      const result = await users().insertOne({
        email,
        name: displayName,
        role: "buyer",
        createdAt: new Date(),
      })

      user = {
        _id: result.insertedId,
        email,
        name: displayName,
        role: "buyer",
      }
    } else {
      user = existing
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "SECRET_KEY",
      { expiresIn: "7d" }
    )

    res.json({ user, token })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
}