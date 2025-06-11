// src/lib/rate-limit.ts
const requests = new Map();

export function rateLimit(identifier: string, limit = 10, window = 60000) {
  const now = Date.now();
  const userRequests = requests.get(identifier) || [];
  
  // מחק בקשות ישנות
  const validRequests = userRequests.filter((time: number) => now - time < window);
  
  if (validRequests.length >= limit) {
    return false; // חסום
  }
  
  validRequests.push(now);
  requests.set(identifier, validRequests);
  return true; // אפשר
}