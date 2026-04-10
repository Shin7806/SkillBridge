import React, { useEffect } from "react";
import { supabase } from "./lib/supabase";
import AppRoot from "./app/App";

export default function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("Supabase connected:", { data, error });
      if (data.session) {
        console.log("User logged in:", data.session.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth changed:", session?.user);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <AppRoot />;
}
