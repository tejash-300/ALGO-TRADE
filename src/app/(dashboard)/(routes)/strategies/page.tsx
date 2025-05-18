"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Strategy {
  id: number;
  user_id: number | null;
  name: string;
  param_1: number;
  param_2: number;
  param_3: number;
  param_4: string;
  param_5: string;
}


export default function StrategiesPage() {
    const [predefinedStrategies, setPredefinedStrategies] = useState<Strategy[]>([]);
    const [userStrategies, setUserStrategies] = useState<Strategy[]>([]);
  
    useEffect(() => {
      async function fetchData() {
        const { data: session, error: sessionError } =
          await supabase.auth.getSession();
        console.log(`Id:: ${session?.session?.user?.id}`);
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log(session?.session?.user.user_metadata.is_subscribed);
        console.log(`User:: ${user}`);
        const { data: strategyData, error: strategyError } = await supabase
          .from("py_strategies")
          .select("*")
          .or(`user_id.eq.${session?.session?.user?.id},user_id.is.null`);

        if (strategyData) {
          // Separate strategies into predefined and user-defined
          const predefined = strategyData.filter(strategy => strategy.user_id === null);
          const userDefined = strategyData.filter(strategy => strategy.user_id !== null);
          
          setPredefinedStrategies(predefined);
          setUserStrategies(userDefined);
        }
        
        if (strategyError) console.error("Error fetching strategies:", strategyError.message);
      }
  
      fetchData();
    }, []);

    const renderStrategyTable = (strategies: Strategy[]) => {
      return (
        <div>
          <table className="w-full border-collapse mt-5 bg-[#222] rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-[#2196f3] text-white">
                  <th className="p-3 text-left border-b border-[#444]">Name</th>
                  <th className="p-3 text-left border-b border-[#444]">Par 1</th>
                  <th className="p-3 text-left border-b border-[#444]">Par 2</th>
                  <th className="p-3 text-left border-b border-[#444]">Par 3</th>
                  <th className="p-3 text-left border-b border-[#444]">Par 4</th>
                  <th className="p-3 text-left border-b border-[#444]">Par 5</th>
                  <th className="p-3 text-left border-b border-[#444]">Action</th>
                </tr>
              </thead>
              <tbody>
                {strategies.length > 0 ? (
                  strategies.map((strategy) => (
                    <tr key={strategy.id} className="hover:bg-[rgba(33,150,243,0.2)]">
                      <td className="p-3 border-b border-[#444]">{strategy.name}</td>
                      <td className="p-3 border-b border-[#444]">{strategy.param_1}</td>
                      <td className="p-3 border-b border-[#444]">{strategy.param_2}</td>
                      <td className="p-3 border-b border-[#444]">{strategy.param_3}</td>
                      <td className="p-3 border-b border-[#444]">{strategy.param_4}</td>
                      <td className="p-3 border-b border-[#444]">{strategy.param_5}</td>
                      <td>
                        <Link href={`/edit-strategy/${strategy.id}`} className="bg-[#2196f3] text-white px-3 py-2 rounded transition duration-300 hover:bg-[#64b5f6] hover:shadow-[0_0_10px_#64b5f6]">
                          Edit
                        </Link>
                      </td>
                    </tr>))
                ) : (
                  <tr>
                    <td colSpan={8}>No strategies found.</td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      );
    }
  
    return (
      <div className="p-8 bg-gray-900 min-h-screen mt-[-35px]">
  
        <main className="container">
          <h2>📊 Strategies Control Panel</h2>
          <h3 className="text-2xl text-blue-300">Predefined Strategies</h3>
            {renderStrategyTable(predefinedStrategies)}
          <h3 className="text-2xl text-blue-300 my-8">Your Strategies</h3>
            {renderStrategyTable(userStrategies)}
          <div className="mt-8">
          <Link href="/upload-strategy" className="bg-[#2196f3] text-white px-3 py-2 rounded transition duration-300 hover:bg-[#64b5f6] hover:shadow-[0_0_10px_#64b5f6]">
            Create Strategy
          </Link>
          </div>
        </main>
  
        <style jsx>{`
          body {
            background: #121212;
            color: #e0e0e0;
            font-family: 'Inter', sans-serif;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #1c1c1c;
            color: #2196f3;
            padding: 16px 24px;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            border-bottom: 2px solid #2196f3;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .profile-icon-container {
            display: flex;
            align-items: center;
          }
          .profile-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #2196f3;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          .profile-icon img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          }
          .logout-button {
            margin-left: 16px;
            background: #ff3d00;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            transition: 0.3s;
          }
          .logout-button:hover {
            background: #d32f2f;
          }
          .sidebar {
            width: 250px;
            background: #1c1c1c;
            padding: 20px;
            color: white;
            position: fixed;
            height: 100vh;
            top: 60px;
            left: 0;
            border-right: 2px solid #2196f3;
          }
          .sidebar ul {
            list-style: none;
            padding: 0;
          }
          .sidebar li {
            margin: 20px 0;
          }
          .sidebar a {
            color: #64b5f6;
            text-decoration: none;
            font-size: 18px;
            transition: 0.3s;
          }
          .sidebar a:hover {
            color: #2196f3;
          }
          .container {
            padding: 24px;
            background: #1c1c1c;
            box-shadow: 0 0 12px rgba(33, 150, 243, 0.3);
            border-radius: 10px;
          }
          h2 {
            color: #64b5f6;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: #222;
            border-radius: 8px;
            overflow: hidden;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #444;
          }
          th {
            background: #2196f3;
            color: white;
          }
          tr:hover {
            background: rgba(33, 150, 243, 0.2);
          }
          .edit-button {
            background: #2196f3;
            color: white;
            padding: 8px 12px;
            text-decoration: none;
            border-radius: 4px;
            transition: 0.3s;
          }
          .edit-button:hover {
            background: #64b5f6;
            box-shadow: 0 0 10px #64b5f6;
          }
          @media (max-width: 768px) {
            .sidebar {
              width: 200px;
            }
            .container {
              margin-left: 220px;
            }
          }
        `}</style>
      </div>
    );
  }