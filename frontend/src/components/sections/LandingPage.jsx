import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Upload, MessageSquare, BarChart3 } from "lucide-react";
import LandingNavbar from "@/components/layout/LandingNavbar";

const features = [
	{
		icon: Upload,
		title: "Upload Materials",
		description: "Drop in PDFs, DOCX, or text files. AI indexes them automatically.",
	},
	{
		icon: Brain,
		title: "AI-Generated Modules",
		description: "Get structured modules, checklist points, and resources from your materials.",
	},
	{
		icon: MessageSquare,
		title: "Dual-Persona Tutor",
		description: "Chat with an evaluator and student AI that tests your understanding.",
	},
	{
		icon: BarChart3,
		title: "Track Progress",
		description: "Monitor your module completion and see your learning stats.",
	},
];

export default function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<LandingNavbar />

			<section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl">
					<div className="mb-6 inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-card px-4 py-1.5 text-xs font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<span className="relative flex size-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
							<span className="relative inline-flex size-2 rounded-full bg-green-500" />
						</span>
						AI-Powered Learning
					</div>

					<h1 className="font-head text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
						Learn Smarter with{" "}
						<span className="text-primary">BujhAI</span>
					</h1>

					<p className="mt-6 text-lg text-muted-foreground sm:text-xl">
						Upload your study materials and get an AI tutor that creates modules, asks
						questions, tracks your progress, and helps you master any subject.
					</p>

					<div className="mt-10 flex items-center justify-center gap-4">
						<Link to="/auth">
							<Button
								size="lg"
								className="border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none text-base"
							>
								Get Started Free
							</Button>
						</Link>
						<Link to="/auth">
							<Button
								variant="outline"
								size="lg"
								className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none text-base"
							>
								Sign In
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.title}
								className="rounded-xl border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5"
							>
								<div className="mb-4 flex size-10 items-center justify-center rounded-lg border-2 border-black bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
									<Icon className="size-5 text-primary-foreground" />
								</div>
								<h3 className="font-head text-base font-semibold">{feature.title}</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									{feature.description}
								</p>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}
