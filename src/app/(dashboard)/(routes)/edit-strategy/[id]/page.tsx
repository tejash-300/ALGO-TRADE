"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditStrategy() {
  const router = useRouter();
  const { id } = useParams(); // Get strategy ID from URL
  const [strategy, setStrategy] = useState({
    name: "",
    param_1: "",
    param_2: "",
    param_3: "",
    param_4: "",
    param_5: "",
  });

  useEffect(() => {
    async function fetchStrategy() {
      if (!id) return;
      const { data, error } = await supabase
        .from("py_strategies")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching strategy:", error);
        return;
      }
      setStrategy(data);
    }
    fetchStrategy();
  }, [id, supabase]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await supabase
      .from("py_strategies")
      .update(strategy)
      .eq("id", id);

    if (error) {
      console.error("Error updating strategy:", error);
      return;
    }
    router.push("/strategies");
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setStrategy({ ...strategy, [event.target.name]: event.target.value });
  }

  return (
    <div className="min-h-screen mt-[-35px] bg-gray-100 dark:bg-gray-900 p-6 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Edit Strategy</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 dark:text-gray-300 mb-1">Name:</label>
            <input
              type="text"
              name="name"
              value={strategy.name}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {["param_1", "param_2", "param_3", "param_4", "param_5"].map((param) => (
            <div key={param}>
              <label className="block text-gray-600 dark:text-gray-300 mb-1">
                {param.replace("_", " ").toUpperCase()}:
              </label>
              <input
                type="text"
                name={param}
                value={strategy[param as keyof typeof strategy]}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full cursor-pointer bg-green-600 dark:bg-green-500 text-white p-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition duration-300"
          >
            Update Strategy
          </button>
        </form>
      </div>
    </div>
  );
}
