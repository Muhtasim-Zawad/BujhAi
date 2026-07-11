import { useState } from "react";
import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import Dashboard from "./components/sections/Dashboard";
import StudySpace from "./components/sections/StudySpace";
import { initialProjects } from "./components/sections/Dashboard";

function App() {
	const [projects, setProjects] = useState(initialProjects);
	const [activeProject, setActiveProject] = useState(null);

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
				onCreateProject={(project) =>
					setProjects((prev) => [...prev, project])
				}
				onDeleteProject={(title) =>
					setProjects((prev) => prev.filter((p) => p.title !== title))
				}
				onOpenProject={(project) => setActiveProject(project)}
			/>
		</div>
	);
}

export default App;
