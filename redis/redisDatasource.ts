import { SchemaFieldTypes, SearchReply } from "redis"
import { Chat } from "../types"
import getRedisClient from "./client"
import { chatIndex, chatKey, contactListZKey, userSetKey } from "./keys"

export const registerNewUser = async (username: string, password: string) => {
    const client = await getRedisClient()
    const setResult = await client.set(username, password)
    if(setResult) {
        const saddResult = await client.SADD(userSetKey(), username)
		if (saddResult) {
			return
		} else {
			throw Error( `error while adding new user ${username}` )
		}
	} else {
		throw Error( `error while adding new user ${username}` )
	}
}

export const isUserExist = async (username: string) => {
	const client = await getRedisClient()
    const isMemberResult = await client.SISMEMBER(userSetKey(), username)
    return isMemberResult
}

export const isUserAuthentic = async (username: string, password: string) => {
	const client = await getRedisClient()
    const getResult = await client.get(username)
    if(getResult) {
        if(getResult === password) {
            return true
        } else {
            throw Error( `invalid username or password` )
        }
    } else {
        throw Error( `invalid username or password` )
    }
}



export const updateContactList = async (username: string, contact: string) => { 
	const client = await getRedisClient()
    const res = await client.ZADD(contactListZKey(username), {score: Date.now(), value: contact})
    console.log(res)
    return res
}

export const createChat = async (chat: Chat) => {
    const thisChatKey = chatKey()
	const client = await getRedisClient()
    const setResult = await client.json.set(
		thisChatKey,
		"$",
		chat
	)
    console.log("setResult", setResult)
    await updateContactList(chat.from, chat.to)
    await updateContactList(chat.to, chat.from)
    return thisChatKey
}

export const createFetchChatBetweenIndex = async () => {
	const client = await getRedisClient()
    const res = await client.ft.create(
        chatIndex(),
        {
            '$.from': {
                type: SchemaFieldTypes.TEXT,
                AS: 'from'
            },
            '$.to': {
                type: SchemaFieldTypes.TEXT,
                AS: 'to'
            },
            '$.timestamp': {
                type: SchemaFieldTypes.NUMERIC,
                AS: 'timestamp',
                SORTABLE: true
            }
        }, {
            ON: 'JSON',
            PREFIX: ['1', 'chat#']
        }
    )
    console.log("res", res)
}

export const fetchChatBetween = async (
    from: string, 
    to: string, 
    fromTimestamp: string, 
    toTimestamp: string
): Promise<Chat[]> => {
    const client = await getRedisClient()
    const query = `@from:{${from} | ${to}} AND @to:{${from} | ${to}} AND @timestamp: [${fromTimestamp} ${toTimestamp}]`
    const queryResult = await client.ft.search(
        chatIndex(),
        query,
        {
            SORTBY: {
                BY: "timestamp",
                DIRECTION: "DESC"
            }
        }
    )
    let result: Chat[] = []
    if(queryResult) {
        result = mapRedisResultToChat(queryResult)
    }
    return result
}

const mapRedisResultToChat = (
    result: SearchReply
): Chat[]  => {
    const chatList: Chat[] = []
    result.documents.forEach(a => {
        chatList.push({
            id: a.id,
            from: a.value.from?.toString() || "",
            to: a.value.to?.toString() || "",
            timestamp: parseInt(a.value.timestamp?.toString() || "0") || 0,
            message: a.value.message?.toString() || "",
        })
    })
    return chatList
}

export const fetchContactList = async (username: string) => {
    const client = await getRedisClient()
    const res = await client.ZRANGEBYSCORE_WITHSCORES(
        contactListZKey(username), 
        0,
        Date.now()
    )
    return res.map(a => {
            return {
                username: a.value,
                last_activity: a.score
            }
        })
}