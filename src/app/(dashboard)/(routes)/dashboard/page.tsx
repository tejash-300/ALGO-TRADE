"use client";

import {
	ArrowRight,
	Code,
	ImageIcon,
	MessageSquare,
	Music,
	VideoIcon,
} from "lucide-react";
import { GoGraph } from "react-icons/go";
import { CiBoxList } from "react-icons/ci";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TfiControlBackward } from "react-icons/tfi";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { FaRobot } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import { TbClockCog } from "react-icons/tb";
import { SiMinds } from "react-icons/si";

const tools = [
	{
		label: "Trading Viewer",
		icon: GoGraph,
		color: "text-violet-500",
		bgColor: "bg-violet-500/10",
		href: "/trading-viewer",
	},
	{
		label: "Watchlist",
		icon: CiBoxList,
		color: "text-amber-500",
		bgColor: "bg-amber-500/10",
		href: "/watchlist",
	},
	{
		label: "Bot Management",
		icon: FaRobot,
		color: "text-green-500",
		bgColor: "bg-green-500/10",
		href: "/bots",
	},
	{
		label: "Strategies",
		icon: SiMinds,
		color: "text-red-500",
		bgColor: "bg-red-500/10",
		href: "/strategies",
	},
	{
		label: "Execute Bot",
		icon: TbClockCog,
		color: "text-yellow-500",
		bgColor: "bg-yellow-500/10",
		href: "/bot-execution",
	},
	{
		label: "Upload Strategy",
		icon: MdOutlineFileUpload,
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
		href: "/upload-strategy",
	},
	{
		label: "Backtesting",
		icon: TfiControlBackward,
		color: "text-purple-500",
		bgColor: "bg-purple-500/10",
		href: "/backtesting",
	}
];

const DashboardPage = () => {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        router.push("/sign-in"); // Redirect to login if not authenticated
      } else {
        setUser(session.session.user);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) return <p className="text-center text-white">Loading...</p>;
	return (
		<div className="bg-gray-900 min-h-screen mt-[-35px] p-8">
			<div className="mb-8 space-y-4 ">
				<h2 className="text-2xl md:text-4xl font-bold text-center">
					Explore the power of AI
				</h2>
				<p className="text-muted-foreground font-light text-sm md:text-lg text-center">
					Discover tools to help you make better trading decisions
				</p>
			</div>
			<div className="px-4 md:px-20 lg:px-32 space-y-4">
				{tools.map((tool) => (
					<Card
						onClick={() => router.push(tool.href)}
						key={tool.href}
						className={
							"p-4 border-black/5 bg-gray-800 hover:bg-gray-700 flex items-center justify-between hover:shadow-md transition cursor-pointer"
						}
					>
						<div className="flex items-center gap-x-4">
							<div className={cn("p-2 w-fit rounded-md", tool.bgColor)}>
								<tool.icon className={cn("w-8 h-8", tool.color)} />
							</div>
							<div className="font-semibold">{tool.label}</div>
						</div>
						<ArrowRight className="w-5 h-5" />
					</Card>
				))}
			</div>
		</div>
	);
};

export default DashboardPage;
