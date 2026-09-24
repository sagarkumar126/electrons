export const getRoomId = (buyerId: string, sellerId: string, productId: string) => {
  return [buyerId, sellerId, productId].sort().join("_")
}