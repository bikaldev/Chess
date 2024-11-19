const express = require('express');
const Player = require('../models/player.model');
// const clients = require('../websocket/websocket');

const router = express.Router();

router.post('/joinLobby', async (req, res) => {
    if(req.session.userID) {
        // authenticated user
        const { username } = req.body;
        const player = new Player(username, 'waiting');

        try {
            const pairResult = await player.joinLobby();
            if(pairResult.status === "waiting") {
                return res.status(200).json(
                    {
                        message: "Waiting for other players to join.", 
                        status: "waiting",
                        playerId: pairResult.playerId,
                        // isYourTurn: true,
                    });
            } else {

                const clients = req.clients;
                const opponentKey = pairResult.playerId2;
                const opponent_socket = clients.get(String(opponentKey))?.ws;

                if(opponent_socket) opponent_socket.send(JSON.stringify({
                    status: 'paired',
                    matchId: pairResult.matchId,
                    playerId: pairResult.playerId2,
                    opponentName: username,
                    isYourTurn: false,
                    side: 'black',
                }));

                return res.status(200).json(
                    {
                        message: "Paired with opponent.",
                        status: "paired",
                        playerId1: pairResult.playerId1, 
                        playerId2: pairResult.playerId2, 
                        opponentName: pairResult.player2_name,
                        matchId: pairResult.matchId,
                        isYourTurn: true,
                        side: 'white'
                    });
            }
        } catch(err) {
            console.log(err);
            return res.status(500).json({message: "Something went wrong!", cause: err.detail});
        }
        

    } else {
        return res.status(401).json({message: 'Not authorized to join lobby.'});
    }
});


router.post('/leaveLobby', async (req, res) => {
    if(!req.session.userID) {
        return res.status(401).json({message: "Not authorized to leave lobby."});
    }

    try {
        const { playerId, username } = req.body;
        const player = new Player(username, undefined, playerId);
        await player.leaveLobby();

        res.status(200).json({message: "Successfully removed player from lobby"});

    } catch(err) {
        return res.status(500).json({message: "Could not remove player from lobby.", cause: err.detail});
    }
})

router.post('/getMatchDetail', async (req, res) => {
    if(!req.session.userID) return res.status(401).json({message: "Not authorized!"});

    try {
        const { matchId } = req.body;
        const matchDetail = await Player.getMatchDetail(matchId);
        return res.status(200).json({message: 'Retrieved Successfully.', detail: matchDetail}) ;
    } catch(err) {
        return res.status(500).json({message: "Could not retrieve match status", cause: err.detail});
    }
});

module.exports = router;