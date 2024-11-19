import React, { useState } from 'react';
import { Button, Popover, Typography, Box } from '@mui/material';
import { FlagCircleOutlined } from '@mui/icons-material';

export default function ResignButton({onClick}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleConfirmClick = () => {
    setAnchorEl(null);
    onClick();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button variant="text" startIcon={<FlagCircleOutlined/>} onClick={handleButtonClick} >
        RESIGN
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box p={2}>
          <Typography>Are you sure?</Typography>
          <Button color="primary" onClick={handleConfirmClick}>
            Confirm
          </Button>
        </Box>
      </Popover>
    </>
  );
}
