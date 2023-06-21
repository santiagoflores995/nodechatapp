export type Chat = {
    id: string
    from: string
    to: string
    message: string
    timestamp: number
}

export type ContactList = {
    username: string
    lastActivity: number
}


export type Client = {
	conenction: string
	username: string
}

export type Message = {
	type?: string
	user?: string
	chat?: Chat
}