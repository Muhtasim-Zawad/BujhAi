import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
// import Canvas from "./components/layout/Canvas";
// import { ProjectCard } from "./components/layout/ProjectCard";
// import Navbar from "./components/layout/Navbar";
import Dashboard from "./components/sections/Dashboard";

function App() {
	return (
		<div className="flex flex-col min-h-screen w-screen overflow-y-auto">
			{/* <ProjectCard /> */}
			{/* <Navbar /> */}
			<Dashboard />
		</div>
	);
}

export default App;
