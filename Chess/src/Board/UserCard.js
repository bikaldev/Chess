import React from 'react';
import { Box, Typography, Avatar, useTheme, ButtonGroup, Button } from '@mui/material';
import ResignButton from './ResignButton';
import DrawOfferButton from './DrawOfferButton';

export default function UserCard({ username, isUserTurn, isCurrentPlayer,onResign, onDrawOffer, enableButtons }) {
  const theme = useTheme(); // Access the app-wide themes

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '77vh',
        height: '5vh', // Fixed height
        padding: theme.spacing(2),
        bgcolor: theme.palette.primary,
        color: theme.palette.primary.contrastText,
        borderRadius: 2,
      }}
    >
      {/* User Avatar and Username */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={username} sx={{ width: 36, height: 36 }}>{username[0].toUpperCase()}</Avatar>
        <Box sx={{ marginLeft: theme.spacing(2) }}>
          <Typography variant="h6" color="text.primary">
            {username}
          </Typography>
          {isUserTurn && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              (turn)
            </Typography>
          )}
        </Box>
      </Box>
      {/* Game Buttons */}
      {
        isCurrentPlayer &&  enableButtons &&<ButtonGroup variant="text" aria-label='basic button group'>
        {/* <Button startIcon={<FlagCircleOutlined/>} onClick={onResign}>RESIGN</Button> */}
        <ResignButton onClick={onResign}/>
        <DrawOfferButton onClick = {onDrawOffer}/>
        </ButtonGroup>
      }
     
      {/* 
      Timer
      <Typography variant="h6" color="secondary.main">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds} {/* Format as mm:ss */}
      {/* </Typography> */}
    </Box>
  );
};
