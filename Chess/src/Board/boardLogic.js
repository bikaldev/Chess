
export function checkValidity(board, initPosition, finalPosition, boardState) {
    const possibleMoves = getValidMoves(board, initPosition.row, initPosition.col, boardState);

    return Boolean(possibleMoves.find(([row, col]) => row === finalPosition.row && col === finalPosition.col));
}


export function getMoveNotation(newBoard, oldBoard,row1, col1, row2, col2,  isCheck, isMate, isPromotion = false,) {

    const [color,piece] = isPromotion? oldBoard[row2][col2].split('-') :oldBoard[row1][col1].split('-');
    const isCapture = isPromotion? (Math.abs(col2 - col1) > 0) :!!oldBoard[row2][col2];
    
    if(piece === "king" && Math.abs(col2 - col1) == 2) {
        // castling move
        if(col2 - col1 > 0) return 'O-O';
        else return 'O-O-O';
    }

    // determine the appropriate symbol;
    let symbol = getPieceSymbol(piece);

    // rowNotation --> 7 - row & colNotation = String.fromCharCode(col + 97);
    if(piece === "knight") {
        // if another knight can jump to the same place, name the current col.
        
       const dupKnight = oldBoard.some((row, rID) => !!row.find((col, cID) => {
        if(col === `${color}-${piece}` && (rID !== row1 || cID !== col1)) {
            const possibleMoves = getPieceCaptureView(oldBoard, rID, cID);
            return possibleMoves.some(value => value[0] === row2 && value[1] === col2);
        }
        return false;
        
       }));

       if(dupKnight) symbol += String.fromCharCode(97 + col1);

    } else if(piece === "pawn") {
        // name the current col
        symbol += String.fromCharCode(97 + col1);
    } 

    if(isCapture) symbol += 'x';
    const colNotation = String.fromCharCode(col2 + 97);
    const rowNotation = 8 - row2;
    if(symbol !== colNotation) symbol += colNotation;
    symbol += rowNotation;
    if(isPromotion) symbol += `=${getPieceSymbol(newBoard[row2][col2].split('-')[1])}`;
    if(isCheck && !isMate) symbol += '+';
    if(isMate) symbol += '#';

    return symbol;
}

export function getPieceSymbol(piece) {
    switch(piece) {
        case 'knight':
            return 'N';
        case 'pawn':
            return '';
        case 'queen':
        case 'rook':
        case 'bishop':
        case 'king':
            return piece[0].toUpperCase();
        default:
            throw(Error(`[ERROR]: No piece named ${piece} exists.`));
    }
}

export function checkResult(grid, state) {
    const nextTurn = state.whiteToPlay? "white": "black";
    const kingPiece = nextTurn + "-king";
    let kingRow, kingCol;
    kingRow = grid.findIndex(row => row.find((col, cId) => {
        if(col === kingPiece) {
            kingCol = cId;
            return true;
        }
        return false;
    }
    ));

    const possibleMoves = getValidMoves(grid, kingRow, kingCol, state);
    if(possibleMoves.length === 0) {
        const anyMove = grid.some((row, rID) => row.some((col, cID) => {
            if(!col) return false;
            if(col.split('-')[0] === nextTurn) {
                const moves = getValidMoves(grid, rID, cID, state);
                if(moves.length > 0) return true;
            }

            return false;
        }));

        if(!anyMove) {
            return checkForCheck(grid, nextTurn)? "checkmate": "stalemate";
        }
    }

    return null;
}

/*
Returns true if the board position contains the check for the side given in the argument.
Returns false otherwise.
*/
export function checkForCheck(board, side) {
    // find the position of {side}-king
    const kingPos = {
        row: null,
        col: null,
    };

    // ("Checking for check in the board: ", board);

    kingPos.row = board.findIndex(row => {
        const colIndex = row.findIndex(col => col == `${side}-king`);
        if(colIndex !== -1) {
            kingPos.col = colIndex;
            return true;
        }
        return false;
        });
    // ("King Position: ", kingPos);
    
    // search all the directions for attack on the king
    // list the endpoints to be checked
    let endPointList = [
        [0, kingPos.col],
        [7, kingPos.col],
        [kingPos.row, 0],
        [kingPos.row, 7],
        [kingPos.row + 2, kingPos.col + 1],
        [kingPos.row - 2, kingPos.col + 1],
        [kingPos.row + 2, kingPos.col - 1],
        [kingPos.row - 2, kingPos.col - 1],
        [kingPos.row + 1, kingPos.col + 2],
        [kingPos.row - 1, kingPos.col + 2],
        [kingPos.row + 1, kingPos.col - 2],
        [kingPos.row - 1, kingPos.col - 2],
    ];

    if(kingPos.row + kingPos.col >= 7) {
        endPointList.push([kingPos.row + kingPos.col-7,7]);
        endPointList.push([7, kingPos.row + kingPos.col-7]);
    } else {
        endPointList.push([0, kingPos.row + kingPos.col]);
        endPointList.push([kingPos.row + kingPos.col,0]);
    }

    if(kingPos.row >= kingPos.col) {
        endPointList.push([kingPos.row - kingPos.col,0]);
        endPointList.push([7, 7-(kingPos.row - kingPos.col)]);
    } else {
        endPointList.push([0,kingPos.col - kingPos.row]);
        endPointList.push([7-(kingPos.col - kingPos.row),7]);
    }

    // (endPointList);

    endPointList = endPointList.filter(
        (point) => (point[0] >= 0 && point[0] < 8 && point[1] >= 0 && point[1] < 8) &&
    (point[0] !== kingPos.row || point[1] !== kingPos.col));

    // (endPointList);

    let kingAttacked, pathValue, slope, captureList;
    for(let [frow, fcol] of endPointList) {
        // ("Checking the direction: ",[frow,fcol]);

        slope = calculateSlope(kingPos.row, kingPos.col, frow, fcol);
        // ("Slope: ", slope);
        if(Math.abs(slope) === Infinity || Math.abs(slope) === 1 || Math.abs(slope) === 0) {

            pathValue = checkPath(board, kingPos.row, kingPos.col, frow, fcol);
            // ("Path check: ", pathValue);

            if(pathValue.empty && !pathValue.piece) continue;
            if(pathValue.piece.split("-")[0] === side) continue;

            captureList = getPieceCaptureView(board, pathValue.row, pathValue.col)
            // ("capture list", captureList);
            kingAttacked = captureList.find(
                move => move[0] === kingPos.row && move[1] === kingPos.col
            );
            // ("kingAttacked value:", kingAttacked);
            // ("King attacked from: ", captureList[kingAttacked]);
            if(kingAttacked !== undefined) return true;
        } else {
            if(board[frow][fcol] === `${side == "white"? "black":"white"}-knight`) return true;
        }
    }
    
    return false;
}


export function checkPromotion(initPos, finalPos) {
    const [color, piece] = initPos.piece.split('-');
    return piece === "pawn" && (finalPos.row === 0 || finalPos.row === 7);
}

/*
Returns {empty: true, piece: null/piece on (frow, fcol)} if no piece found from (irow, icol) to (frow, fcol) not including (frow, fcol)
Returns {empty: false, piece: `side-pieceType`, row: int, col: int} if piece found in path.
*/
function checkPath(board, irow, icol, frow, fcol) {
    // returns true if path is empty
    let square;
    const row_direction =  (frow - irow !== 0)? (frow - irow) / Math.abs(frow-irow) : 0;
    const col_direction = (fcol - icol !== 0)?  (fcol - icol) / Math.abs(fcol-icol) : 0;

    if(irow !== frow) irow += row_direction;
    if(icol !== fcol) icol += col_direction;

    while(irow !== frow || icol !== fcol) {
        square = board[irow][icol];
        if(square) return {
            empty: false,
            piece: square,
            row: irow,
            col: icol,
        };  
        if(irow !== frow) irow += row_direction;
        if(icol !== fcol) icol += col_direction;
    }
    return {
        empty: true,
        piece: board[frow][fcol],
        row: frow,
        col: fcol,
    };
}


function getPieceCaptureView(board, row, col) {
    /* 
    boardState looks like: {
        enPassant: {
            flag: true/false,
            row: int/null,
            col: int/null,
        },
        short_castle: {
            white: true/false,
            black: true/false,
        },
        long_castle: {
            white: true/false,
            black: true/false,
        },
    }
    */
    
    const piece = board[row][col];
    if(piece === null) return [];
    const [pieceColor, pieceType] = piece.split("-");


    let possibleMoves;
    switch(pieceType) {
        case 'knight': {
            possibleMoves = [
                [row + 2, col + 1],
                [row - 2, col + 1],
                [row + 2, col - 1],
                [row - 2, col - 1],
                [row + 1, col + 2],
                [row - 1, col + 2],
                [row + 1, col - 2],
                [row - 1, col - 2],
            ]

            return possibleMoves.filter(move => {
                if(move[0] >= 0 && move[0] < 8 && move[1] >= 0 && move[1] < 8){
                    const target =  board[move[0]][move[1]];
                    if(!target) return true;
                    if(target.split("-")[0] === pieceColor) return false;
                    return true; 
                }
                return false;
            });
        }
            


        case 'rook': {
            possibleMoves = [
                [0, col],
                [7, col],
                [row, 0],
                [row, 7],
            ]

            return possibleMoves
            .filter(move => move[0] !== row || move[1] !== col)   
            .map(move => {
                const pathValue = checkPath(board, row, col, move[0], move[1]);
                if(pathValue.empty && !pathValue.piece) return move;
                if(pathValue.piece.split("-")[0] === pieceColor) {
                    if(move[0] === row) {
                        const change = (col > pathValue.col)? 1:-1;
                        return [pathValue.row, pathValue.col + change];
                    } else {
                        const change = (row > pathValue.row)? 1: -1;
                        return [pathValue.row + change, pathValue.col];
                    }
                }

                return [pathValue.row, pathValue.col];
            })
            .filter(move => move[0] !== row || move[1] !== col);

        }
            


        case 'bishop': {
            possibleMoves = [];
            if(row + col >= 7) {
                possibleMoves.push([row + col-7,7]);
                possibleMoves.push([7, row + col-7]);
            } else {
                possibleMoves.push([0, row + col]);
                possibleMoves.push([row + col,0]);
            }

            if(row >= col) {
                possibleMoves.push([row - col,0]);
                possibleMoves.push([7, 7-(row - col)]);
            } else {
                possibleMoves.push([0,col - row]);
                possibleMoves.push([7-(col - row),7]);
            }
        

            return possibleMoves
                    .filter(move => move[0] !== row || move[1] !== col)
                    .map(move => {
                const pathValue = checkPath(board, row, col, move[0], move[1]);
                if(pathValue.empty && !pathValue.piece) return move;
                if(pathValue.piece.split("-")[0] === pieceColor) {
                    const changeRow = (row > pathValue.row)? 1: -1;
                    const changeCol = (col > pathValue.col)? 1: -1;
                    return [pathValue.row + changeRow, pathValue.col + changeCol];
                }

                return [pathValue.row, pathValue.col];
            });

        }   
            

        case 'queen': {
            possibleMoves = [
                [0, col],
                [7, col],
                [row, 0],
                [row, 7],
            ]

            if(row + col >= 7) {
                possibleMoves.push([row + col-7,7]);
                possibleMoves.push([7, row + col-7]);
            } else {
                possibleMoves.push([0, row + col]);
                possibleMoves.push([row + col,0]);
            }

            if(row >= col) {
                possibleMoves.push([row - col,0]);
                possibleMoves.push([7, 7-(row - col)]);
            } else {
                possibleMoves.push([0,col - row]);
                possibleMoves.push([7-(col - row),7]);
            }


            return possibleMoves
                        .filter(move => move[0] !== row || move[1] !== col)
                        .map(move => {
                const pathValue = checkPath(board, row, col, move[0], move[1]);
                if(pathValue.empty && !pathValue.piece) return move;
                if(pathValue.piece.split("-")[0] === pieceColor) {
                    if(move[0] === row) {
                        const change = (col > pathValue.col)? 1:-1;
                        return [pathValue.row, pathValue.col + change];
                    } else if(move[1] === col){
                        const change = (row > pathValue.row)? 1: -1;
                        return [pathValue.row + change, pathValue.col];
                    } else {
                        const changeRow = (row > pathValue.row)? 1: -1;
                        const changeCol = (col > pathValue.col)? 1: -1;
                        return [pathValue.row + changeRow, pathValue.col + changeCol];
                    }
                    
                }

                return [pathValue.row, pathValue.col];
            })
                        .filter(move => move[0] !== row || move[1] !== col);

        }
            


        case 'pawn': {
            // forward direction
            const forward = pieceColor === "white" ? -1 : 1;
            possibleMoves = [
                [row + forward, col + 1],
                [row + forward, col - 1],
            ];

            return possibleMoves.filter(move => move[0] >= 0 && move[0] < 8 && move[1] >= 0 && move[1] < 8);
        }
            


        case 'king': {
            possibleMoves = [
                [row + 1, col + 1],
                [row + 1, col - 1],
                [row - 1, col + 1],
                [row - 1, col - 1],
                [row + 0, col + 1],
                [row + 0, col - 1],
                [row + 1, col + 0],
                [row - 1, col + 0],
            ]

            return possibleMoves.filter(move => move[0] >= 0 && move[0] < 8 && move[1] >= 0 && move[1] < 8);
        }
            

        default:
            return []
        
    }
}

export function getValidMoves(board, row, col, boardState) {
//get all valid moves of piece board[row][col] if exists else return [].

if(!board[row][col]) return [];
const [pieceColor, pieceType] = board[row][col].split('-');


switch(pieceType) {
    case 'rook':
    case 'bishop':
    case 'queen':
        {
            let captureList = getPieceCaptureView(board, row, col);

            // return 
            captureList = captureList
                        .map(move => expandMoves(row, col, move[0], move[1]))
            captureList = captureList            .reduce((accm, curr) => accm.concat(curr), [])
            captureList = captureList         .filter(move => !(move[0] == row && move[1] == col))
            captureList =    captureList         .filter(move => !checkForPin(board, row, col, move[0], move[1]));
            return captureList
        }
    
    case 'knight': {
        return getPieceCaptureView(board, row, col).filter(value => !checkForPin(board, row, col, value[0], value[1]));
    }
     
    case 'pawn':
        {
            const changeRow = (pieceColor === "white")? -1: 1;
            let possibleMoves = [
                [row + changeRow, col],
                [row + 2*changeRow, col],
                [row + changeRow, col + 1],
                [row + changeRow, col - 1],
            ];
            // within range
            possibleMoves = possibleMoves.filter(value => value[0] >= 0 && value[0] < 8 && value[1] >=0 && value[1] < 8);

            // isn't pinned in that direction
            possibleMoves = possibleMoves.filter(value => !checkForPin(board, row, col, value[0], value[1]));

            // clearance of path
            possibleMoves = possibleMoves.filter(([frow, fcol]) => {
                if(fcol === col) {
                    // straight moves
                    let pathValue = checkPath(board, row, col, frow, fcol);
                    // for length 2 only in starting position
                    if(Math.abs(row - frow) === 2 && !(row === 6 && changeRow == -1) && !(row == 1 && changeRow == 1)) return false;
                    return pathValue.empty && !pathValue.piece;
                } else {
                    // diagonal captures
                    let pathValue = checkPath(board, row, col, frow, fcol);
                    if(pathValue.empty && !pathValue.piece) {
                        //check en passant
                        if(boardState.enPassant.flag && boardState.enPassant.row === row && boardState.enPassant.col === fcol) {
                            // en passant is valid
                            if(!boardState.registeredCallbacks) boardState.registeredCallbacks = {};
                            
                            boardState.registeredCallbacks[`${frow}-${fcol}`] = (board) => {
                                return board.map((r, rID) => {
                                    return r.map((c, cID) => {
                                        if(rID == row && cID == fcol) return null;
                                        return c;
                                    })
                                })
                            }
                            
                            

                            return true;
                        };

                        return false;                  
                    };
                    if(pathValue.piece.split('-')[0] === pieceColor) return false;
                    return true;
                }
            });

            return possibleMoves;
            
        }
    case 'king':
        {
            let captureList = getPieceCaptureView(board, row, col);
                
                // if()
            captureList =  captureList
                .filter(([frow, fcol]) => !checkForPin(board, row, col, frow, fcol))
                .filter(([frow, fcol]) => {
                    const pathValue = checkPath(board, row, col, frow, fcol);
                    if(pathValue.empty && !pathValue.piece) return true;
                    if(pathValue.piece.split('-')[0] === pieceColor) return false;
                    return true;
                });
            
            // castles
            if(!checkForCheck(board, pieceColor)) {
                if(boardState.longCastle[pieceColor]) {
                    // rookCol
                    const shortRookCol = 0;
                    const shortRookRow = (pieceColor == "white")? 7:0;
                    const pathValue = checkPath(board, row, col, shortRookRow, shortRookCol);
                    if(pathValue.empty && pathValue.row == shortRookRow && pathValue.col == shortRookCol) {
                        if(!checkForPin(board, row, col, row, col - 2) && captureList.some(move => move[0] == row && move[1] == col - 1)){
                            captureList.push([row, col - 2]);
                            if(!boardState.registeredCallbacks) boardState.registeredCallbacks = {};
                             
                            boardState.registeredCallbacks[`${row}-${col-2}`] = (board) => {
                                return board.map((r, rID) => r.map((c, cID) => {
                                    if(rID == shortRookRow && cID == shortRookCol) return null;
                                    if(rID == row && cID == col - 1) return `${pieceColor}-rook`;
                                    return c;
                                }));
                            }
                        }
                    }
                }

                 if(boardState.shortCastle[pieceColor]) {
                    const longRookCol = 7;
                    const longRookRow = (pieceColor == "white")? 7:0
                    const pathValue = checkPath(board, row, col, longRookRow,longRookCol);
                    if(pathValue.empty && pathValue.row == longRookRow && pathValue.col == longRookCol) {
                        if(!checkForPin(board, row, col, row, col + 2) && captureList.some(move => move[0] == row && move[1] == col + 1)){
                            captureList.push([row, col + 2]);

                            if(!boardState.registeredCallbacks) boardState.registeredCallbacks = {};
                             
                            boardState.registeredCallbacks[`${row}-${col+2}`] = (board) => {
                                return board.map((r, rID) => r.map((c, cID) => {
                                    if(rID == longRookRow && cID == longRookCol) return null;
                                    if(rID == row && cID == col + 1) return `${pieceColor}-rook`;
                                    return c;
                                }));
                            }
                            
                        }
                        
                    }

                }

                
            }

            return captureList;
        }
    
    default:
        return [];

}

}

function checkForPin(board, row1, col1, row2, col2) {
    if(!board[row1][col1]) return false;

    const [color, piece] = board[row1][col1].split('-');
    // check for pin
    const nextBoard = board.map((row, rId) => {
        return row.map((col, cId) => {
            if(rId == row1 && cId == col1) return null;
            if(rId == row2 && cId == col2 ) return `${color}-${piece}`;
            return col;
        });
    });

    return checkForCheck(nextBoard, color);

}

function expandMoves(row1, col1, row2, col2) {
    // (x1,y1) <--> (col1, row1)
    // (x2, y2) <--> (col2, row2)
    // slope determines the squares in the path
    // NOTE: only works for straight & diagonal moves
    if(row1 === row2 && col1 === col2) return [];

    const slope = calculateSlope(row1, col1, row2, col2);

    switch(Math.abs(slope)) {
        case Infinity:
            if(slope === Infinity) {
                return Array.from({length: row2 - row1 + 1}, (_, i) => [row1+i, col1]);
            } else {
                return Array.from({length: row1 - row2 + 1}, (_, i) => [row1-i, col1]);
            }
        
        case 0:
            // differentiate between -0 and 0
            if(col2 > col1) {
                return Array.from({length: col2 - col1 + 1}, (_, i) => [row1, col1 + i]);
            } else {
                return Array.from({length: col1 - col2 + 1}, (_,i) => [row1, col1 - i]);
            }
        
        case 1:
            const changeRow = row2 > row1 ? 1: -1;
            const changeCol = col2 > col1 ? 1: -1;
            return Array.from({length: Math.abs(row2 - row1) + 1}, (_,i) => [row1 + i * changeRow, col1 + i*changeCol]);
    
        default:
            return []
        }
}

function calculateSlope(row1, col1, row2, col2) {
    // (x1,y1) <--> (col1, row1)
    // (x2, y2) <--> (col2, row2)

    if(col2 - col1 == 0) return row2 > row1? Infinity: -Infinity;
    return (row2 - row1)/(col2 - col1);
}