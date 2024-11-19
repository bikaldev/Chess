const Player = require('../models/player.model');
const poolDb = require('../database/db');

const disconnectCallback = async (clients, playerId) => {

    // clear all timeouts & intervals
    clearTimeout(clients.get(String(playerId)).timeout);
    clearInterval(clients.get(String(playerId)).intervalId);

    try {
        // get player object
        const player = await Player.getPlayer(playerId);
        // remove from lobby
        await player.leaveLobby()
        // retrieve matchDetails
        const match = await player.getPlayerMatchDetail();
        // change match status to completed, send socket message to opponent declaring them winner
        await poolDb.query(
            'UPDATE matches SET status = $1, winner = $2 WHERE match_id = $3',
            ['completed', playerId, match.match_id]
        );

        const opponent_id = (match.player_id1 == playerId)? match.player_id2: match.player_id1;
        const opponent_socket = clients.get(String(opponent_id)).ws;

        if(opponent_socket) opponent_socket.send(JSON.stringify({
            type: 'match_complete',
            result: 'loss',
            reason: 'abandonment'
        }));

    } catch(err) {
        console.log(err);
    } finally {
        clients.delete(String(playerId));
    }
    
}

const getOpponentId = async (playerId) => {
    const response = await poolDb.query(
        "SELECT * FROM matches WHERE status = 'ongoing' AND (player_id1 = $1 OR player_id2 = $1);"
    , [playerId]);
    
    if(response.rows.length === 0) return null;
    
    return playerId === response.rows[0].player_id1?response.rows[0].player_id2:response.rows[0].player_id1;
}

module.exports = {
    disconnectCallback,
    getOpponentId
};

