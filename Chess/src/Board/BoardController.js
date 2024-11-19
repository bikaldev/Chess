import { useEffect, useState } from "react";
import ChessBoard from "./Board";
import { BoardHistory } from "./BoardHistory";
import { useBoardDispatch } from "./BoardProvider";
import { useGameDispatch, useGameState } from "./GameProvider";
import { useUser } from "../Auth/AuthProvider";

import {Box, Snackbar, Button} from '@mui/material';
import UserCard from './UserCard';
import { useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";

const API_URL = process.env.REACT_APP_API_URL || "http://api";

export function BoardController(){

    const user = useUser();
    const gameState = useGameState();

    const boardDispatch = useBoardDispatch();
    const gameDispatch = useGameDispatch();
    const theme = useTheme();

    const navigate = useNavigate();
    // const navigate = useAppNavigator();

    const [drawInfo, setDrawInfo] = useState('');

    let enable = gameState.matchId !== null && gameState.isMyTurn;

    useEffect(() => {
        if(gameState.completed) {
            boardDispatch({
                type: 'complete',
                resultType: gameState.result.type,
                reason: gameState.result.reason,   
                side: gameState.side,  
            })
        }
        if(gameState.drawOffer === "offered") {
            setDrawInfo('Draw Offer Sent');
        }
        if(gameState.drawOffer === "acknowledged") {
            setDrawInfo('Draw Offer Acknowledged!');
        }
        if(gameState.drawOffer === "accepted") {
            setDrawInfo('Draw Offer Accepted!');
        }
        if(gameState.drawOffer === "rejected") {
            setDrawInfo('Draw Offer Rejected!');
        }
        if(gameState.drawOffer === "received") {
            setDrawInfo('Draw Offered By Opponent.');
        }
        if(!gameState.drawOffer) {
            setDrawInfo('');
        }

        if(gameState.matchId !== null && gameState.isMyTurn && !gameState.completed) {
            if(gameState.lastMove?.initPos && gameState.lastMove?.finalPos) {
                boardDispatch({
                    type: 'move',
                    initialPosition: gameState.lastMove.initPos,
                    finalPosition: gameState.lastMove.finalPos,
                });
                if(gameState.isPromotion) {
                   boardDispatch({
                    type: 'promote',
                    piece: gameState.lastMove.finalPos.piece
                   });
                }
                
                gameDispatch({
                    type: 'consume_lastMove'
                });
            }
        }
    }, [gameState]);
    

    async function onMove(initPos, finalPos, isPromotion) {
        try {
            await fetch(
                API_URL + '/makeMove',
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        matchId: gameState.matchId,
                        playerId: gameState.playerId,
                        isPromotion: isPromotion,
                        move: {
                            initPos,
                            finalPos,
                            timestamp: Date.now()
                        }
                    })
                }
            );
            enable = false;
        } catch(err) {
            console.log(err);
            // retry making the move? network problem?
        } finally {
            enable = false;
        }         
        
    }

    async function onComplete(winner, reason) {

        return new Promise(async (resolve, reject) => {
            try {
                await fetch(
                    API_URL + '/complete',
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-type': 'application/json',
                        },
                        body: JSON.stringify({
                            matchId: gameState.matchId,
                            playerId: gameState.playerId,
                            complete: true,
                            winner: (winner == null)? null: (winner === gameState.side? "me" : "opponent"),
                        })
                    }
                )
        
                enable = false;
                gameDispatch({
                    type: 'completed',
                    result: winner == null ? "draw": (winner === gameState.side? "win" : "loss"),
                    reason: reason
                });

                resolve('Safely Completed!');
            } catch(err) {
                reject(err);
            }
            
        });
        
    }

    function onGoBack() {
        boardDispatch({
            type: 'reset'
        });

        gameDispatch({
            type: 'reset'
        });
        
        navigate('/board');
    }

    async function onResign() {
       
        try {
            await fetch(
                API_URL + '/resign',
                {
                    method:'POST',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        matchId: gameState.matchId,
                        playerId: gameState.playerId                
                    })
                }
            );
            enable = false;
            gameDispatch({
                type: 'completed',
                result: 'loss',
                reason: 'resignation',
            });
    
        } catch(err) {
            console.log(err);
        }  
    }

    function onOfferDraw() {
        const mySocket = gameState.websocket;
        gameDispatch({
            type: 'change',
            drawOffer: 'offered',
        });
        mySocket.send(JSON.stringify({
            type: 'draw_offer'
        }));

    }

    const handleAccept = () => {
        const mySocket = gameState.websocket;
        mySocket.send(JSON.stringify({
            type: 'draw_response',
            accept: true
        }));
        gameDispatch({
            type: 'completed',
            result: 'draw',
            reason: 'agreement'
        });
        gameDispatch({
            type: 'change',
            drawOffer: null,
        })
        setDrawInfo('');

    }
    const handleReject = () => {
        const mySocket = gameState.websocket;
        mySocket.send(JSON.stringify({
            type: 'draw_response',
            accept: false
        }));
        gameDispatch({
            type: 'change',
            drawOffer: null,
        })
        setDrawInfo('');
    }


    return (

<Box display="flex" flexDirection="column" alignItems="start" justifyContent="center" flexGrow={1} sx={{ marginRight: '1%', marginLeft: '2%', height: '100%' }}>
      {/* Top sandwich component */}
      <Box display="flex"justifyContent="flex-start" marginBottom="1%">
        <Box width="50%">
          {gameState.matchId != null && <UserCard 
          key="opponent" username={gameState.opponentName} 
          isUserTurn={!enable && !gameState.completed} 
          isCurrentPlayer={false} 
          onResign={onResign} 
          />}
        </Box>
      </Box>

      {/* Chess Board and History */}
      <Box display="flex" width="100%" sx={{ marginLeft: '2%', marginRight: '0%' }}>
        {/* Left component */}
        <Box flex={1} display="flex">
          <ChessBoard enable={enable} onMove={onMove} onComplete={onComplete} onGoBack={onGoBack} side={gameState.side} />
        </Box>

        {/* Right component */}
        <Box flex={1} display="flex" sx={{ marginRight: '3%' }}>
          <BoardHistory />
        </Box>
      </Box>

      {/* Bottom sandwich component */}
      <Box display="flex" justifyContent="flex-start" marginTop="1%">
        <Box width="50%">
          {gameState.matchId != null && <UserCard 
          key="player" 
          username={user.name} 
          isUserTurn={enable && !gameState.completed} 
          isCurrentPlayer={true} 
          onResign={onResign}
          onDrawOffer={onOfferDraw}
          enableButtons={true}
          />}
        </Box>
      </Box>
      <Snackbar 
        open={drawInfo !== ''} 
        autoHideDuration={6000} 
        onClose={() => setDrawInfo('')}
        sx = {{
            bgColor: theme.palette.background.paper
        }}
        message = {drawInfo}
        action={gameState.drawOffer === "received" && 
            <>
                <Button color="primary" size="small" onClick={handleAccept}>
                Accept
                </Button>
                <Button color="secondary" size="small" onClick={handleReject}>
                Reject
                </Button>
            </>
            }
        >
        {/* <Alert severity="info" sx={{ width: '100%' }} onClose={() => setDrawInfo('')}>
          {drawInfo}
        </Alert> */}
      </Snackbar>
    </Box>
    );
}