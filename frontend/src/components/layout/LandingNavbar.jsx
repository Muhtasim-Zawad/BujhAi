import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LandingNavbar() {
	return (
		<header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				<Link to="/" className="flex items-center gap-2">
					<div className="relative flex size-8 items-center justify-center rounded-full bg-black">
						<div className="size-2 rounded-full bg-yellow-400" />
					</div>
					<span className="text-xl font-extrabold tracking-tight">BujhAI</span>
				</Link>
				<div className="flex items-center gap-3">
					<Link to="/auth">
						<Button
							variant="outline"
							size="sm"
							className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
						>
							Sign In
						</Button>
					</Link>
					<Link to="/auth">
						<Button
							size="sm"
							className="border-2 border-black bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
						>
							Sign Up
						</Button>
					</Link>
				</div>
			</div>
		</header>
	);
}
