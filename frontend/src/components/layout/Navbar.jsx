import { useNavigate } from "react-router-dom";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { User, Settings, LogOut, BookOpen, Palette } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export default function Navbar({ projects = [], onCreateProject, onOpenProject }) {
	const navigate = useNavigate();
	const { user, signOut } = useSession();

	const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest User";
	const userEmail = user?.email || "guest@bujhai.app";
	const initials = userName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	async function handleSignOut() {
		await signOut();
		navigate("/");
	}
	return (
		<div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
			<div className="mx-auto max-w-6xl p-6">
			<nav className="flex items-center justify-between bg-white border-2 border-black rounded-xl px-6 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
				{/* Logo */}
				<div className="flex items-center gap-2">
					<a href="/" className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
							<div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
						</div>
						<span className="font-extrabold text-xl tracking-tight">
							BujhAI
						</span>
					</a>
				</div>

				{/* Nav links */}
				<div className="hidden md:flex items-center gap-8">
					<NavigationMenu>
						<NavigationMenuList className="gap-8">
							<NavigationMenuItem>
								<NavigationMenuTrigger className="flex items-center gap-1.5 font-semibold text-sm transition-colors hover:bg-primary-hover hover:text-primary-foreground data-open:bg-primary-hover data-open:text-primary-foreground data-popup-open:bg-primary-hover data-popup-open:text-primary-foreground">
									Projects
								</NavigationMenuTrigger>
								<NavigationMenuContent className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] data-open:fade-in-100 data-open:zoom-in-100 data-closed:fade-out-100 data-closed:zoom-out-100">
									<ul className="grid w-72 gap-1 p-2">
										{projects.length === 0 ? (
											<li className="px-2 py-4 text-center text-sm text-muted-foreground">
												No projects yet
											</li>
										) : projects.map((project) => (
											<li key={project.id}>
												<button
													onClick={() => onOpenProject?.(project)}
													className="flex w-full flex-col items-start gap-0.5 rounded-sm p-2 text-left transition-colors hover:bg-primary-hover focus:bg-primary-hover data-active:bg-primary-hover cursor-pointer"
												>
													<span className="text-sm font-medium">
														{project.title}
													</span>
													<span className="text-xs text-muted-foreground">
														{project.description}
													</span>
												</button>
											</li>
										))}
									</ul>
								</NavigationMenuContent>
							</NavigationMenuItem>
							<NavigationMenuItem>
								<span className="flex items-center gap-1.5 font-semibold text-sm text-muted-foreground cursor-default">
									<BookOpen size={18} strokeWidth={2.5} />
									Learn
								</span>
							</NavigationMenuItem>
							<NavigationMenuItem>
								<span className="flex items-center gap-1.5 font-semibold text-sm text-muted-foreground cursor-default">
									<Palette size={18} strokeWidth={2.5} />
									Canvas
								</span>
							</NavigationMenuItem>
						</NavigationMenuList>
					</NavigationMenu>
				</div>

				{/* Right actions */}
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="sm"
						className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						onClick={onCreateProject}
					>
						New Project
					</Button>
					<HoverCard openDelay={200} closeDelay={100}>
						<HoverCardTrigger render={<button className="cursor-pointer rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />}>
							<Avatar
								size="sm"
								className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							>
								<AvatarImage src="" alt="User" />
									<AvatarFallback>{initials || "U"}</AvatarFallback>
							</Avatar>
						</HoverCardTrigger>
						<HoverCardContent
							className="w-56 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] data-open:fade-in-100 data-open:zoom-in-100 data-closed:fade-out-100 data-closed:zoom-out-100"
							align="end"
						>
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-3 px-1 pt-1">
									<Avatar size="sm">
								<AvatarFallback>{initials || "U"}</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="text-sm font-medium">{userName}</span>
										<span className="text-xs text-muted-foreground">
											{userEmail}
										</span>
									</div>
								</div>
								<Separator />
								<button className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-sm transition-colors hover:bg-primary-hover hover:text-primary-foreground">
									<User className="size-4" />
									Profile
								</button>
								<button className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-sm transition-colors hover:bg-primary-hover hover:text-primary-foreground">
									<Settings className="size-4" />
									Settings
								</button>
								<Separator />
								<button
									onClick={handleSignOut}
									className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-sm text-destructive transition-colors hover:bg-primary-hover hover:text-primary-foreground cursor-pointer"
								>
									<LogOut className="size-4" />
									Sign Out
								</button>
							</div>
						</HoverCardContent>
					</HoverCard>
				</div>
			</nav>
			</div>
		</div>
	);
}
