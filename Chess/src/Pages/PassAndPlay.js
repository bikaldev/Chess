import { useEffect } from 'react';
import { useGameDispatch, useGameState } from '../Board/GameProvider';
import { useNavigate } from 'react-router-dom';

import { Box, Button } from '@mui/material';
import { ExitToApp } from '@mui/icons-material';

import ChessBoard from '../Board/Board';
import { BoardHistory } from '../Board/BoardHistory';
import { useBoardDispatch } from '../Board/BoardProvider';

export default function PassAndPlayPage() {

    const gameDispatch = useGameDispatch();
    const boardDispatch = useBoardDispatch();

    const gameState = useGameState();
    const navigate = useNavigate();
    // const navigate = useAppNavigator();

    const enable = true;

    useEffect(() => {
        gameDispatch({
            type: 'initiate_pass&play'
        });
    }, [])

    function onMove() {
        gameDispatch({
            type: 'switch_pass&play'
        });
    }

    async function onComplete() {
        return new Promise((resolve, reject) => {
            gameDispatch({
                type: 'reset'
            });
            resolve(null);
        })
    };

    function onGoBack() {
        boardDispatch({
            type: 'reset'
        });

        navigate('/board');
    }
    
    function handleLeave() {
        gameDispatch({
            type: 'reset'
        });
        boardDispatch({
            type: 'reset'
        });
        navigate('/board');
    }

    return (
        <Box display="flex" alignItems="center" justifyContent="center" sx = {{ height: '100%', width: '100%',padding: '5%'}}>
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: '100%', width: '100%'}}>
                <ChessBoard enable={enable} onMove={onMove} onComplete={onComplete} onGoBack={onGoBack} side={gameState.side} />
                <BoardHistory />  
            </Box>
            <Button startIcon={<ExitToApp/>} variant='text' color='error' onClick={handleLeave} sx = {{
                position: 'absolute',
                top: '5%',
                left: '1%',
            }}> 
                EXIT GAME 
            </Button>
        </Box>

    )
}
