import { Navigate } from "react-router-dom";
import { useGameState } from "../Board/GameProvider";

const RouteGuard = ({redirectTo, children, isGameGuard, isPlayerGuard }) => {
    const gameState = useGameState();
  
    if(isGameGuard && !gameState.matchId) {
        return <Navigate to={redirectTo} replace />;
    }
    
    if(isPlayerGuard) {
        if(!gameState.playerId) {
            setTimeout(() => {
                if(!gameState.playerId) return <Navigate to={redirectTo} replace />;
                else return children;

            }, 5 * 1000);
        } 
    }

    return children;
};

export default RouteGuard;