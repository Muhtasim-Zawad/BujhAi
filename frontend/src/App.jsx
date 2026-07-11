import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
// import Canvas from "./components/layout/Canvas";
// import { ProjectCard } from "./components/layout/ProjectCard";
// import Navbar from "./components/layout/Navbar";
// import Dashboard from "./components/sections/Dashboard";
// import ChatInterface from "./components/layout/ChatInterface";
// import ChatLeftSidebar from "./components/layout/ChatLeftSidebar";
// import ChatRightSidebar from "./components/layout/ChatRightSidebar";
// import Materials from "./components/layout/Materials";
// import Stats from "./components/layout/Stats";
import StudySpace from "./components/sections/StudySpace";

function App() {
	return (
		<div className="flex flex-col h-screen w-screen overflow-hidden">
			{/* <Dashboard /> */}
			{/* <ChatInterface /> */}
			{/* <ChatLeftSidebar /> */}
			{/* <ChatRightSidebar /> */}
			{/* <Materials /> */}
			{/* <Stats /> */}
			<StudySpace />
		</div>
	);
}

export default App;
