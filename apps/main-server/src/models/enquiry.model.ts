import { getDB } from "../db/mongo"

export const enquiries = () => {
  return getDB().collection("enquiries")
}