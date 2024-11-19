import './display.css';

import {useNavigate} from 'react-router-dom';
import { Button } from '@mui/material';
import { useGameState } from '../Board/GameProvider';
import { useUser } from '../Auth/AuthProvider';

const API_URL = process.env.REACT_APP_API_URL || "http://api";

export default function PairingScreen() {
    const navigate = useNavigate();
    const gameState = useGameState();
    const user = useUser();
    let statusText = 'Connecting...';

    const handleCancel = async () => {
        navigate('/');
        if(!user.name || gameState.playerId == null) return;

        try {
            await fetch(
                API_URL + '/leaveLobby',
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: user.name,
                        playerId: gameState.playerId,
                    })
                }
            );

        } catch(err) {
            console.log("Could not leave lobby.");
            // maybe reschedule the lobby leaving process
            // easier to timeout the lobby time

        }
    }


    switch(gameState.status) {
        case 'waiting': {
            statusText = 'Waiting for other players';
            break;
        }
        case 'paired': {
            statusText = "Paired with opponent. Redirecting...";
            break;
        }

        case 'error': {
            statusText = "Something went wrong. Try Again!";
            break;
        }

        case 'anonymous': {
            statusText = "Anonymous players can't pair with other players";
            break;
        }

        default:
            {
                statusText = "Connecting...";
                break;
            }
    }

    return (
        <div className="overlay">
            <div className="status">
                {statusText}
            </div>
            <Button color='error' onClick={handleCancel}>Cancel</Button>
        </div>
    );
}