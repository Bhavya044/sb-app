"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data.session);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      if (isMounted) {
        setSession(updatedSession);
      }
    });

    init();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return session;
}
