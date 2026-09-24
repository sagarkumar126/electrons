import { getDB } from "./mongo"

export const products = () => {
  return getDB().collection("products")
}

// Add these indexes for better performance
export const createProductIndexes = async () => {
  const collection = products()
  await collection.createIndex({ sellerId: 1 })
  await collection.createIndex({ category: 1 })
  await collection.createIndex({ moq: 1 })
}