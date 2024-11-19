import './board.css';

import { useBoard } from "./BoardProvider";

export function BoardHistory() {
    const board = useBoard();


    let notationList = [];
    for (let i = 1; i < board.length; i += 2) {
        if (i + 1 < board.length) {
            notationList.push([board[i].boardState.notation, board[i+1].boardState.notation]);
        } else {
            notationList.push([board[i].boardState.notation]);
        }
    }

    return (
        <div className="game-history-board">
            <div className='game-history-row'>
                <div className='game-history-number'>
                    {'  '}
                </div>
                <h3 className='game-history-move'>
                    Moves
                </h3>
            </div>
            {
                notationList.map((notations, idx) => {
                    return (
                        <div className='game-history-row' key = {idx}>
                            <h5 className='game-history-number' key = {idx}>{idx + 1}</h5>
                            {
                                notations.map((value, idx) => <h4 className='game-history-move' key={value + idx}>{value}</h4>)
                            }
                        </div>
                    )
                })
            }
        </div>
    );
    


}