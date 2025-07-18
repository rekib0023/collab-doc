import { RootState } from "@/store";
import { useSelector } from "react-redux";

export const useAuth = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  return {
    isAuthenticated,
    user,
    // Safely check for admin role if it exists on the user object
    isAdmin: user ? (user as any).role === "admin" : false,
  };
};

export default useAuth;
