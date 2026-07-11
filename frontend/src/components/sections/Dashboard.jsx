import { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";

let uidCounter = 0;
function uid() {
	return `project-${++uidCounter}`;
}

const initialProjects = [
	{
		title: "Protege AI",
		description: "AI-powered learning assistant that adapts to your pace.",
		image: "https://avatar.vercel.sh/protege",
		badge: "Active",
		buttonText: "Open Project",
		modules: [
			{
				title: "Machine Learning Basics",
				resources: [
					"Comprehensive guide covering supervised and unsupervised learning algorithms with practical examples.",
					"Video walkthrough of building your first ML model from scratch.",
				],
				stats: { score: 88, completion: 90, accuracy: 85 },
			},
			{
				title: "Neural Networks",
				resources: [
					"Detailed overview of neural network architectures including CNNs and RNNs.",
					"Interactive notebook for experimenting with network hyperparameters.",
				],
				stats: { score: 82, completion: 85, accuracy: 80 },
			},
		],
	},
	{
		title: "Design Canvas",
		description: "Visual brainstorming tool for creative ideation.",
		image: "https://avatar.vercel.sh/canvas",
		badge: "Draft",
		buttonText: "Open Project",
		modules: [
			{
				title: "UI/UX Principles",
				resources: [
					"Fundamentals of user interface design including layout, typography, and color theory.",
				],
				stats: { score: 75, completion: 70, accuracy: 78 },
			},
		],
	},
	{
		title: "Data Explorer",
		description: "Interactive data insights and visualization dashboard.",
		image: "https://avatar.vercel.sh/data",
		badge: "Archived",
		buttonText: "Open Project",
		modules: [
			{
				title: "Data Analysis",
				resources: [
					"Guide to exploratory data analysis using Python and popular libraries.",
					"Case study on real-world data cleaning and preprocessing techniques.",
				],
				stats: { score: 91, completion: 95, accuracy: 93 },
			},
			{
				title: "Visualization",
				resources: [
					"Overview of data visualization best practices and chart selection.",
				],
				stats: { score: 87, completion: 90, accuracy: 86 },
			},
		],
	},
];

const sections = [
	{ value: "projects", label: "Projects" },
	{ value: "resources", label: "Resources" },
	{ value: "stats", label: "Stats" },
];

export default function Dashboard() {
	const [section, setSection] = useState("projects");
	const [projects, setProjects] = useState(initialProjects);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newProject, setNewProject] = useState({ title: "", description: "" });
	const [deletingProject, setDeletingProject] = useState(null);

	function createProject() {
		if (!newProject.title.trim()) return;
		setProjects((prev) => [
			...prev,
			{
				title: newProject.title,
				description: newProject.description,
				image: `https://avatar.vercel.sh/${uid()}`,
				badge: "New",
				buttonText: "Open Project",
				modules: [],
			},
		]);
		setNewProject({ title: "", description: "" });
		setIsCreateOpen(false);
	}

	function deleteProject(title) {
		setProjects((prev) => prev.filter((p) => p.title !== title));
		setDeletingProject(null);
	}

	return (
		<div>
			<Navbar onCreateProject={() => setIsCreateOpen(true)} />
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
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{projects.map((project) => (
								<div key={project.title} className="group relative">
									<ProjectCard {...project} />
									<button
										onClick={() => setDeletingProject(project.title)}
										className="absolute top-2 right-2 z-40 cursor-pointer rounded-sm bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
										title="Delete project"
									>
										<Trash2 className="size-4" />
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Resources */}
				{section === "resources" && (
					<div className="flex flex-col gap-4">
						{projects.map((project) => (
							<Accordion key={project.title}>
								<AccordionItem>
									<AccordionTrigger>
										{project.title}
									</AccordionTrigger>
									<AccordionContent>
										<div className="flex flex-col gap-3">
											{project.modules.map((mod) => (
												<Accordion key={mod.title}>
													<AccordionItem>
														<AccordionTrigger className="text-sm">
															{mod.title}
														</AccordionTrigger>
														<AccordionContent>
															<div className="flex flex-col gap-2">
																{mod.resources.map(
																	(r, i) => (
																		<p
																			key={i}
																			className="text-sm text-muted-foreground"
																		>
																			{r}
																		</p>
																	)
																)}
															</div>
														</AccordionContent>
													</AccordionItem>
												</Accordion>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						))}
					</div>
				)}

				{/* Stats */}
				{section === "stats" && (
					<div className="flex flex-col gap-4">
						{projects.map((project) => (
							<Accordion key={project.title}>
								<AccordionItem>
									<AccordionTrigger>
										{project.title}
									</AccordionTrigger>
									<AccordionContent>
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{project.modules.map((mod) => (
												<Card key={mod.title}>
													<CardHeader>
														<CardTitle>
															{mod.title}
														</CardTitle>
													</CardHeader>
													<CardContent>
														<div className="flex flex-col gap-2">
															<div className="flex justify-between text-sm">
																<span className="text-muted-foreground">
																	Score
																</span>
																<span className="font-medium">
																	{mod.stats.score}
																</span>
															</div>
															<div className="flex justify-between text-sm">
																<span className="text-muted-foreground">
																	Completion
																</span>
																<span className="font-medium">
																	{mod.stats.completion}%
																</span>
															</div>
															<div className="flex justify-between text-sm">
																<span className="text-muted-foreground">
																	Accuracy
																</span>
																<span className="font-medium">
																	{mod.stats.accuracy}%
																</span>
															</div>
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						))}
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
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<DialogClose asChild>
								<Button onClick={createProject}>Create</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Delete project confirmation dialog */}
				<Dialog
					open={!!deletingProject}
					onOpenChange={(open) => !open && setDeletingProject(null)}
				>
					<DialogContent className="bg-card">
						<DialogHeader>
							<DialogTitle>Delete Project</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete{" "}
								<span className="font-medium text-foreground">
									{deletingProject}
								</span>
								? This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<DialogClose asChild>
								<Button
									variant="destructive"
									onClick={() => deleteProject(deletingProject)}
								>
									Delete
								</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
