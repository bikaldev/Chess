import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";

import { theme } from "./Theme";
import App from "./App";

import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider } from "./Auth/AuthProvider";
import { GameProvider } from "./Board/GameProvider";
import { BoardProvider } from "./Board/BoardProvider";

import HomePage from "./Pages/HomePage";
import DefaultPage from "./Pages/DefaultPage";
import PassAndPlayPage from "./Pages/PassAndPlay";
import PairingScreen from "./Display/PairingScreen";
import { HistoryPage, fetchGameHistory} from "./Pages/HistoryPage";
import LoginPage  from './Pages/Login/LoginPage';
import SignupPage  from './Pages/Login/SignupPage';
import RouteGuard from "./Navigation/RouteGuard";
import AuthGuard from "./Auth/AuthGuard";


const router = createBrowserRouter([
  {
      path: '/',
      element: <HomePage/>,
      
      children: [
        {
          path: '/', element: <Navigate to='/home' replace />
        },
        {
          path: '/home',
          element: <DefaultPage/>
        },
        {
          path: '/board',
          element: <RouteGuard redirectTo="/" isGameGuard={true}>
            <App />
          </RouteGuard> 
        },
        
        {
            path: '/pairing',
            element: <RouteGuard redirectTo="/" isPlayerGuard={true}>
            <PairingScreen/>
          </RouteGuard> ,
        },
        {
          path: '/history',
          element: <AuthGuard redirectTo="/">
          <HistoryPage/>
        </AuthGuard> ,
          loader: fetchGameHistory
        }
      ]
  },

  {
    path: '/pass-and-play',
    element: <PassAndPlayPage />
  },

  {
    path: '/login',
    element: <LoginPage />,
  },
  {
      path: '/signup',
      element: <SignupPage />
  }, 

]);


const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <ThemeProvider theme = {theme}>
      <CssBaseline />
      <AuthProvider>
          <GameProvider>
            <BoardProvider>
              <RouterProvider router = {router} />
            </BoardProvider>
          </GameProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);