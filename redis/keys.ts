export const userSetKey = () => "users"
export const sessionKey = (client: string) => `session#${client}`
export const chatKey = () => `chat#${Date.now()}`
export const chatIndex = () => `idx#chats`
export const contactListZKey = (username: string) => `contacts:${username}`