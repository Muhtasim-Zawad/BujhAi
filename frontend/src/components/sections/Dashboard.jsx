import React, { useState } from "react";
import Navbar from "../layout/Navbar";
import { ProjectCard } from "../layout/ProjectCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const projects = [
	{
		title: "Protege AI",
		description: "AI-powered learning assistant that adapts to your pace.",
		image: "https://avatar.vercel.sh/protege",
		badge: "Active",
		buttonText: "Open Project",
	},
	{
		title: "Design Canvas",
		description: "Visual brainstorming tool for creative ideation.",
		image: "https://avatar.vercel.sh/canvas",
		badge: "Draft",
		buttonText: "Open Project",
	},
	{
		title: "Data Explorer",
		description: "Interactive data insights and visualization dashboard.",
		image: "https://avatar.vercel.sh/data",
		badge: "Archived",
		buttonText: "Open Project",
	},
];

export default function Dashboard() {
	const [section, setSection] = useState("projects");

	return (
		<div>
			<Navbar />
			<div className="mx-auto max-w-6xl px-6 py-12">
				<div className="mb-10">
					<h1 className="font-head text-4xl tracking-tight sm:text-5xl">
						Welcome back, friend
					</h1>
					<p className="mt-2 text-lg text-muted-foreground">
						Pick up where you left off or start something new.
					</p>
				</div>

				<ToggleGroup
					value={section}
					onValueChange={setSection}
					className="mb-10"
				>
					<ToggleGroupItem value="projects" className="px-5 py-1.5">
						Projects
					</ToggleGroupItem>
					<ToggleGroupItem value="resources" className="px-5 py-1.5">
						Resources
					</ToggleGroupItem>
					<ToggleGroupItem value="stats" className="px-5 py-1.5">
						Stats
					</ToggleGroupItem>
				</ToggleGroup>

				{section === "projects" && (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (
							<ProjectCard key={project.title} {...project} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
