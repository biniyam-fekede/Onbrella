/**
 * useAuth — centralized logout. Signs out from Supabase, clears UserContext and RentalContext state, then navigates to /login.
 */
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "../context/UserContext";
import { useRental } from "../context/RentalContext";

/**
 * Returns { logout, isLoggingOut }. logout() clears auth + rental state and redirects to login.
 */
export function useAuth() {
  const navigate = useNavigate();
  const { resetUser } = useUser();
  const { clearRentalState } = useRental();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      resetUser();
      clearRentalState();
      navigate("/login", { replace: true });
    } catch (err) {
      // Still leave protected screens and clear local state
      resetUser();
      clearRentalState();
      navigate("/login", { replace: true });
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  }, [navigate, resetUser, clearRentalState]);

  return { logout, isLoggingOut };
}
