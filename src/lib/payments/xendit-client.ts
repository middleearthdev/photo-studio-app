import { Xendit } from 'xendit-node'

let xenditClient: Xendit | null = null

export function getXenditClient() {
  if (!xenditClient) {
    xenditClient = new Xendit({
      secretKey: process.env.XENDIT_SECRET_KEY || '',
    })
  }
  
  return xenditClient
}