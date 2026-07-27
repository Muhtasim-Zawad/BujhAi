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
import { fetchStats, fetchResources, fetchModules, getEnrolledStats } from "@/utils/api";
import { Video, Globe, Map, ExternalLink, Users, Copy, Check } from "lucide-react";

export default function Stats({ projectId, role }) {
	const [section, setSection] = useState("results");
	const [stats, setStats] = useState(null);
	const [resources, setResources] = useState([]);
	const [modules, setModules] = useState([]);
	const [loading, setLoading] = useState(true);
	const [enrolledStats, setEnrolledStats] = useState(null);

	useEffect(() => {
		if (!projectId) return;
		setLoading(true);
		Promise.all([
			fetchStats(projectId).catch(() => null),
			fetchResources(projectId).catch(() => []),
			fetchModules(projectId).catch(() => []),
			role === "owner" ? getEnrolledStats(projectId).catch(() => null) : Promise.resolve(null),
		]).then(([s, r, m, e]) => {
			setStats(s);
			setResources(r);
			setModules(m);
			setEnrolledStats(e);
			setLoading(false);
		});
	}, [projectId, role]);

	useEffect(() => {
		const handler = () => {
			if (!projectId) return;
			fetchStats(projectId).then(setStats).catch(() => {});
			fetchResources(projectId).then(setResources).catch(() => {});
			fetchModules(projectId).then(setModules).catch(() => {});
			if (role === "owner") {
				getEnrolledStats(projectId).then(setEnrolledStats).catch(() => {});
			}
		};
		window.addEventListener("materials-changed", handler);
		return () => window.removeEventListener("materials-changed", handler);
	}, [projectId, role]);

	const [copied, setCopied] = useState(false);

	const handleCopyCode = async (code) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	const tabs = role === "owner"
		? ["results", "modules", "resources", "enrolled"]
		: ["results", "modules", "resources"];

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

			<div className="flex gap-2 flex-wrap">
				{tabs.map((tab) => (
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
						{tab === "enrolled" ? (
							<><Users className="size-3.5" /> Enrolled</>
						) : (
							tab.charAt(0).toUpperCase() + tab.slice(1)
						)}
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
							<CardTitle>Enrolled Students</CardTitle>
							<CardDescription>{stats.total_enrolled} total</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{stats.enrolled_completed} completed.
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

			{section === "results" && role === "owner" && stats.join_code && (
				<div className="flex items-center justify-between rounded-xl border-2 border-black bg-muted/30 px-5 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium">Invite Code:</span>
						<code className="rounded-md border-2 border-black bg-background px-3 py-1 text-sm font-mono font-bold tracking-wider">
							{stats.join_code}
						</code>
					</div>
					<button
						onClick={() => handleCopyCode(stats.join_code)}
						className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-2 border-black bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
					>
						{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
						{copied ? "Copied" : "Copy"}
					</button>
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
										{done}/{pts.length} points completed
									</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-3">
									<div className="relative h-2 w-full overflow-hidden rounded border border-black bg-background">
										<div
											className="h-full bg-primary transition-all duration-300"
											style={{ width: `${pct}%` }}
										/>
									</div>
									{pts.length > 0 && (
										<ul className="flex flex-col gap-1.5">
											{pts.map((pt) => (
												<li key={pt.id} className="flex items-start gap-2 text-sm">
													{pt.checked ? (
														<Check className="size-4 shrink-0 mt-0.5 text-primary" />
													) : (
														<span className="size-4 shrink-0 mt-0.5 rounded-full border-2 border-muted-foreground/40" />
													)}
													<span className={pt.checked ? "text-foreground" : "text-muted-foreground"}>
														{pt.text}
													</span>
												</li>
											))}
										</ul>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{section === "resources" && (
				(() => {
					const grouped = resources.reduce((acc, r) => {
						if (!acc[r.resource_type]) acc[r.resource_type] = [];
						acc[r.resource_type].push(r);
						return acc;
					}, {});

					const typeOrder = ["youtube_video", "online_tutorial", "roadmap"];
					const typeLabels = { youtube_video: "Video Resources", online_tutorial: "Tutorial Resources", roadmap: "Learning Roadmap" };
					const typeIcons = { youtube_video: Video, online_tutorial: Globe, roadmap: Map };

					if (resources.length === 0) {
						return <p className="text-sm text-muted-foreground text-center py-8">No resources generated yet. Upload materials first.</p>;
					}

					return (
						<Accordion>
							{typeOrder.map((type) => {
								const items = grouped[type];
								if (!items || items.length === 0) return null;
								const Icon = typeIcons[type] || ExternalLink;

								return (
									<AccordionItem key={type} value={type}>
										<AccordionTrigger className="group">
											<div className="flex items-center gap-2">
												<Icon className="size-4 shrink-0 text-muted-foreground" />
												<span>{typeLabels[type] || type}</span>
												<span className="text-xs text-muted-foreground">({items.length})</span>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											{type === "roadmap" ? (
												(() => {
													const roadmap = items[0];
													let steps = null;
													try { steps = JSON.parse(roadmap.content); } catch {}
													if (steps && Array.isArray(steps) && steps.length > 0) {
														return (
															<div className="flex flex-col py-2">
																{steps.map((step, i) => (
																	<div key={i} className="flex gap-4">
																		<div className="flex flex-col items-center">
																			<div className="size-3 rounded-full border-2 border-black bg-primary shrink-0 mt-2.5" />
																			{i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border min-h-6" />}
																		</div>
																		<div className="pb-4 flex-1">
																			<div className="rounded-md border-2 border-black bg-card px-4 py-2.5 text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
																				{step}
																			</div>
																		</div>
																	</div>
																))}
															</div>
														);
													}
													return <p className="text-sm text-muted-foreground">{roadmap.content}</p>;
												})()
											) : (
												<div className="flex flex-col gap-3">
													{items.map((res) => {
														const hasUrl = res.url && res.url.startsWith("http");
														return (
															<div key={res.id} className="flex items-center justify-between rounded-lg border-2 border-black bg-card p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
																<div className="flex flex-col gap-0.5">
																	<span className="text-sm font-medium">{res.title}</span>
																	<span className="text-xs text-muted-foreground">{res.content}</span>
																</div>
																{hasUrl ? (
																	<a
																		href={res.url}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="inline-flex items-center gap-1.5 rounded-md border-2 border-black bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
																	>
																		<ExternalLink className="size-3.5" />
																		Open
																	</a>
																) : (
																	<span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
																		<Icon className="size-3" />
																		{res.resource_type.replace(/_/g, " ")}
																	</span>
																)}
															</div>
														);
													})}
												</div>
											)}
										</AccordionContent>
									</AccordionItem>
								);
							})}
						</Accordion>
					);
				})()
			)}

			{section === "enrolled" && role === "owner" && enrolledStats && (
				<div className="flex flex-col gap-4">
					{enrolledStats.enrolled.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							No enrolled users yet. Share your project join code to invite students.
						</p>
					) : (
						enrolledStats.enrolled.map((user) => {
							const pct = user.total_points > 0
								? Math.round((user.points_completed / user.total_points) * 100)
								: 0;
							return (
								<Card key={user.user_id}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle>{user.user_name}</CardTitle>
												<CardDescription>{user.email}</CardDescription>
											</div>
											<div className="text-right">
												<p className="text-2xl font-bold">{user.points_completed}/{user.total_points}</p>
												<p className="text-xs text-muted-foreground">points</p>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="relative h-2 w-full overflow-hidden rounded border border-black bg-background mb-4">
											<div
												className="h-full bg-primary transition-all duration-300"
												style={{ width: `${pct}%` }}
											/>
										</div>
										<Accordion>
											<AccordionItem>
												<AccordionTrigger className="text-sm font-medium">
													Per-Module Breakdown
												</AccordionTrigger>
												<AccordionContent>
													<div className="flex flex-col gap-2">
														{user.modules.map((mod) => {
															const modPct = mod.total_points > 0
																? Math.round((mod.completed_points / mod.total_points) * 100)
																: 0;
															return (
																<div key={mod.module_id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2">
																	<span className="text-sm font-medium truncate flex-1">{mod.module_title}</span>
																	<div className="flex items-center gap-3 ml-4">
																		<span className="text-xs text-muted-foreground whitespace-nowrap">
																			{mod.completed_points}/{mod.total_points}
																		</span>
																		<div className="w-20 h-1.5 rounded-full bg-background border border-black">
																			<div
																				className="h-full bg-primary rounded-full transition-all"
																				style={{ width: `${modPct}%` }}
																			/>
																		</div>
																	</div>
																</div>
															);
														})}
													</div>
												</AccordionContent>
											</AccordionItem>
										</Accordion>
									</CardContent>
								</Card>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
