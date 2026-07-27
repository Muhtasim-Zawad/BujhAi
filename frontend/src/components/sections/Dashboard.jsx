import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/Navbar";
import { ProjectCard } from "../layout/ProjectCard";
import DashboardResources from "../layout/DashboardResources";
import DashboardStats from "../layout/DashboardStats";
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
import { Plus, Trash2, FolderOpen, LogOut, Copy, Check } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
	fetchProjects,
	fetchCurrentUser,
	createProject,
	deleteProject,
	joinProjectByCode,
	leaveProject,
	regenerateJoinCode,
} from "@/utils/api";

function normalizeProject(p) {
	return {
		...p,
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
	const [userId, setUserId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [section, setSection] = useState("projects");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isJoinOpen, setIsJoinOpen] = useState(false);
	const [newProject, setNewProject] = useState({ title: "", description: "" });
	const [deletingProject, setDeletingProject] = useState(null);
	const [leavingProject, setLeavingProject] = useState(null);
	const [joinCode, setJoinCode] = useState("");
	const [joinError, setJoinError] = useState("");
	const [joining, setJoining] = useState(false);
	const [copiedCode, setCopiedCode] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				const user = await fetchCurrentUser();
				setUserId(user.id);
			} catch {}
			try {
				const list = await fetchProjects();
				setProjects(list.map(normalizeProject));
			} catch {}
			setLoading(false);
		})();
	}, []);

	const ownedProjects = projects.filter((p) => p.user_id === userId);
	const enrolledProjects = projects.filter((p) => p.user_id !== userId);

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

	async function handleJoin() {
		const code = joinCode.trim().toUpperCase();
		if (!code) return;
		setJoining(true);
		setJoinError("");
		try {
			const result = await joinProjectByCode(code);
			const res = await fetchProjects();
			setProjects(res.map(normalizeProject));
			setJoinCode("");
			setIsJoinOpen(false);
		} catch (err) {
			const msg = err.message || "Failed to join project";
			if (msg.includes("404")) setJoinError("Invalid join code");
			else if (msg.includes("409")) setJoinError("You are already enrolled");
			else setJoinError(msg);
		}
		setJoining(false);
	}

	async function handleLeave(project) {
		try {
			await leaveProject(project.id);
			setProjects((prev) => prev.filter((p) => p.id !== project.id));
		} catch (err) {
			console.error("Leave failed:", err);
		}
		setLeavingProject(null);
	}

	async function handleRegenerateCode(projectId) {
		try {
			const updated = await regenerateJoinCode(projectId);
			setProjects((prev) =>
				prev.map((p) => (p.id === projectId ? { ...p, join_code: updated.join_code } : p))
			);
		} catch (err) {
			console.error("Regenerate code failed:", err);
		}
	}

	function copyJoinCode(code) {
		navigator.clipboard.writeText(code);
		setCopiedCode(code);
		setTimeout(() => setCopiedCode(null), 2000);
	}

	return (
		<div>
			<Navbar
				projects={projects}
				onCreateProject={() => setIsCreateOpen(true)}
				onJoinProject={() => setIsJoinOpen(true)}
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
					<div className="flex flex-col gap-10">
						{/* My Projects */}
						<div>
							<div className="flex items-center justify-between mb-6">
								<h2 className="font-head text-2xl">My Projects</h2>
								<div className="flex gap-2">
									<Button variant="outline" onClick={() => setIsJoinOpen(true)}>
										<Plus className="size-4" />
										Join
									</Button>
									<Button onClick={() => setIsCreateOpen(true)}>
										<Plus className="size-4" />
										Create Project
									</Button>
								</div>
							</div>
							{loading ? (
								<div className="flex flex-col gap-4">
									<div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
										<div className="size-2 rounded-full bg-muted-foreground/40" />
										Loading projects...
									</div>
									<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
										{[1, 2, 3].map((i) => (
											<div key={i} className="flex flex-col gap-3 rounded-xl border-2 border-black/20 bg-muted/30 p-4">
												<Skeleton className="aspect-video w-full rounded-lg bg-muted-foreground/15" />
												<Skeleton className="h-5 w-2/3 rounded bg-muted-foreground/15" />
												<Skeleton className="h-4 w-full rounded bg-muted-foreground/15" />
											</div>
										))}
									</div>
								</div>
							) : ownedProjects.length === 0 ? (
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
									{ownedProjects.map((project) => (
										<div key={project.id} className="group relative">
											<ProjectCard {...project} onAction={() => navigate(`/project/${project.id}`)} />
											{project.join_code && (
												<div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-xs text-white">
													<span className="font-mono tracking-wider">{project.join_code}</span>
													<button
														onClick={() => copyJoinCode(project.join_code)}
														className="cursor-pointer hover:text-primary"
														title="Copy join code"
													>
														{copiedCode === project.join_code ? <Check className="size-3" /> : <Copy className="size-3" />}
													</button>
													<button
														onClick={() => handleRegenerateCode(project.id)}
														className="cursor-pointer hover:text-primary ml-1"
														title="Regenerate join code"
													>
														<svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
															<path d="M1 4v6h6M23 20v-6h-6" />
															<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
														</svg>
													</button>
												</div>
											)}
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

						{/* Enrolled Projects */}
						{enrolledProjects.length > 0 && (
							<div>
								<h2 className="font-head text-2xl mb-6">Enrolled Projects</h2>
								<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
									{enrolledProjects.map((project) => (
										<div key={project.id} className="group relative">
											<ProjectCard {...project} onAction={() => navigate(`/project/${project.id}`)} />
											<button
												onClick={() => setLeavingProject(project)}
												className="absolute top-2 right-2 z-40 flex cursor-pointer items-center gap-1 rounded-sm bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
												title="Leave project"
											>
												<LogOut className="size-4" />
											</button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{section === "resources" && <DashboardResources projects={projects} />}

				{section === "stats" && <DashboardStats projects={projects} />}

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

				{/* Join project dialog */}
				<Dialog open={isJoinOpen} onOpenChange={(open) => {
					setIsJoinOpen(open);
					if (!open) { setJoinCode(""); setJoinError(""); }
				}}>
					<DialogContent className="bg-card">
						<DialogHeader>
							<DialogTitle>Join a Project</DialogTitle>
							<DialogDescription>
								Enter the join code to enroll in a project.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-3">
							<Input
								placeholder="Enter join code (e.g. XK4M9P2)"
								value={joinCode}
								onChange={(e) => {
									setJoinCode(e.target.value.toUpperCase());
									setJoinError("");
								}}
								className="uppercase"
								maxLength={7}
							/>
							{joinError && (
								<p className="text-sm text-destructive">{joinError}</p>
							)}
						</div>
						<DialogFooter>
							<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
							<Button onClick={handleJoin} disabled={joining || !joinCode.trim()}>
								{joining ? "Joining..." : "Join"}
							</Button>
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

				{/* Leave project confirmation dialog */}
				<Dialog
					open={!!leavingProject}
					onOpenChange={(open) => !open && setLeavingProject(null)}
				>
					{leavingProject && (
						<DialogContent className="bg-card">
							<DialogHeader>
								<DialogTitle>Leave Project</DialogTitle>
								<DialogDescription>
									Are you sure you want to leave{" "}
									<span className="font-medium text-foreground">
										{leavingProject.title}
									</span>
									?
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
								<DialogClose render={<Button variant="destructive" onClick={() => handleLeave(leavingProject)} />}>Leave</DialogClose>
							</DialogFooter>
						</DialogContent>
					)}
				</Dialog>
			</div>
		</div>
	);
}
