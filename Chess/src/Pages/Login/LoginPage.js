import React from 'react';

import { Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Box, 
  FormControl, 
  FormLabel, 
  Alert, 
  CircularProgress 
} from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { useUserDispatch } from '../../Auth/AuthProvider';

const API_URL = process.env.REACT_APP_API_URL || "http://api";

export default function LoginPage() {

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [errorText, setErrorText] = React.useState('');
  const navigate = useNavigate();
  const userDispatch = useUserDispatch();

  async function handleLogin(event){
  
    if(usernameError || passwordError) {
      event.preventDefault();
      return;
    }
    // Handle login
    try {
      event.preventDefault();
      setIsSubmitting(true);
      const data = new FormData(event.currentTarget);

      const response = await fetch(API_URL + '/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify({
          username: data.get('username'),
          password: data.get('password'),
        })
      });

      const body = await response.json();
      if(response.status >= 400) {
        setErrorText(body.message);
        return;
      }

      const username = body.user.username;
      const email = body.user.email;

      userDispatch({
        type: 'login',
        username: username,
        email: email,
      });

      navigate('/');      
      
    } catch(err) {
      console.log(err);
      setErrorText('Network Error!');
    } finally {
        setIsSubmitting(false);
    }
  };

  const validateInputs = () => {
    const username = document.getElementById('username') ;
    const password = document.getElementById('password');

    let isValid = true;

    if(!username.value) {
      setUsernameError(true);
      setUsernameErrorMessage("username is required!");
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <Card sx={{ width: 400, padding: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Login
          </Typography>
          <Box component="form" noValidate autoComplete="off" onSubmit={handleLogin}>
            <FormControl>
              <FormLabel htmlFor='username'>Username</FormLabel>
              <TextField
              id = "username"
              name = "username"
              error = {usernameError}
              helperText = {usernameErrorMessage}
              variant="outlined"
              fullWidth
              autoFocus
              margin="normal"
              color={usernameError? 'error': 'primary'}
              required
            />
            </FormControl>
            
            <FormControl>
              <FormLabel htmlFor='password'> Password </FormLabel>
              <TextField
              id = "password"
              name = "password"
              error = {passwordError}
              helperText = {passwordErrorMessage}
              type="password"
              variant="outlined"
              fullWidth
              placeholder='*****'
              margin="normal"
              color={passwordError? 'error': 'primary'}
              required
            />
            </FormControl>
            
            <Button
              type = "submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
              onClick={validateInputs}
            >
              { isSubmitting? <CircularProgress sx={{
                height: '90%',
              }} />: 'Login'}
            </Button>
            {
              errorText && <Alert severity='error'>
                {errorText}
              </Alert>
            }
          </Box>
          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/signup" underline="hover">
                Sign up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
