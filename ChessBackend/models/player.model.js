/*                                        Table "public.players"
  Column   |         Type          | Collation | Nullable |                  Default                   
-----------+-----------------------+-----------+----------+--------------------------------------------
 player_id | integer               |           | not null | nextval('players_player_id_seq'::regclass)
 username  | character varying(50) |           |          | 'anonymous'::character varying
 status    | character varying(10) |           | not null | 'waiting'::character varying
Indexes:
    "players_pkey" PRIMARY KEY, btree (player_id)
Referenced by:
    TABLE "matches" CONSTRAINT "matches_player_id1_fkey" FOREIGN KEY (player_id1) REFERENCES players(player_id)
    TABLE "matches" CONSTRAINT "matches_player_id2_fkey" FOREIGN KEY (player_id2) REFERENCES players(player_id)
 */

/* 
                                        Table "public.matches"
   Column   |         Type          | Collation | Nullable |                  Default                  
------------+-----------------------+-----------+----------+-------------------------------------------
 match_id   | integer               |           | not null | nextval('matches_match_id_seq'::regclass)
 player_id1 | integer               |           | not null | 
 player_id2 | integer               |           | not null | 
 status     | character varying(10) |           | not null | 'ongoing'::character varying
Indexes:
    "matches_pkey" PRIMARY KEY, btree (match_id)
Foreign-key constraints:
    "matches_player_id1_fkey" FOREIGN KEY (player_id1) REFERENCES players(player_id)
    "matches_player_id2_fkey" FOREIGN KEY (player_id2) REFERENCES players(player_id)
*/

const poolDb = require('../database/db');

class Player {
    constructor(username, status = 'waiting', player_id = null) {
        this.username = username;
        this.status = status;
        this.player_id = player_id;
    }

    async joinLobby() {
        const client = await poolDb.connect();

        try {
            await client.query('BEGIN');

            // looking for existence in the table
            const { rows } = await client.query(
                'SELECT * FROM players WHERE username = $1',
                [this.username]
            );

            if(rows.length > 0) {
                client.query(
                    "UPDATE players SET status = 'waiting' WHERE player_id = $1;",
                    [rows[0].player_id]
                );
                this.player_id = rows[0].player_id;
            } else {
                // inserting to the players table
                const { rows } = await client.query(
                    'INSERT INTO players(username, status) VALUES($1, $2) RETURNING player_id;',
                    [this.username, this.status]
                );

                this.player_id = rows[0].player_id;
            }
            

            // check for opponents
            const opponentsResult = await client.query(
                "SELECT player_id, username FROM players WHERE status='waiting' AND player_id <> $1 LIMIT 1 ;",
                [this.player_id]
            );

            if(opponentsResult.rows.length > 0) {
                const opponent_id = opponentsResult.rows[0].player_id;
                const opponent_name = opponentsResult.rows[0].username;
                // update status of both players to 'playing'
                
                await client.query(
                    "UPDATE players SET status = 'playing' WHERE player_id = $1 OR player_id = $2;",
                    [this.player_id, opponent_id]
                );

                // create a match record
                const pair_result = await client.query(
                    "INSERT INTO matches(player_id1, player_id2, status, turn) VALUES($1, $2, 'ongoing', $1) RETURNING match_id;",
                    [this.player_id, opponent_id]
                );

                const matchId = pair_result.rows[0].match_id;

                await client.query('COMMIT');
                return {
                    matchId,
                    playerId1: this.player_id,
                    playerId2: opponent_id,
                    player2_name: opponent_name,
                    status: 'paired',
                    turn: this.player_id,
                };
            } else {
                // no opponent found, keep waiting
                await client.query('COMMIT');
                return {
                    playerId: this.player_id,
                    status: 'waiting'
                };
            }

        } catch(err) {
            await client.query('ROLLBACK');
            console.log('[PAIRING ERROR]: Cannot pair player.');
            throw err;
        } finally {
            client.release();
        }
    }

    async leaveLobby() {
        if(this.username == null) return;

        const client = await poolDb.connect();

        try {
            await client.query('BEGIN')
            const response = await client.query(
                "UPDATE players SET status = 'inactive' WHERE username = $1 AND (status = 'playing' OR status = 'waiting')",
                [this.username]
            );

            console.log(response.rows);
            client.query('COMMIT')

            return true;

        } catch(err) {
            client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async getPlayerMatchDetail() {
        try {
            const result = await poolDb.query(
                "SELECT * FROM matches WHERE status = 'ongoing' AND (player_id1 = $1 OR player_id2 = $1);",
                [this.player_id]
            );
    
            if(result.rows.length > 0) {
                return result.rows[0];
            }
    
            throw new Error(`No match found with player_id: ${this.player_id}`);
        } catch(err) {
            const errObj = new Error("Database error!");
            errObj.cause = err.detail;
            throw errObj;
        }
    }

    static async getPlayer(playerId) {
        try {
            const result = await poolDb.query(
                "SELECT * from players WHERE player_id = $1;",
                [playerId]
            );

            if(result.rows.length > 0) {
                const player = result.rows[0];
                return new Player(player.username, player.status, player.player_id);
            } 

            throw new Error("Player not found!");
        } catch(err) {
            const errObj = new Error("Database error!");
            errObj.cause = err.detail;
            throw errObj;
        }
    }

    static async getMatchDetail(matchId) {
        
        try {
            const result = await poolDb.query(
                "SELECT * FROM matches WHERE match_id = $1;",
                [matchId]
            );
    
            if(result.rows.length > 0) {
                return result.rows[0];
            }
    
            throw new Error(`No match found with id: ${matchId}`);
        } catch(err) {
            const errObj = new Error("Database error!");
            errObj.cause = err.detail;
            throw errObj;
        }
        
    }
    
    static async changeTurn(matchId, turn, move) {
        try {
            await poolDb.query(
                "UPDATE matches SET turn = $1, last_move = $2 WHERE match_id = $3;",
                [turn, move, matchId]
            );

        } catch(err) {
            const errObj = new Error("Database error!");
            errObj.cause = err.detail;
            throw errObj;
        }
    }

    static async changeMatchStatus(matchId, status, winner) {
        try {
            await poolDb.query(
                "UPDATE matches SET status = $1, winner = $3 WHERE match_id = $2;",
                [status, matchId, winner]
            );
        } catch(err) {
            const errObj = new Error("Database error!");
            errObj.cause = err.detail;
            throw errObj;
        }
    }

    async getMatchHistory() {
        const client = await poolDb.connect();
        try {
            await client.query('BEGIN');
            const matchResponse = await client.query(
                "SELECT * FROM matches WHERE status = 'completed' AND (player_id1 = $1 OR player_id2 = $1);",
                [this.player_id]
            );

            if(matchResponse.rowCount === 0) return [];

            const result = await Promise.all(matchResponse.rows.map(async (match) => {
                const playerSide = (match.player_id1 === this.player_id)? "White": "Black";
                const opponentSide = (playerSide === "White")? "Black": "White";
                const opponentId = (match.player_id1 === this.player_id)? match.player_id2: match.player_id1;
                const response = await client.query('SELECT * FROM players WHERE player_id = $1;', [opponentId]);
                const opponentName = response.rows[0].username;
                const finishTime = match.last_move.timestamp;
                const result = (match.winner == null)?'Draw': (match.winner == this.player_id)?'Win':'Loss';

                return {
                    finishTime,
                    playerSide,
                    opponentSide,
                    opponentName,
                    result,
                }
            }));

            client.query('COMMIT');
            return result;

        } catch(err) {
            console.log(err);
            client.query('ROLLBACK');
        } finally {
            client.release();
        }
    }

}

module.exports = Player;