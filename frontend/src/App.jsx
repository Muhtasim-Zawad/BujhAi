import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
// import Canvas from "./components/layout/Canvas";
import { ProjectCard } from "./components/layout/ProjectCard";
import Navbar from "./components/layout/Navbar";
import NavbarDemo from "./components/layout/NavbarDemo";

function App() {
	return (
		<div className="flex flex-col h-screen w-screen overflow-hidden">
			{/* <ProjectCard /> */}
			<Navbar />
			<NavbarDemo />
		</div>
	);
}

export default App;
