import { cloneDeep } from "lodash";
import { createContext, useContext, useReducer } from "react";

const GameContext = createContext(null);
const GameDispatchContext = createContext(null);

export function useGameState() {
    return useContext(GameContext);
}

export function useGameDispatch() {
    return useContext(GameDispatchContext);
}

export function GameProvider({children}) {
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);

    return (
        <GameContext.Provider value = {gameState}>
            <GameDispatchContext.Provider value = {dispatch}>
                {children}
            </GameDispatchContext.Provider>
        </GameContext.Provider>
    )
}

const setLocalStorage = (gameState) => localStorage.setItem('gameState', JSON.stringify({
    state: gameState,
    timestamp: Date.now()
}));

function gameReducer(gameState, action) {
    
    switch(action.type) {

        case 'set_status':
            {
                const newState = {
                    ...gameState,
                    status: action.status,
                    playerId: action.playerId
                };

                setLocalStorage(newState);
                return newState
            }

        case 'set_matchid': {
            const matchId = action.matchId;
            const playerId = action.playerId;
            
            const newState =  {
                ...gameState,
                status: 'paired',
                matchId,
                playerId,
                opponentName: action.opponentName,
                isMyTurn: action.isMyTurn,
                side: action.side,
            }

            setLocalStorage(newState);
            return newState;
        }
        case 'change': {
            const newState = {
                ...gameState,
                ...action,
                type: undefined,
            }

            setLocalStorage(newState);
            return newState;
        }

        case 'reset':
            {
                const newState = cloneDeep(initialGameState);

                setLocalStorage(newState);
                return newState;
            }

        case 'completed':
            {
                gameState.websocket.close();
                const newState = {
                    ...gameState,
                    completed: true,
                    result: {
                        type: action.result,
                        reason: action.reason,
                    }
                };
                setLocalStorage(newState);
                return newState;
            }
        
        case 'set_ws':
            {
                const newState = {
                    ...gameState,
                    websocket: action.websocket,
                }
                setLocalStorage(newState);
                return newState;
            }
        
        case 'consume_lastMove':
            {
                const newState = {
                    ...gameState,
                    lastMove: {
                        initPos: null,
                        finalPos: null,
                        piece: null,
                    }
                };
                setLocalStorage(newState);
                return newState;
            }
        
        case 'initiate_pass&play':
            {
                const newState = cloneDeep(initialGameState);
                newState.side = "white";
                newState.matchId = 'pass&play';
                newState.playerId = 'pass&play';
                newState.isMyTurn = true;

                setLocalStorage(newState);
                return newState;

            }
        
        case 'switch_pass&play':
            {
                const newState = {
                    ...gameState,
                    side: (gameState.side === "white"? "black": "white"),
                }

                setLocalStorage(newState);

                return newState;
            }
        
        case 'set':
            {   
                setLocalStorage(action.state);
                return action.state;
            }
        
        case 'set_myTime':
            {
                const newState = {
                    ...gameState,
                    myTime: action.myTime,
                }

                setLocalStorage(newState);
                return newState;
            }
        
        case 'set_oppTime':
            {
                const newState = {
                    ...gameState,
                    oppTime: action.oppTime
                }
                
                setLocalStorage(newState);
                return newState;
            }
        
        default:
            throw new Error(`Action ${action.type} not defined for game state.`);
    }
    
}


const initialGameState = {
    matchType: null,
    status: null,
    matchId: null,
    playerId: null,
    lastMove: {
        initPos: null,
        finalPos: null,
        notation: null,
    },
    isMyTurn: null,
    completed: false,
    result: {
        type: null, // win , draw, loss
        reason: null, // checkmate, stalemate, abandonement, Insufficient Material, Resignation, Draw Offer
    },
    websocket: null,
}


