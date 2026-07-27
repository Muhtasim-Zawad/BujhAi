import { useState } from "react";
import { BookOpen, Video, Globe, Map, ExternalLink } from "lucide-react";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchResources } from "@/utils/api";

export default function DashboardResources({ projects }) {
	const [resourcesMap, setResourcesMap] = useState({});
	const [loadingResources, setLoadingResources] = useState({});

	async function loadResources(projectId) {
		if (resourcesMap[projectId] || loadingResources[projectId]) return;
		setLoadingResources((p) => ({ ...p, [projectId]: true }));
		try {
			const data = await fetchResources(projectId);
			setResourcesMap((p) => ({ ...p, [projectId]: data }));
		} catch {
			setResourcesMap((p) => ({ ...p, [projectId]: [] }));
		}
		setLoadingResources((p) => ({ ...p, [projectId]: false }));
	}

	if (projects.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
				<BookOpen className="size-12 text-muted-foreground" />
				<p className="text-lg font-medium text-muted-foreground">No resources available</p>
				<p className="text-sm text-muted-foreground">
					Create a project and add resources to see them here.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{projects.map((project) => (
				<Accordion
					key={project.id}
					onValueChange={(val) => {
						if (val) loadResources(project.id);
					}}
				>
					<AccordionItem>
						<AccordionTrigger>{project.title}</AccordionTrigger>
						<AccordionContent>
							{loadingResources[project.id] ? (
								<div className="flex items-center justify-center py-4">
									<Skeleton className="h-4 w-32 rounded bg-muted" />
								</div>
							) : resourcesMap[project.id]?.length > 0 ? (
								(() => {
									const grouped = resourcesMap[project.id].reduce((acc, r) => {
										if (!acc[r.resource_type]) acc[r.resource_type] = [];
										acc[r.resource_type].push(r);
										return acc;
									}, {});
									const typeOrder = ["youtube_video", "online_tutorial", "roadmap"];
									const typeLabels = { youtube_video: "Video Resources", online_tutorial: "Tutorial Resources", roadmap: "Learning Roadmap" };
									const typeIcons = { youtube_video: Video, online_tutorial: Globe, roadmap: Map };
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
							) : (
								<p className="py-2 text-center text-sm text-muted-foreground">
									No resources yet. Upload materials first.
								</p>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			))}
		</div>
	);
}
