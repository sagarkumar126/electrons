import { getDB } from "./mongo"
import { ObjectId } from "mongodb"

export const rfqs = () => {
  return getDB().collection("rfqs")
}

export const createRFQ = async (data: any) => {
  const result = await rfqs().insertOne({
    ...data,
    status: "Pending",
    createdAt: new Date(),
    updatedAt: new Date()
  })
  return result
}

export const getRFQById = async (id: string) => {
  return await rfqs().findOne({ _id: new ObjectId(id) })
}

export const getRFQsByBuyer = async (buyerId: string) => {
  return await rfqs()
    .find({ buyerId })
    .sort({ createdAt: -1 })
    .toArray()
}

export const getRFQsBySeller = async (sellerId: string) => {
  return await rfqs()
    .find({ sellerId })
    .sort({ createdAt: -1 })
    .toArray()
}

export const getPendingRFQsBySeller = async (sellerId: string) => {
  return await rfqs()
    .find({ 
      sellerId, 
      status: { $in: ["Pending", "Quoted"] } 
    })
    .sort({ createdAt: -1 })
    .toArray()
}

export const updateRFQStatus = async (id: string, status: string) => {
  return await rfqs().updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        status, 
        updatedAt: new Date() 
      } 
    }
  )
}

export const addQuoteToRFQ = async (id: string, quoteData: any) => {
  return await rfqs().updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        quote: quoteData,
        status: "Quoted",
        updatedAt: new Date() 
      } 
    }
  )
}

export const getRFQStats = async (sellerId: string) => {
  const total = await rfqs().countDocuments({ sellerId })
  const pending = await rfqs().countDocuments({ sellerId, status: "Pending" })
  const quoted = await rfqs().countDocuments({ sellerId, status: "Quoted" })
  const accepted = await rfqs().countDocuments({ sellerId, status: "Accepted" })
  
  return { total, pending, quoted, accepted }
}