import './board.css';

import { Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useBoard, useBoardDispatch } from './BoardProvider';
import { checkForCheck, checkPromotion, checkValidity, getValidMoves } from './boardLogic';

export default function ChessBoard({enable, onMove, onComplete ,onGoBack, side}) {
    // A grid of 8x8 BoardSquare Components.

    const board = useBoard();
    const dispatch = useBoardDispatch();
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState(null);

    // const [currentIndex, setCurrentIndex] = useState(board.length - 1);

    const grid = board[board.length - 1].grid;
    const state = board[board.length - 1].boardState;
    
    let displayGrid;
    if(side === "black") {
        displayGrid = grid.map(
            (row, rowId) =>  row.map((_, cId) => grid[7-rowId][7-cId])
        );
    } else {
        displayGrid = grid;
    }

    const result = state.completed;
    let resultStatus = '';
    let resultReason = '';

    if(result) {
        resultReason = `By ${state.result.reason[0].toUpperCase() + state.result.reason.slice(1,)}`;
        switch(state.result.reason) {
            case 'checkmate':
            case 'abandonment':
            case 'resignation': 
            case 'timeout':
            {
                resultStatus = `${state.result.winner[0].toUpperCase() + state.result.winner.slice(1,)} Wins!`
                break;
            }
                
            case 'stalemate':
            case 'agreement':
            case 'insufficient material': {
                resultStatus = 'Draw!';
                break;
            }
                
            default: 
                break;
        }
    }

    if(result && !isComplete) {
        onComplete(state.result.winner, state.result.reason).then(
            () => setIsComplete(true)
        );
    }


    async function onMovePiece(initialPosition, finalPosition){
        setPossibleMoves([]);
        setSelectedSquare(null);
        if(!enable) return;

        if(side === "black") {
            initialPosition.row = 7 - initialPosition.row;
            initialPosition.col = 7 - initialPosition.col;
            finalPosition.row = 7 - finalPosition.row;
            finalPosition.col = 7 - finalPosition.col;
        }

        dispatch({
            type: 'move',
            initialPosition: initialPosition,
            finalPosition: finalPosition,
        });

        if(checkValidity(grid, initialPosition, finalPosition, state) && !checkPromotion(initialPosition, finalPosition)) {
            try {
                await onMove(initialPosition, finalPosition, false);
            } catch(err) {
                console.log(err);
                dispatch({
                    type: 'takeback',
                });
            }
            
        } 
        setPossibleMoves([]);
    }

    async function onSquareSelect(row, col, isClick) {
        if(!isClick && !selectedSquare) {
            setSelectedSquare({
                row,
                col,
            });
            if(side === "black") setPossibleMoves(getValidMoves(grid, 7 - row, 7 - col, state).map(([row, col]) => [7 - row, 7 - col]));
            else setPossibleMoves(getValidMoves(grid, row, col, state));
            return;
        }
        if(isClick) {
            setPossibleMoves([]);
            setSelectedSquare(null);
            return;
        }

        if(!isClick && selectedSquare) {
            const initPos = {
                row: selectedSquare.row,
                col: selectedSquare.col,
                piece: displayGrid[selectedSquare.row][selectedSquare.col]
            };
            const finalPos = {
                row,
                col,
                piece: displayGrid[row][col]
            };

            await onMovePiece(initPos, finalPos);

            setPossibleMoves([]);
            setSelectedSquare(null);
        }
    }


    return (
        <div className='board-enclosure'>
            <div className="board">
            {
                displayGrid.map(
                    (row, rowIndex) => row.map(
                        (col, colIndex) => {
                            const color = (colIndex + rowIndex) % 2 == 0? "light": "dark";
                            const position = `${rowIndex}-${colIndex}`;
                            let isPromotion; 
                            if(side === "black") {
                                isPromotion = (state.promotion.row === 7 - rowIndex) && (state.promotion.col === 7 - colIndex) && state.promotion.row === 7;
                            } else {
                                isPromotion = (state.promotion.row === rowIndex) && (state.promotion.col === colIndex) && state.promotion.row === 0;
                            }
                            const isPossible = possibleMoves.some(([row, col]) => rowIndex === row && colIndex === col);
                            const highlightSquare = selectedSquare? (selectedSquare.row == rowIndex && selectedSquare.col == colIndex): false;
                            return (
                                <BoardSquare 
                                    side = {side}
                                    piece = {col} 
                                    color={color} 
                                    key={position} 
                                    position={position}
                                    onMovePiece = {onMovePiece}
                                    isPromotion={isPromotion}
                                    isPossible = {isPossible}
                                    onSquareSelect = {onSquareSelect}
                                    onPromotionSelect= {onMove}
                                    highlightSquare = {highlightSquare}
                                />
                            );
                        } 
                        
                    )
                )
            }
            </div>
            {
                result && <div className="result-box">
                <p className='result-text'>{resultStatus}</p>
                <p className='reasult-reason-text'>{resultReason}</p>
                <Button variant='outlined' startIcon={<ArrowBack/>} onClick={onGoBack}>
                    Go Back
                </Button>
            </div>
            }  
        </div>
        
    );

}

function BoardSquare({
    side,
    piece, 
    color, 
    position,
    onMovePiece,
    isPromotion,
    isPossible,
    onSquareSelect,
    onPromotionSelect,
    highlightSquare
}) {

    const [isClick, setIsClick] = useState(false);
    const board = useBoard();
    const squareElement = useRef(null);

    // A single square in a Chess Board.
    const imagePath = `/images/pieces-basic-png/${piece}.png`;

    // should provide a on drag-and-drop method.
    let [row, col] = position.split('-');
    row = +row;
    col = +col;

    const [pieceColor, _] = piece? piece.split('-'): [null, null];

    const isCheck =  piece === `${pieceColor}-king`? checkForCheck(board[board.length - 1].grid, pieceColor): false;

    useEffect(() => {
        const clickHandler = (event)=> {
            if(!squareElement.current.contains(event.target) && isClick && piece) {
                squareElement.current.classList.remove('selected');
                onSquareSelect(row, col, isClick);
                setIsClick(false);        
            }
        };
        window.addEventListener('click', clickHandler);

        return () => {
            window.removeEventListener('click', clickHandler);
        }
    }, [isClick]);

    const handleClick = () => {
        onSquareSelect(row, col, isClick);
        setIsClick(!isClick);
    }

    const handleDragStart = (event) => {
        event.stopPropagation();
        if(!piece) return;
        const eventData = {
            row: row,
            col: col,
            piece: piece
        }
       
        event.dataTransfer.setData('application/json', JSON.stringify(eventData));
    }

    const handleDragDrop = (event) => {
        event.preventDefault(); // Prevent default behavior
        const data = (event.dataTransfer.getData('application/json'))? JSON.parse(event.dataTransfer.getData('application/json')) : null;

        if(!data) return;

        onMovePiece(data, {
            row: row,
            col: col,
            piece: piece,
        });
    }


    return (
        <div className={`board-square ${isCheck?'check':color} ${highlightSquare?'selected':''} `} onDrop={handleDragDrop} onDragOver = {e => e.preventDefault()} onClick={handleClick} ref={squareElement}>
            {isPromotion && <SelectPiece color={side} key={position} onMove={onPromotionSelect}/>}
            {piece && !isPromotion &&
            <img src={imagePath} className="piece-img" alt={piece}
                draggable 
                onDragStart={handleDragStart} 
            />
            }

            {isPossible && <div className='possible-tag'></div>}

        </div>
    );
}

function SelectPiece({
    color,
    onMove
}) {

    const pieces = ['queen', 'rook', 'bishop', 'knight'];

    
    const dispatch = useBoardDispatch();
    const board = useBoard();
    
    const onSelectPiece = async (event) => {
        dispatch({
            type: 'promote',
            piece: event.target.alt,
        });
        const state = board[board.length - 1].boardState;
        await onMove({
            row: state.promotion.initRow,
            col: state.promotion.initCol,
            piece: `${color}-pawn`,
        }, {
            row: state.promotion.row,
            col: state.promotion.col,
            piece: event.target.alt,
        }, true);
    } ;


    // closing and taking back move if pressed outside the tab
    useEffect(() => {
        const clickHandler = (event)=> {
            const selectionTab = document.querySelector('.selection-tab');
            if(!selectionTab.contains(event.target)) {
                // takeback a move
                dispatch({
                    type: 'takeback',
                });
            }
        };
        window.addEventListener('click', clickHandler);

        return () => {
            window.removeEventListener('click', clickHandler);
        }
    }, []);

    return (
        <div className={`selection-tab ${color}`}>
            {
                pieces.map(piece => {
                    const imagePath = `/images/pieces-basic-png/${color}-${piece}.png`;

                    return (
                        <div className='selection-item' key={piece} onClick={onSelectPiece}>
                            <img src={imagePath} className="selection-img" alt={`${color}-${piece}`} 
                            />
                        </div>
                );
                })
            }
            
        </div>
    )
}