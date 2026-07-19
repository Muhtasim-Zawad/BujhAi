import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { fetchStats, fetchResources, fetchModules } from "@/utils/api";
import { Video, Globe, Map, ExternalLink } from "lucide-react";

export default function Stats({ projectId }) {
	const [section, setSection] = useState("results");
	const [stats, setStats] = useState(null);
	const [resources, setResources] = useState([]);
	const [modules, setModules] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!projectId) return;
		setLoading(true);
		Promise.all([
			fetchStats(projectId).catch(() => null),
			fetchResources(projectId).catch(() => []),
			fetchModules(projectId).catch(() => []),
		]).then(([s, r, m]) => {
			setStats(s);
			setResources(r);
			setModules(m);
			setLoading(false);
		});
	}, [projectId]);

	useEffect(() => {
		const handler = () => {
			if (!projectId) return;
			fetchStats(projectId).then(setStats).catch(() => {});
			fetchResources(projectId).then(setResources).catch(() => {});
			fetchModules(projectId).then(setModules).catch(() => {});
		};
		window.addEventListener("materials-changed", handler);
		return () => window.removeEventListener("materials-changed", handler);
	}, [projectId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
			<div className="flex flex-col gap-1">
				<h1 className="font-head text-2xl tracking-tight">Your Stats Overview</h1>
				<p className="text-sm text-muted-foreground">
					Track your progress, compare results, and access learning resources.
				</p>
			</div>

			<div className="flex gap-2">
				{["results", "modules", "resources"].map((tab) => (
					<button
						key={tab}
						onClick={() => setSection(tab)}
						className={cn(
							"inline-flex items-center justify-center gap-1 rounded border-2 text-sm font-head font-medium whitespace-nowrap shadow-sm transition-all duration-200 px-3 py-1 h-8 cursor-pointer",
							section === tab
								? "bg-primary text-primary-foreground border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								: "bg-background border-black hover:bg-accent hover:translate-y-0.5 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
						)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
				))}
			</div>

			{section === "results" && stats && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>Materials</CardTitle>
							<CardDescription>{stats.total_materials} uploaded</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{stats.total_chunks} chunks indexed from all materials.
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Chat Messages</CardTitle>
							<CardDescription>{stats.total_messages} total</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Messages exchanged with the AI tutor across all sessions.
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Modules</CardTitle>
							<CardDescription>{stats.total_modules} created</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{stats.module_points_completed} / {stats.module_points_total} points completed.
							</p>
						</CardContent>
					</Card>
					</div>
			)}

			{section === "modules" && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{modules.length === 0 && (
						<p className="text-sm text-muted-foreground col-span-full text-center py-8">
							No modules yet.
						</p>
					)}
					{modules.map((mod) => {
						const pts = mod.points || [];
						const done = pts.filter((p) => p.checked).length;
						const pct = pts.length > 0 ? Math.round((done / pts.length) * 100) : 0;
						return (
							<Card key={mod.id}>
								<CardHeader>
									<CardTitle className="truncate">{mod.title}</CardTitle>
									<CardDescription>
										{done}/{pts.length} points
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="relative h-2 w-full overflow-hidden rounded border border-black bg-background">
										<div
											className="h-full bg-primary transition-all duration-300"
											style={{ width: `${pct}%` }}
										/>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{section === "resources" && (
				<Accordion>
					{resources.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-8">
							No resources generated yet. Upload materials first.
						</p>
					)}
					{resources.map((res) => {
						const iconMap = {
							youtube_video: Video,
							online_tutorial: Globe,
							roadmap: Map,
						};
						const Icon = iconMap[res.resource_type] || ExternalLink;
						const hasUrl = res.url && res.url.startsWith("http");

						return (
							<AccordionItem key={res.id}>
								<AccordionTrigger className="group">
									<div className="flex items-center gap-2">
										<Icon className="size-4 shrink-0 text-muted-foreground" />
										<span>{res.title}</span>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									{hasUrl ? (
										<a
											href={res.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
										>
											<ExternalLink className="size-4" />
											Open {res.resource_type === "youtube_video" ? "Video" : "Resource"}
										</a>
									) : (
										<p className="text-sm text-muted-foreground">{res.content}</p>
									)}
									{res.resource_type && (
										<span className="mt-2 inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
											<Icon className="size-3" />
											{res.resource_type.replace(/_/g, " ")}
										</span>
									)}
								</AccordionContent>
							</AccordionItem>
						);
					})}
				</Accordion>
			)}
		</div>
	);
}