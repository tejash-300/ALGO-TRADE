"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return user ? (
    <div className="p-4 border rounded-lg">
      <p>Welcome, {user.email}</p>
      <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded">
        Logout
      </button>
    </div>
  ) : (
    <p>Not logged in</p>
  );
}