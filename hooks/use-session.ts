"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data.session);
        if (data.session?.access_token) {
          supabase.realtime.setAuth(data.session.access_token);
        }
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      if (isMounted) {
        setSession(updatedSession);
      }
      if (updatedSession?.access_token) {
        supabase.realtime.setAuth(updatedSession.access_token);
      } else {
        supabase.realtime.setAuth(undefined);
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
