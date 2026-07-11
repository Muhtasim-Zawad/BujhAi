import { useState } from "react";
import {
	ChevronLeft,
	Settings,
	BookOpen,
	GraduationCap,
	BarChart3,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChatLeftSidebar() {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeSection, setActiveSection] = useState("materials");

	return (
		<div
			className={cn(
				"relative flex flex-col bg-card border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 overflow-hidden h-full",
				isCollapsed ? "w-16" : "w-64"
			)}
		>
			{/* Section 1: Logo + collapse toggle */}
			<div className="flex items-center px-4 py-4">
				<div
					className={cn(
						"flex items-center gap-2 transition-all duration-300 overflow-hidden",
						isCollapsed
							? "opacity-0 scale-95 max-w-0"
							: "opacity-100 scale-100 max-w-full"
					)}
				>
					<div className="shrink-0 size-8 rounded-full bg-black flex items-center justify-center">
						<div className="size-3.5 rounded-full bg-yellow-400" />
					</div>
					<span className="font-extrabold text-xl tracking-tight whitespace-nowrap">
						BujhAI
					</span>
				</div>
				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className={cn(
						"flex items-center justify-center size-6 rounded-full bg-primary border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-300 cursor-pointer shrink-0",
						isCollapsed ? "mx-auto" : "ml-auto"
					)}
				>
					<ChevronLeft
						className={cn(
							"size-4 transition-transform duration-300",
							isCollapsed && "rotate-180"
						)}
					/>
				</button>
			</div>

			<Separator className="mx-3 w-[calc(100%-24px)]" />

			{/* Section 2: Toggle Groups */}
			<div className="flex flex-col gap-1 p-3">
				{isCollapsed ? (
					<div className="flex flex-col items-center gap-2">
						{[
							{ value: "materials", icon: BookOpen },
							{ value: "study", icon: GraduationCap },
							{ value: "stats", icon: BarChart3 },
						].map(({ value, icon: Icon }) => (
							<button
								key={value}
								onClick={() => setActiveSection(value)}
								className={cn(
									"flex items-center justify-center size-9 rounded border-2 border-black transition-all cursor-pointer shrink-0",
									activeSection === value
										? "bg-primary text-primary-foreground shadow-sm"
										: "bg-background hover:bg-accent hover:translate-y-0.5 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								)}
							>
								<Icon className="size-4" />
							</button>
						))}
					</div>
				) : (
					<ToggleGroup
						value={activeSection}
						onValueChange={setActiveSection}
						orientation="vertical"
						data-vertical=""
						className="w-full"
					>
						<ToggleGroupItem
							value="materials"
							className="w-full justify-start gap-2 px-3"
						>
							<BookOpen className="size-4" />
							Materials
						</ToggleGroupItem>
						<ToggleGroupItem
							value="study"
							className="w-full justify-start gap-2 px-3"
						>
							<GraduationCap className="size-4" />
							Study
						</ToggleGroupItem>
						<ToggleGroupItem
							value="stats"
							className="w-full justify-start gap-2 px-3"
						>
							<BarChart3 className="size-4" />
							Stats
						</ToggleGroupItem>
					</ToggleGroup>
				)}
			</div>

			{/* Section 3: Empty spacer */}
			<div className="flex-1" />

			{/* Section 4: User profile + settings */}
			<div className="border-t-2 border-black p-3">
				{isCollapsed ? (
					<div className="flex flex-col items-center gap-2">
						<Avatar
							size="sm"
							className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						>
							<AvatarImage src="" alt="User" />
							<AvatarFallback>U</AvatarFallback>
						</Avatar>
						<Button variant="ghost" size="icon-xs">
							<Settings className="size-4" />
						</Button>
					</div>
				) : (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Avatar
								size="sm"
								className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							>
								<AvatarImage src="" alt="User" />
								<AvatarFallback>U</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium">Guest</span>
						</div>
						<Button variant="ghost" size="icon-sm">
							<Settings className="size-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
