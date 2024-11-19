import { cloneDeep } from "lodash";
import { createContext, useContext, useReducer } from "react";

const initialUser = {
    auth: false,
    name: null,
    email: null,
}

const UserContext = createContext(null);
const DispatchUserContext = createContext(null);

export function useUser() {
    return useContext(UserContext);
}

export function useUserDispatch() {
    return useContext(DispatchUserContext);
}

export function AuthProvider({children}) {
    const [user, dispatch] = useReducer(userReducer, initialUser);

    return (
        <UserContext.Provider value={user}>
            <DispatchUserContext.Provider value={dispatch}>
                {children}
            </DispatchUserContext.Provider>
        </UserContext.Provider>
    );
}


function userReducer(user, action) {
    switch(action.type) {
        case 'login': {
            if(!user.auth) {
                return {
                    auth: true,
                    name: action.username,
                    email: action.email,
                };
            }

            return user;
        }
        case 'logout': {
            return cloneDeep(initialUser);
        }

        case 'join_lobby': {
            return {
                ...user,
                playerId: action.playerId
            };
        }

        case 'leave_lobby': {
            return {
                ...user,
                playerId: undefined,
            }
        }

        case 'paired': {
            return {
                ...user,
                playerId: action.playerId,
                opponent: action.opponent,
                matchId: action.matchId,
            }
        }

        default:
            console.log("[ERROR]: No such action on user");
            return user;
    }
}