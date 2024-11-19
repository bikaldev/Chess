import { cloneDeep } from "lodash";
import { createContext, useContext, useReducer } from "react";
import { checkValidity, getMoveNotation, checkForCheck, checkResult } from './boardLogic';

const moveSound = {
    'move': new Audio('/sounds/move-self.mp3'),
    'capture': new Audio('/sounds/capture.mp3'),
    'check': new Audio('/sounds/move-check.mp3'),
    'promote': new Audio('/sounds/promote.mp3'),
    'castle': new Audio('/sounds/castle.mp3'),
};


export const BoardContext = createContext(null);
export const BoardDispatchContext = createContext(null);

export function useBoard() {
    return useContext(BoardContext);
}

export function useBoardDispatch() {
    return useContext(BoardDispatchContext);
}

export function BoardProvider( { children }) {
    const [board, dispatch] = useReducer(boardReducer, initial_board);

    return (
        <BoardContext.Provider value={board}>
            <BoardDispatchContext.Provider value={dispatch}>
                {children}
            </BoardDispatchContext.Provider>
        </BoardContext.Provider>
    );
}

const setLocalStorage = (board) => {
    localStorage.setItem('board', JSON.stringify({board: board}));
}

function boardReducer(board, action) {

    switch(action.type) {
        case 'move': {
            const state = board[board.length - 1].boardState;
            const grid = board[board.length - 1].grid;
            const initialPosition = action.initialPosition;
            const finalPosition = action.finalPosition;

            // check valid turn
            if((state.whiteToPlay && initialPosition.piece.split('-')[0] === "black") ||
                !state.whiteToPlay && initialPosition.piece.split('-')[0] === "white") return board;

            // no move can be made while a promotion tab is open
            if(state.promotion.row !== null) return board;

            // check validity of move
            if(!checkValidity(grid, initialPosition, finalPosition, state)) return board;


            // make the move on the board
            let newGrid = grid.map(
                (row, rowId) => {
                    return row.map(
                        (col, colId) => {
                            if(rowId == finalPosition.row && colId == finalPosition.col) {
                                return initialPosition.piece;
                            }
                            if(rowId == initialPosition.row && colId == initialPosition.col) {
                                return null;
                            }
                            return col;
                        }
                    )
                }
            );


            // change board for special moves: en passant & castling
            if(state.registeredCallbacks?.[`${finalPosition.row}-${finalPosition.col}`]) {
                newGrid = state.registeredCallbacks[`${finalPosition.row}-${finalPosition.col}`](newGrid);
            }
            
            const newState = cloneDeep(state)

            // restore the registeredCallbacks to null
            newState.registeredCallbacks = null;

            // change newStateng to the move
            const [color, piece] = grid[initialPosition.row][initialPosition.col].split('-');

            // if rook move --> configure castling flags
            if(piece === 'rook') {
                if(newState.shortCastle[color]) {
                    // true is short, false is long and null is neither
                    const isShort = initialPosition.col == 0 && ((color == "white" && initialPosition.row == 7) || (color == "black" && initialPosition.row == 0));
                    if(isShort) newState.shortCastle[color] = false;
                }
                
                if(newState.longCastle[color]) {
                    const isLong = initialPosition.col == 7 &&  ((color == "white" && initialPosition.row == 7) || (color == "black" && initialPosition.row == 0));
                    if(isLong) newState.longCastle[color] = false;
                }
            }

            // if king move --> configure castling moves
            if(piece === "king") {
                newState.shortCastle[color] = false;
                newState.longCastle[color] = false;
            }

            // reset enPassant after a move(enPassant is allowed only for a single move)
            if(newState.enPassant.flag) {
                newState.enPassant.flag = false;
                newState.enPassant.row = null;
                newState.enPassant.col = null;
            }

            // if a pawn moves forward 2 steps enable enPassant flag
            if(piece === "pawn" && Math.abs(initialPosition.row - finalPosition.row) === 2) {
                newState.enPassant.flag = true;
                newState.enPassant.row = finalPosition.row;
                newState.enPassant.col = finalPosition.col;
            }

            // change turn
            newState.whiteToPlay = !newState.whiteToPlay;

            // if a pawn reaches the last rank, it promotes.
            // promotion should cause a selection tab to be opened letting the player pick a piece
            if(piece === "pawn" && (finalPosition.row === 7 || finalPosition.row === 0)) {
                // open promotion tab on a Board Square
                newState.promotion.row = finalPosition.row;
                newState.promotion.col = finalPosition.col;

                newState.promotion.initRow = initialPosition.row;
                newState.promotion.initCol = initialPosition.col;

            } else {
                

                const result = checkResult(newGrid, newState);
                if(result) newState.completed = true;
                switch(result) {
                    case 'stalemate':
                        newState.result.reason = result;
                        break;
                    case 'checkmate':
                        newState.result.reason = result;
                        newState.result.winner = newState.whiteToPlay?"black":"white";
                    default:
                        break;
                }

                const notation = getMoveNotation(newGrid, grid, initialPosition.row, initialPosition.col, finalPosition.row, finalPosition.col, checkForCheck(newGrid, color === "white"?"black":"white"), result === "checkmate");
                
                if(notation.includes('+')) moveSound.check.play();
                else if(notation.includes('O')) moveSound.castle.play();
                else if(notation.includes('x')) moveSound.capture.play();
                else moveSound.move.play();

            

                newState.notation = notation;
                
            }

            const newBoard = [
                ...board, {
                    grid: newGrid,
                    boardState: newState
                }
            ];

            setLocalStorage(newBoard);

            return newBoard;
            
        }

        
        case 'promote':
            const grid = board[board.length - 1].grid;
            const state = board[board.length -1].boardState;
            const newGrid = grid.map((row, rID) => row.map((col, cID) => {
                if(state.promotion.row === rID && state.promotion.col === cID) return action.piece;
                else return col;
            }));

            const newState = cloneDeep(state);
            const [color, _] = action.piece.split('-');

            const result = checkResult(newGrid, newState);
                if(result) newState.completed = true;
                switch(result) {
                    case 'stalemate':
                        newState.result.reason = result;
                        break;
                    case 'checkmate':
                        newState.result.reason = result;
                        newState.result.winner = newState.whiteToPlay?"black":"white";
                    default:
                        break;
                }

            const notation = getMoveNotation(
                newGrid, 
                grid, 
                state.promotion.initRow, 
                state.promotion.initCol, 
                state.promotion.row, 
                state.promotion.col, 
                checkForCheck(newGrid, color === "white"?"black":"white"), 
                result === "checkmate", 
                true
            );
            newState.notation = notation;

            moveSound.promote.play().then(
                () => {
                    if(notation.includes('+')) moveSound.check.play();
                    else if(notation.includes('x')) moveSound.capture.play();
                }
            );
            
            
            newState.promotion.row = null;
            newState.promotion.col = null;
            newState.promotion.initRow = null;
            newState.promotion.initCol = null;
    
            const newBoard = [
                ...board.slice(0, board.length - 1),
                {
                    grid: newGrid,
                    boardState: newState,
                }
            ];

            setLocalStorage(newBoard);
            return newBoard;

        
        case 'takeback': {
            // takeback last move
            // it is used when promotion tab is closed without selecting a piece
            // it may a user option in future
            const newBoard = cloneDeep(board);
            newBoard.pop();
            setLocalStorage(newBoard);
            return newBoard;
        }
            

        case 'complete': {
            const newGrid = cloneDeep(board[board.length -1].grid);
            const state = cloneDeep(board[board.length -1].boardState);

            state.completed = true;
            state.result.reason = action.reason;
            if(action.resultType === "win") {
                state.result.winner = action.side;
            } else if(action.resultType === "loss") {
                const opposite_side = (action.side === "white")? "black": "white";
                state.result.winner = opposite_side;
            } else {
                state.result.winner = null;
            }

            const newBoard = [
                ...board.slice(0, board.length - 1),
                {
                    grid: newGrid,
                    boardState: state,
                }
            ];

            setLocalStorage(newBoard);
            return newBoard;
        }

        case 'reset':
            {
                const newBoard = cloneDeep(initial_board);
                setLocalStorage(newBoard);
                return newBoard;
            }
        
        case 'set':
            {
                setLocalStorage(action.board);
                return action.board;
            }
        
        default:
            throw("[ERROR]: Unknown action ", action.type);
    }

}

const initial_board = [{
    grid: [
    ["black-rook", "black-knight", "black-bishop", "black-queen", "black-king", "black-bishop", "black-knight", "black-rook"],
    ["black-pawn", "black-pawn", "black-pawn", "black-pawn", "black-pawn", "black-pawn", "black-pawn", "black-pawn"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["white-pawn", "white-pawn", "white-pawn", "white-pawn", "white-pawn", "white-pawn", "white-pawn", "white-pawn"],
    ["white-rook", "white-knight", "white-bishop", "white-queen", "white-king", "white-bishop", "white-knight", "white-rook"]
  ],
  boardState: {
    enPassant: {
        flag: false,
        row: null,
        col: null,
    },
    shortCastle: {
        white: true,
        black: true,
    },
    longCastle: {
        white: true,
        black: true,
    },
    whiteToPlay: true,
    registeredCallbacks: null, // contains callbacks that make changes to the board in special moves
    promotion: {
        initRow: null,
        initCol: null, //used to store the square where there is promotion
        row: null,
        col: null,
    },
    lastMoveNotation: null,
    completed: false,
    result: {
        reason: null,
        winner: null,
    }
  }
}];
