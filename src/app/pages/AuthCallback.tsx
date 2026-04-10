import { useEffect } from "react";
import { redirectUser } from "../../utils/redirectUser";
import { supabase } from "../../services/supabase";

export default function AuthCallback() {
  useEffect(() => {
    const handleAuth = async () => {
      // 🔥 IMPORTANT: let Supabase read token from URL
      await supabase.auth.getSession();

      // then run your existing logic
      await redirectUser();
    };

    handleAuth();
  }, []);

  return <div>Signing you in...</div>;
}