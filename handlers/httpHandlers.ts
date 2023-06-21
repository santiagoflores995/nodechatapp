import { Request, Response } from "express";
import getRedisClient from "../redis/client";
import { fetchChatBetween, fetchContactList, isUserAuthentic, isUserExist, registerNewUser, updateContactList } from "../redis/redisDatasource";

type UserRequestBody = {
    password?: string,
    username?: string,
    client?: string
}

export const registerHandler = async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
    const {username, password} = req.body
    if (!password || !username) {
        res.status(400).json({message: "missing username or password"})
        return
    }
    if (await isUserExist(username)) {
        res.status(400).json({message: "username already exist"})
        return
    }
    await registerNewUser(username, password)
    res.status(200).json({message: "successfuly registered new user"})
}

export const loginHandler = async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
    const {username, password } = req.body
    if (!password || !username) {
        res.status(400).json({message: "missing username or password"})
        return
    }
    const loginResult = await isUserAuthentic(username, password)
    res.status(200).json({status: true, message: "successfuly logged in"})
}

export const verifyContactHandler = async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
    const {username} = req.body
    if (!username) {
        res.status(400).json({message: "missing username or password"})
        return
    }
    const status = await isUserExist(username)
    res.status(200).json({status, message: ""})
}

export const chatHistoryHandler = async (req: Request<{}, {}>, res: Response) => {
    const {u1, u2, fromTimestamp, toTimestamp} = req.query
    console.log("params", u1, u2)
    if (!u1 || !u2) {
        res.status(400).json({message: "missing usernames"})
        return
    }
    const username1 = u1.toString()
    const username2 = u2.toString()
    let from = fromTimestamp ? fromTimestamp.toString() : "0"
    let to = toTimestamp ? toTimestamp.toString() : "+inf"
    if(!isUserExist(username1) || !isUserExist(username2)) {
        res.status(400).json({message: "usernames not exist"})
        return
    }
    const chatsData = await fetchChatBetween(username1, username2, from, to)
    res.status(200).json({status: true, data: chatsData, total: chatsData.length, message: "successfuly fetched chat history"})
}

export const contactListHandler = async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
    const {username} = req.query
    if (!username) {
        res.status(400).json({message: "missing usernames"})
        return
    }
    const data = await fetchContactList(username.toString())
    res.status(200).json({status: true, data, total: data.length, message: "successfuly fetched contact list"})
}

export const testHandler = async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
    const {username, password} = req.body
    // await updateContactList(username, password)
    res.status(200).json({message: "successfuly updated contact list"})
}
