const express = require('express');
const Player = require('../models/player.model');

const router = express.Router();


router.post('/makeMove', async (req, res) => {
    if(!req.session.userID) return res.status(401).json({message: "Missing credentials"});

    const { matchId, playerId, move, isPromotion } = req.body;
    if(!matchId) return res.status(400).json({message: "Request missing matchId"});

    try {
        const matchDetail = await Player.getMatchDetail(matchId);

        if(matchDetail.turn === playerId) {
            // valid turn
            // TODO: store move in database
            // change the turn value in match database
            const opponent_id = matchDetail.player_id1 === playerId? matchDetail.player_id2 : matchDetail.player_id1;
            await Player.changeTurn(matchId, opponent_id, move);

            // Notify the clients about their turn
            const clients = req.clients;
            const player1_socket = clients.get(String(playerId)).ws;
            const opponent_socket = clients.get(String(opponent_id)).ws;

            player1_socket.send(JSON.stringify({isYourTurn: false, lastMove: move, isPromotion}));

            opponent_socket.send(JSON.stringify({isYourTurn: true, lastMove: move, isPromotion}));

            return res.status(200).json({message: "Move made successfully!"});

        } else {
            return res.status(400).json({message: "Not your turn."});
        }
    } catch(err) {
        console.log(err);
        return res.status(500).json({message: "Server Error.", cause: err.message});
    }

});

router.post('/complete', async (req, res) => {
    if(!req.session.userID) return res.status(401).json({message: "Missing credentials"});

    const { matchId, playerId, winner } = req.body;
    if(!matchId) return res.status(400).json({message: "Request missing matchId"});

    const matchDetail = await Player.getMatchDetail(matchId);

    if(matchDetail.status === "ongoing") {
        const opponent_id = (matchDetail.player_id1 === playerId? matchDetail.player_id2: matchDetail.player_id1);
        const winnerId = winner == null? null: (winner === "me")? playerId: opponent_id;
        await Player.changeMatchStatus(matchId, "completed", winnerId);
        
        // Notify the clients about completion
        const clients = req.clients;
        const player1_socket = clients.get(String(playerId)).ws;
        const opponent_socket = clients.get(String(opponent_id)).ws;

        player1_socket.close();
        opponent_socket.close();

    }

    
    return res.status(200).json({message: "Game completed successfully!"});
});


router.post('/resign', async (req, res)=> {
    if(!req.session.userID) return res.status(401).json({message: "Missing credentials"});

    const { matchId, playerId } = req.body;
    if(!matchId) return res.status(400).json({message: "Request missing matchId"});

    const matchDetail = await Player.getMatchDetail(matchId);

    if(matchDetail.status === "ongoing") {
        const opponent_id = (matchDetail.player_id1 === playerId? matchDetail.player_id2: matchDetail.player_id1);
        await Player.changeMatchStatus(matchId, "completed", opponent_id);
        
        // Notify the clients about completion
        const clients = req.clients;
        const player1_socket = clients.get(String(playerId)).ws;
        const opponent_socket = clients.get(String(opponent_id)).ws;

        opponent_socket.send(JSON.stringify({
            type: 'match_complete',
            result: 'win',
            reason: 'resignation'
        }));

        player1_socket.close();
        opponent_socket.close();

    }

    
    return res.status(200).json({message: "Game completed successfully!"});

});

module.exports = router;