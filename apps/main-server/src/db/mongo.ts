import { MongoClient } from "mongodb"

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"

const client = new MongoClient(MONGO_URI)

let db: any

export const connectDB = async () => {
  await client.connect()
  db = client.db("electrons")
  console.log("✅ MongoDB connected")
}

export const getDB = () => db