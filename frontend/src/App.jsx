import { useState, useEffect } from "react";
import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import Dashboard from "./components/sections/Dashboard";
import StudySpace from "./components/sections/StudySpace";
import { fetchProjects, createProject, deleteProject } from "./utils/api";

function normalizeProject(p) {
	return {
		...p,
		image: p.image_url || `https://avatar.vercel.sh/${p.id}`,
		buttonText: p.button_text || "Open Project",
	};
}

function App() {
	const [projects, setProjects] = useState([]);
	const [activeProject, setActiveProject] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchProjects()
			.then((list) => setProjects(list.map(normalizeProject)))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	async function handleCreate(data) {
		try {
			const created = await createProject(data);
			const normalized = normalizeProject(created);
			setProjects((prev) => [...prev, normalized]);
		} catch (err) {
			console.error("Create failed:", err);
		}
	}

	async function handleDelete(id) {
		try {
			await deleteProject(id);
			setProjects((prev) => prev.filter((p) => p.id !== id));
		} catch (err) {
			console.error("Delete failed:", err);
		}
	}

	if (activeProject) {
		return (
			<div className="flex flex-col h-screen w-screen">
				<StudySpace
					project={activeProject}
					onBack={() => setActiveProject(null)}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen w-screen">
			<Dashboard
				projects={projects}
				loading={loading}
				onCreateProject={handleCreate}
				onDeleteProject={(id) => handleDelete(id)}
				onOpenProject={(project) => setActiveProject(project)}
			/>
		</div>
	);
}

export default App;
