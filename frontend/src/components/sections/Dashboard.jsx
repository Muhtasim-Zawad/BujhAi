import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/Navbar";
import { ProjectCard } from "../layout/ProjectCard";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Trash2, FolderOpen, BookOpen, BarChart3 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchProjects, createProject, deleteProject, fetchResources, fetchStats } from "@/utils/api";

function normalizeProject(p) {
	return {
		...p,
		image: p.image_url || `https://avatar.vercel.sh/${p.id}`,
		buttonText: p.button_text || "Open Project",
	};
}

const sections = [
	{ value: "projects", label: "Projects" },
	{ value: "resources", label: "Resources" },
	{ value: "stats", label: "Stats" },
];

export default function Dashboard() {
	const navigate = useNavigate();
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [section, setSection] = useState("projects");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newProject, setNewProject] = useState({ title: "", description: "" });
	const [deletingProject, setDeletingProject] = useState(null);
	const [resourcesMap, setResourcesMap] = useState({});
	const [statsMap, setStatsMap] = useState({});
	const [loadingResources, setLoadingResources] = useState({});
	const [loadingStats, setLoadingStats] = useState({});

	useEffect(() => {
		fetchProjects()
			.then((list) => setProjects(list.map(normalizeProject)))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

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

	async function loadStats(projectId) {
		if (statsMap[projectId] || loadingStats[projectId]) return;
		setLoadingStats((p) => ({ ...p, [projectId]: true }));
		try {
			const data = await fetchStats(projectId);
			setStatsMap((p) => ({ ...p, [projectId]: data }));
		} catch {
			setStatsMap((p) => ({ ...p, [projectId]: null }));
		}
		setLoadingStats((p) => ({ ...p, [projectId]: false }));
	}

	async function handleCreate() {
		if (!newProject.title.trim()) return;
		try {
			const created = await createProject({
				title: newProject.title,
				description: newProject.description,
			});
			setProjects((prev) => [...prev, normalizeProject(created)]);
		} catch (err) {
			console.error("Create failed:", err);
		}
		setNewProject({ title: "", description: "" });
		setIsCreateOpen(false);
	}

	async function handleDelete(project) {
		try {
			await deleteProject(project.id);
			setProjects((prev) => prev.filter((p) => p.id !== project.id));
		} catch (err) {
			console.error("Delete failed:", err);
		}
		setDeletingProject(null);
	}

	return (
		<div>
			<Navbar
				projects={projects}
				onCreateProject={() => setIsCreateOpen(true)}
				onOpenProject={(project) => navigate(`/project/${project.id}`)}
			/>
			<div className="mx-auto max-w-6xl px-6 py-12">
				<div className="mb-10">
					<h1 className="font-head text-4xl tracking-tight sm:text-5xl">
						Welcome back, friend
					</h1>
					<p className="mt-2 text-lg text-muted-foreground">
						Pick up where you left off or start something new.
					</p>
				</div>

				{/* Toggle buttons */}
				<div className="flex gap-2 mb-10">
					{sections.map((tab) => (
						<button
							key={tab.value}
							onClick={() => setSection(tab.value)}
							className={cn(
								"inline-flex items-center justify-center gap-1 rounded border-2 text-sm font-head font-medium whitespace-nowrap shadow-sm transition-all duration-200 px-5 py-1.5 cursor-pointer",
								section === tab.value
									? "bg-primary text-primary-foreground border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
									: "bg-background border-black hover:bg-accent hover:translate-y-0.5 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
							)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Projects */}
				{section === "projects" && (
					<div>
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-head text-2xl">Projects</h2>
							<Button onClick={() => setIsCreateOpen(true)}>
								<Plus className="size-4" />
								Create Project
							</Button>
						</div>
						{loading ? (
							<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{[1, 2, 3].map((i) => (
									<div key={i} className="flex flex-col gap-3 rounded-xl border-2 border-black bg-card p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
										<Skeleton className="aspect-video w-full rounded-lg bg-muted" />
										<Skeleton className="h-5 w-2/3 rounded bg-muted" />
										<Skeleton className="h-4 w-full rounded bg-muted" />
									</div>
								))}
							</div>
						) : projects.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
								<FolderOpen className="size-12 text-muted-foreground" />
								<p className="text-lg font-medium text-muted-foreground">
									No projects yet
								</p>
								<p className="text-sm text-muted-foreground">
									Create your first project to get started.
								</p>
								<Button onClick={() => setIsCreateOpen(true)}>
									<Plus className="size-4" />
									Create Project
								</Button>
							</div>
						) : (
							<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{projects.map((project) => (
									<div key={project.id} className="group relative">
										<ProjectCard {...project} onAction={() => navigate(`/project/${project.id}`)} />
										<button
											onClick={() => setDeletingProject(project)}
											className="absolute top-2 right-2 z-40 cursor-pointer rounded-sm bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
											title="Delete project"
										>
											<Trash2 className="size-4" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Resources */}
				{section === "resources" && (
					<div className="flex flex-col gap-4">
						{projects.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
								<BookOpen className="size-12 text-muted-foreground" />
								<p className="text-lg font-medium text-muted-foreground">
									No resources available
								</p>
								<p className="text-sm text-muted-foreground">
									Create a project and add resources to see them here.
								</p>
							</div>
						) : (
							projects.map((project) => (
								<Accordion
									key={project.id}
									onValueChange={(val) => {
										if (val) loadResources(project.id);
									}}
								>
									<AccordionItem>
										<AccordionTrigger>
											{project.title}
										</AccordionTrigger>
										<AccordionContent>
											{loadingResources[project.id] ? (
												<div className="flex items-center justify-center py-4">
													<Skeleton className="h-4 w-32 rounded bg-muted" />
												</div>
											) : resourcesMap[project.id]?.length > 0 ? (
												<div className="flex flex-col gap-3">
													{resourcesMap[project.id].map((res) => (
														<div key={res.id} className="rounded-lg border border-black/20 bg-muted/30 p-3">
															<p className="text-sm font-medium">{res.title}</p>
															<p className="mt-1 text-xs text-muted-foreground">{res.content}</p>
															{res.resource_type && (
																<span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
																	{res.resource_type.replace(/_/g, " ")}
																</span>
															)}
														</div>
													))}
												</div>
											) : (
												<p className="py-2 text-center text-sm text-muted-foreground">
													No resources yet. Upload materials first.
												</p>
											)}
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							))
						)}
					</div>
				)}

				{/* Stats */}
				{section === "stats" && (
					<div className="flex flex-col gap-4">
						{projects.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
								<BarChart3 className="size-12 text-muted-foreground" />
								<p className="text-lg font-medium text-muted-foreground">
									No stats available
								</p>
								<p className="text-sm text-muted-foreground">
									Start working on a project to track your progress.
								</p>
							</div>
						) : (
							projects.map((project) => (
								<Accordion
									key={project.id}
									onValueChange={(val) => {
										if (val) loadStats(project.id);
									}}
								>
									<AccordionItem>
										<AccordionTrigger>
											{project.title}
										</AccordionTrigger>
										<AccordionContent>
											{loadingStats[project.id] ? (
												<div className="flex items-center justify-center py-4">
													<Skeleton className="h-4 w-32 rounded bg-muted" />
												</div>
											) : statsMap[project.id] ? (
												<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
													<Card>
														<CardHeader>
															<CardTitle>Materials</CardTitle>
															<CardContent className="pt-0 px-0">
																<p className="text-2xl font-bold">{statsMap[project.id].total_materials}</p>
																<p className="text-xs text-muted-foreground">{statsMap[project.id].total_chunks} chunks indexed</p>
															</CardContent>
														</CardHeader>
													</Card>
													<Card>
														<CardHeader>
															<CardTitle>Messages</CardTitle>
															<CardContent className="pt-0 px-0">
																<p className="text-2xl font-bold">{statsMap[project.id].total_messages}</p>
															</CardContent>
														</CardHeader>
													</Card>
													<Card>
														<CardHeader>
															<CardTitle>Modules</CardTitle>
															<CardContent className="pt-0 px-0">
																<p className="text-2xl font-bold">{statsMap[project.id].total_modules}</p>
																<p className="text-xs text-muted-foreground">
																	{statsMap[project.id].module_points_completed}/{statsMap[project.id].module_points_total} points
																</p>
															</CardContent>
														</CardHeader>
													</Card>
													</div>
											) : (
												<p className="py-2 text-center text-sm text-muted-foreground">
													No stats yet.
												</p>
											)}
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							))
						)}
					</div>
				)}

				{/* Create project dialog */}
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogContent className="bg-card">
						<DialogHeader>
							<DialogTitle>Create New Project</DialogTitle>
							<DialogDescription>
								Fill in the details below to create a new project.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-3">
							<Input
								placeholder="Project title"
								value={newProject.title}
								onChange={(e) =>
									setNewProject((p) => ({
										...p,
										title: e.target.value,
									}))
								}
							/>
							<Input
								placeholder="Project description"
								value={newProject.description}
								onChange={(e) =>
									setNewProject((p) => ({
										...p,
										description: e.target.value,
									}))
								}
							/>
						</div>
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
							<DialogClose render={<Button onClick={handleCreate} />}>Create</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Delete project confirmation dialog */}
				<Dialog
					open={!!deletingProject}
					onOpenChange={(open) => !open && setDeletingProject(null)}
				>
					{deletingProject && (
						<DialogContent className="bg-card">
							<DialogHeader>
								<DialogTitle>Delete Project</DialogTitle>
								<DialogDescription>
									Are you sure you want to delete{" "}
									<span className="font-medium text-foreground">
										{deletingProject.title}
									</span>
									? This action cannot be undone.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
								<DialogClose render={<Button variant="destructive" onClick={() => handleDelete(deletingProject)} />}>Delete</DialogClose>
							</DialogFooter>
						</DialogContent>
					)}
				</Dialog>
			</div>
		</div>
	);
}
