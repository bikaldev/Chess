import React, { useState, useEffect } from 'react';
import { Box, Button, Drawer, Snackbar, Alert, Avatar, Typography, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { PlayCircleOutline, History, Computer, Menu, AccountCircle, Logout } from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUser, useUserDispatch } from '../Auth/AuthProvider';
import { useGameDispatch, useGameState } from '../Board/GameProvider';
import { useBoardDispatch } from '../Board/BoardProvider';

const API_URL = process.env.REACT_APP_API_URL || "http://api";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "ws://api";

export default function HomePage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText]=  useState('');
  const [isPrevGame, setIsPrevGame] = useState(false);
  const [oppStatus, setOppStatus] = useState(null);

  const user = useUser();
  const userDispatch = useUserDispatch();

  const gameState = useGameState();
  const gameDispatch = useGameDispatch();

  const boardDispatch = useBoardDispatch();

  const navigate = useNavigate();
  // const navigate = useAppNavigator();

  const isLoggedIn = user.auth;
  const playEnable = gameState.matchId == null;

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);


  useEffect(() => {

    async function autoLogin() {
        const response = await fetch(
            API_URL + '/login',
            {
                method: 'POST',
                credentials: 'include'
            }
        )

        if(response.status >= 400) {
            clearCookie('connect.sid');
            return;
        } 
        
        const body = await response.json();
        const { name, email } = body.user;

        userDispatch({
            type: 'login',
            username: name,
            email: email,
        });   

        const storedGameState = localStorage.getItem('gameState');
        const storedBoardState = localStorage.getItem('board');
        if(storedGameState && storedBoardState && !isPrevGame) {
          const gameState = JSON.parse(storedGameState).state;
          if(gameState.matchId && !gameState.complete) {
            // ongoing game according to the gamestate
            const response = await fetch(API_URL + '/getMatchDetail', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-type': 'application/json'
              },
              body: JSON.stringify({
                matchId: gameState.matchId
              })
            });

            if(response.status >= 400) return;

            const body = await response.json();
            if(body.detail.status === "ongoing") {
              setIsPrevGame(true);
            }
          }
        }
    }

    autoLogin();
}, []);

  const handleLogout = async() => {
    try {
      await fetch(
        API_URL + '/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      ); 
      
      userDispatch({
        type: 'logout',
      });

      setShowAlert(true);
      setAlertText('Successfully Logged Out!');

    } catch(err) {
      console.log(err);
      setShowAlert(true);
      setAlertText('Failed to Log Out! Try Again.');

    }
    
  };


  const handlePlayOnline = async() => {
    if(isPrevGame) {
      const gameState = JSON.parse(localStorage.getItem('gameState')).state;
      const board = JSON.parse(localStorage.getItem('board')).board;
      
      gameDispatch({
        type: 'set',
        state: gameState
      });

      boardDispatch({
        type: 'set',
        board: board
      });

      // what should be the time?
      // get timing information from opponent(if connected)
      const lastSavedTimestamp = JSON.parse(localStorage.getItem('gameState')).timestamp;

      const response = await fetch(API_URL + '/getMatchDetail', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          matchId: gameState.matchId
        })
      });
      const body = await response.json();
        

      if(body.detail.last_move?.timestamp > lastSavedTimestamp) {
        // a move was made when the current player disconnected

        gameDispatch({
          type: 'change',
          lastMove: body.detail.last_move,
          isMyTurn: true
        });

      }

        // reconnect websocket
        const ws = new WebSocket(SOCKET_URL + `?playerId=${gameState.playerId}`);
        registerWebsocket(ws, gameDispatch, navigate, setOppStatus);

        gameState.websocket = ws;

        setIsPrevGame(false);
        navigate('/board');
        return;
    }
    navigate('/pairing');
    try {
        // Perform fetch request
        const response = await fetch(
            API_URL + '/joinLobby',
            {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    username: user.name
                }),
                headers: {
                    "Content-type": "application/json",
                }
            }
        );

        const data = await response.json();
  
        if(response.status >= 400 && response.status < 500) {
            gameDispatch({
                type: 'set_status',
                status: 'anonymous',
                playerId: null,
            });
            return;
        }

        if(response.status >= 500) {
            gameDispatch({
                type: 'set_status',
                status: 'error',
                playerId: null,
            });

            return;
        }

        const playerId = data.playerId? data.playerId: data.playerId1;
        const ws = new WebSocket(SOCKET_URL + `?playerId=${playerId}`);

        if(data.status === "waiting") {
            gameDispatch({
                type: 'set_status',
                status: 'waiting',
                playerId: data.playerId,
            });
        } 
        else 
        {
            
            gameDispatch({
                type: 'set_matchid',
                status: 'paired',
                matchId: data.matchId,
                playerId: data.playerId1,
                isMyTurn: data.isYourTurn,
                opponentName: data.opponentName,
                side: data.side,
            });
        }
  
        
        registerWebsocket(ws, gameDispatch, navigate, setOppStatus);

        gameDispatch({
            type: 'set_ws',
            websocket: ws,
        });

        if(data.status === "paired") navigate("/board");

  
      } catch (error) {
        gameDispatch({
            type: 'set_status',
            status: 'error',
            playerId: null,
        });
      }
  };

  const handlePassAndPlay = () => {
    navigate('/pass-and-play');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  const handleLogin = () => {
    navigate('/login');
  }

  const handleClose = () => {
    setShowAlert(false);
    setAlertText('');
  }

  const handleStatusClose = () => {
    setOppStatus(null);
  }

  return (

<Box minHeight="100vh" minWidth="100vw" sx={{ display: 'flex' }}>
{/* Sidebar */}
{
    playEnable && 
<Drawer
  variant="permanent"
  sx={{
    width: isCollapsed ? '70px' : '20%',
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: isCollapsed ? '70px' : '20%',
      boxSizing: 'border-box',
      backgroundColor: 'background.default',
      overflowX:'hidden',
    },
  }}
>
<Box display="flex" flexDirection="column" height="100%" alignItems="center" p={2}>
      {/* Sidebar Header */}
      <IconButton onClick={toggleSidebar} sx={{ alignSelf: 'flex-end' }}>
        <Menu />
      </IconButton>
      {!isCollapsed && (
        <Avatar src="/images/chess_logo.svg" alt="Logo" sx={{ width: 50, height: 50, background: 'rgba(255, 255, 255, 0.5)'}} />
      )}

      {/* Sidebar Buttons */}
      <List>
        <ListItem button>
          <ListItemIcon>
            <PlayCircleOutline />
          </ListItemIcon>
          {!isCollapsed ? (
            <Button variant="text" onClick={handlePlayOnline} disabled={!playEnable}><ListItemText primary={isPrevGame?"Continue Playing":"Play Online"}/></Button>
          ) : ''}
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <Computer />
          </ListItemIcon>
          {!isCollapsed ? (
            <Button variant="text" onClick={handlePassAndPlay} disabled={!playEnable}><ListItemText primary="Pass and Play" /></Button>
          ) : ''}
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <History />
          </ListItemIcon>
          {!isCollapsed ? (
            <Button variant="text" onClick={handleViewHistory} disabled={!playEnable}><ListItemText primary="View History" /></Button>
          ) : ''}
        </ListItem>
      </List>

      {/* Login/Logout Button */}
      <Box flexGrow={1} />
      {isLoggedIn ? (
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar alt={user.name} sx = {{ bgcolor: stringToColor(user.name) }}>{user.name[0].toUpperCase()}</Avatar>
          {!isCollapsed && <Typography>{user.username}</Typography>}
          <Button startIcon={<Logout />} onClick={handleLogout}>
            {!isCollapsed ? 'Logout' : ''}
          </Button>
        </Box>
      ) : (
        <Button startIcon={<AccountCircle />} variant="contained" onClick={handleLogin}>
          {!isCollapsed ? 'Login / Signup' : ''}
        </Button>
      )}

      {/* Alert */}
      <Snackbar open={showAlert} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={isLoggedIn ? 'error' : 'success'} sx={{ width: '100%' }}>
          {alertText}
        </Alert>
      </Snackbar>
    </Box>
</Drawer>
}
{/* Main Content Area */}
<Box component="main" flexGrow={1} height="100vh" position="relative" overflow="auto">
  <Box display="flex" flexDirection="column" height="100%" sx = {{
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Outlet/>
  </Box>
</Box>
<Snackbar open={oppStatus != null} autoHideDuration={6000} onClose={handleStatusClose}>
  <Alert onClose={handleStatusClose} severity={oppStatus == "Disconnected" ? 'error' : 'success'} sx={{ width: '100%' }}>
    {oppStatus === "Disconnected"? "Opponent is disconnected and will auto-resign in 1 min...": "Opponent connected!"}
  </Alert>
</Snackbar>
</Box>
  );
};

const clearCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

function stringToColor(input) {
  const hash = Array.from(input).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomSeed = hash % 360; // Generate a hue value (0-360)
  
  // Convert hue to an HSL color
  const color = `hsl(${randomSeed}, 70%, 50%)`; // 70% saturation, 50% lightness
  return color;
}


function registerWebsocket(ws, gameDispatch, navigate, setOppStatus) {
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'heartbeat_ack' }));  // Send acknowledgment for initial heartbeat
  };


  ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if(data.type === 'heartbeat') {
        ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
        return;
      }

      if(data.type === "draw_offer_ack") {
        gameDispatch({
          type: 'change',
          drawOffer: 'acknowledged'
        });
        return;
      }

      if(data.type === "draw_offered") {
        gameDispatch({
          type: 'change',
          drawOffer: 'received'
        });
        return;
      }

      if(data.type === "draw_reply") {
        if(data.accept) {
          // draw offer accepted
          gameDispatch({
            type: 'change',
            drawOffer: 'accepted'
          });

          gameDispatch({
            type: 'completed',
            result: 'draw',
            reason: 'agreement'
          });
        } else {
          gameDispatch({
            type: 'change',
            drawOffer: 'rejected'
          });
        }
        return;
      }

      if(data.type === "match_complete") {
        gameDispatch({
          type: 'completed',
          result: data.result,
          reason: data.reason
        });
        return;
      }

      if(data.type === "opponent_disconnected") {
        console.log('set status: disconnected');
        setOppStatus('Disconnected');
        return;
      }

      if(data.type === "opponent_reconnected") {
        console.log('set status: reconnected');
        setOppStatus('Reconnected');
        return;
      }

      if(data.status === "paired") {
          gameDispatch({
              type: 'set_matchid',
              status: 'paired',
              matchId: data.matchId,
              playerId: data.playerId,
              isMyTurn: data.isYourTurn,
              opponentName: data.opponentName,
              side: data.side,
          });
          navigate("/board");
          return;
      }

      if(data.isYourTurn) {
          gameDispatch({
              type: 'change',
              lastMove: data.lastMove,
              isMyTurn: true,
              isPromotion: data.isPromotion,
          });
      } else {
          gameDispatch({
              type: 'change',
              lastMove: data.lastMove,
              isMyTurn: false
          });
        
      }


  }
  ws.onerror = () => console.log("WebSocket error occurred");
  ws.onclose = () => console.log("Connection closed"); 
}