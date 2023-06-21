import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import * as http from 'http';
import * as WebSocket from 'ws';
import { chatHistoryHandler, contactListHandler, loginHandler, registerHandler, testHandler, verifyContactHandler } from './handlers/httpHandlers';
import { Chat, Message } from './types';
import { createChat } from './redis/redisDatasource';
import cors from 'cors';

dotenv.config();

const app: Express = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const wsMap = new Map<string, WebSocket>()

const broadcast = (w: WebSocket, c: Chat) => {
}

wss.on('connection', (ws: WebSocket) => {

    ws.on('message', async (message: string) => {
      const res: Message = JSON.parse(message)
      if(res.type === 'bootup' && res.user) {
        wsMap.set(res.user, ws)
      }
      if(res.type === 'message' && res.chat) {
        let c = res.chat
        c.timestamp = Date.now()

        const created = await createChat(c)

        const fromWS = wsMap.get(c.from)
        const toWS = wsMap.get(c.to)
        fromWS && fromWS.send(JSON.stringify(c))
        toWS && toWS.send(JSON.stringify(c))
      }
    });
});

const httpPort = process.env.PORT;
const wsPort = process.env.WS_PORT;

server.listen(wsPort, () => {
  console.log(`Websocket Server started on port ${wsPort}`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.post('/register', registerHandler)
app.post('/login', loginHandler)
app.post('/verify-contact', verifyContactHandler)
app.get('/chat-history', chatHistoryHandler)
app.get('/contact-list', contactListHandler)

app.listen(httpPort, () => {
    console.log(`HTTP Server is running at http://localhost:${httpPort}`);
});
