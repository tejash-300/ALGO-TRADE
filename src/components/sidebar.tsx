"use client";

import { Code, ImageIcon, LayoutDashboard, MessageSquare, Music, Settings, VideoIcon } from "lucide-react";
import { FaRobot } from "react-icons/fa";
import { GoGraph } from "react-icons/go";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";

import { cn } from "@/lib/utils";
import FreeCounter from "./free-counter";
import { CiBoxList } from "react-icons/ci";
import { TfiControlBackward } from "react-icons/tfi";
import { TbClockCog } from "react-icons/tb";
import { MdOutlineFileUpload } from "react-icons/md";
import { SiMinds } from "react-icons/si";
import { supabase } from "@/lib/supabaseClient";

const montserrat = Montserrat({ weight: "600", subsets: ["latin"] });

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Trading Viewer",
    icon: GoGraph,
    href: "/trading-viewer",
    color: "text-violet-500",
  },
  {
    label: "Watchlist",
    icon: CiBoxList,
    href: "/watchlist",
    color: "text-amber-500",
  },
  {
    label: "Bot Management",
    icon: FaRobot,
    href: "/bots",
    color: "text-green-500",
  },
  {
    label: "Strategies",
    icon: SiMinds,
    href: "/strategies",
    color: "text-red-500",
  },
  {
    label: "Execute Bot",
    icon: TbClockCog,
    href: "/bot-execution",
    color: "text-yellow-500",
  },
  {
    label: "Upload Strategy",
    icon: MdOutlineFileUpload,
    href: "/upload-strategy",
    color: "text-blue-500",
  },
  {
    label: "Backtesting",
    icon: TfiControlBackward,
    href: "/backtesting",
    color: "text-purple-500",
  }
];

interface SidebarProps {
  apiLimitCount: number;
  isPro: boolean;
}

const Sidebar: FC<SidebarProps> = ({ apiLimitCount = 0, isPro = false }) => {
  const pathname = usePathname();
    const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
    };
  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4">
            <Image fill alt="Logo" src="/logo.png" />
          </div>
          <h1 className={cn("text-2xl font-bold", montserrat.className)}>Algo Trading Walah</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "bg-white/10 text-white" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("w-5 h-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <button
          onClick={handleLogout}
          className="w-full cursor-pointer mt-4 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
    </div>
  </div>

  );
};

export default Sidebar;
