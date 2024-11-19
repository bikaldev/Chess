import { Navigate } from "react-router-dom";
import { useUser } from "./AuthProvider";

const AuthGuard = ({redirectTo, children }) => {

  const user = useUser();

  if (!user.auth) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default AuthGuard;