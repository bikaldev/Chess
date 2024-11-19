require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const RedisStore = require('connect-redis').default;

// create a redis client
const redis = require('redis');
const redisClient = redis.createClient({
    socket: {
        // eslint-disable-next-line
        host: process.env.REDIS_HOST,
        // eslint-disable-next-line
        port: +process.env.REDIS_PORT,
    }
});
redisClient.connect().catch(console.error);

const userRoutes = require('./routes/user.routes.js');
const loginRoutes = require('./routes/login.routes.js');
const matchRoutes = require('./routes/match.routes.js');
const gameRoutes = require('./routes/game.routes.js');
const {disconnectCallback, getOpponentId} = require('./websocket/websocket.js');

const app = express();
const server = http.createServer(app)
const wss = new WebSocket.Server({server});

const clients = new Map();

async function sendHeartbeat(ws, playerId) {
    if(!clients.has(playerId)) return;

    return new Promise((resolve, reject) => {
        ws.isAlive = false;
        ws.send(JSON.stringify({type: 'heartbeat'}));
        
        const timeout = clients.get(playerId).timeout;
        if(timeout) clearTimeout(timeout);
        clients.get(playerId).timeout = setTimeout(() => {
        if(!ws.isAlive) {
            // client unresponsive
            clients.get(playerId).isConnected = false;
            clearInterval(clients.get(playerId).intervalId);
            getOpponentId(+playerId).then(
                opponentId => {
                                clients.get(String(opponentId))?.ws.send(JSON.stringify({ type: 'opponent_disconnected'}));
                                clients.get(playerId).reconnectTimeout = setTimeout(() => {
                                    if(!clients.get(playerId)?.isConnected) {
                                        reject("Client Disconnected!");
                                    } else {
                                        resolve("Client is Connected");
                                    }
                                    
                                },  60 * 1000) //1 minute for reconnection
                            }
            );
        }
        },  20 * 1000); //10s to respond to the heartbeat message
    })

}

wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const playerId = url.searchParams.get('playerId');
    clients.set(playerId, {ws, isConnected: true});
    ws.isAlive = true;
    const opponentId = await getOpponentId(+playerId)
    clients.get(String(opponentId))?.ws.send(JSON.stringify(
                {
                    type: 'opponent_reconnected'
                }
            ));

    clients.get(playerId).intervalId = setInterval(async () => {
        try {
            await sendHeartbeat(ws, playerId);
        } catch{
            disconnectCallback(clients, playerId);
        }
    },30 * 1000);//Heartbeat message every 30s.

    ws.on('close', () => {
        clients.get(playerId).isConnected = false;
    });

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        console.log(`Received message from ${playerId} `, data);
        if(data.type === 'heartbeat_ack') {
            ws.isAlive = true;
            clearTimeout(clients.get(playerId).timeout);
            return;
        }

        if(data.type === 'draw_offer') {
            ws.send(JSON.stringify({
                type: 'draw_offer_ack'
            }));

            const opponentId = await getOpponentId(+playerId);
            if(opponentId === null) {
                ws.send(JSON.stringify({
                    type: 'draw_reply',
                    accept: false
                }
                ));
                return;
            }
            const opp_ws = clients.get(String(opponentId))?.ws;
            if(!opp_ws) {
                ws.send(JSON.stringify({
                    type: 'draw_reply',
                    accept: false
                }));
                
                return;
            }

            opp_ws.send(JSON.stringify({
                type: 'draw_offered'
            }));

            clients.get(playerId).draw_state = 'offered';
            clients.get(playerId).drawTimeout = setTimeout(() => {
                if(clients.get(playerId).draw_state === 'offered') {
                    // no answer
                    ws.send(JSON.stringify({
                        type: 'draw_reply',
                        accept: false,
                    }));
                }
                clients.get(playerId).draw_state = null;
                clients.get(playerId).drawTimeout = null;

            }, 20 * 1000);
            return;
        }

        if(data.type === 'draw_response') {
            const opponentId = await getOpponentId(+playerId);
            if(!opponentId) return;

            const opponent = clients.get(String(opponentId));
            if(!opponent) return;

            console.log("reached this point");
            clearTimeout(opponent.drawTimeout);
            opponent.ws.send(JSON.stringify({
                type: 'draw_reply',
                accept: data.accept
            }));

            return;
        }


    });
});


// eslint-disable-next-line
const PORT =  process.env.PORT || 8080;

app.use(cors({
    // eslint-disable-next-line
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());

app.use(session({
    // eslint-disable-next-line
    secret: process.env.SESSION_KEY,
    store: new RedisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 * 1,  // 1 day expiration
        secure: false,
    }
}))

app.use((req, _, next) => {
    req.clients = clients;
    next();
});

app.use(userRoutes);

app.use(loginRoutes);

app.use(matchRoutes);

app.use(gameRoutes);

server.listen(PORT, () => {
    console.log(`[ChessBackend]: Listening at port ${PORT}`);
});



