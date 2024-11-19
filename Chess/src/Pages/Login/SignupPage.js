import React from 'react';
import { Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Box, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || "http://api";

export default function SignupPage() {

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');

  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');

  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formMessage, setFormMessage] = React.useState('');
  const [error, setError] = React.useState(false);

  const navigate = useNavigate();

  const handleSignup = async (event) => {
    // Handle signup logic here

    if(usernameError || passwordError || emailError) {
      event.preventDefault();
      return;
    }
    // Handle login
    try {
      event.preventDefault();
      setIsSubmitting(true);
      const data = new FormData(event.currentTarget);
      const response = await fetch(API_URL + '/createUser', {
        method: 'POST',
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify({
          username: data.get('username'),
          password: data.get('password'),
          email: data.get('email'),
        })
      });

      const body = await response.json();
      if(response.status >= 400) {
        setFormMessage(body.message);
        setError(true);
        return;
      }

      setError(false);
      setFormMessage("Created Account Successfully! Redirecting...");
      setTimeout(() => navigate('/login'), 1000);

    } catch(err) {
      console.log(err);
      setFormMessage('Network Error!');
      setError(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  const validateInputs = (event) => {
    const username = document.getElementById('username') ;
    const password = document.getElementById('password');
    const email = document.getElementById('email');

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

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

    if(!isValid) event.stopPropagation();

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
            Sign Up
          </Typography>
          <Box component="form" noValidate autoComplete="off" onSubmit={handleSignup}>
            <TextField
              label="Username"
              id = "username"
              name = "username"
              error = {usernameError}
              helperText = {usernameErrorMessage}
              color = {usernameError? 'error': 'primary'}
              variant="outlined"
              fullWidth
              autoFocus
              margin="normal"
              required
            />
            <TextField
              label="Email"
              type="email"
              id = "email"
              name = "email"
              error = {emailError}
              helperText = {emailErrorMessage}
              color = {emailError? 'error': 'primary'}
              variant="outlined"
              fullWidth
              margin="normal"
              placeholder = "your@email.com"
              required
            />
            <TextField
              label="Password"
              type="password"
              id = "password"
              name = "password"
              error = {passwordError}
              helperText = {passwordErrorMessage}
              color = {passwordError? 'error': 'primary'}
              placeholder='*****'
              variant="outlined"
              fullWidth
              margin="normal"
              required
            />
            <Button
              variant="contained"
              color="primary"
              type = "submit"
              fullWidth
              sx={{ marginTop: 2 }}
              onClick={validateInputs}
            >
              {isSubmitting? <CircularProgress sx = {{height: '100%'}}/>: 'Sign up'}
            </Button>
            {
              formMessage && <Alert severity={error? 'error': 'success'}>
                {formMessage}
              </Alert>
            }
          </Box>
          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/login" underline="hover">
                Login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
