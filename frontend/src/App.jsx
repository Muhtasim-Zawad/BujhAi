import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
// import Canvas from "./components/layout/Canvas";
// import { ProjectCard } from "./components/layout/ProjectCard";
// import Navbar from "./components/layout/Navbar";
// import Dashboard from "./components/sections/Dashboard";
// import ChatInterface from "./components/layout/ChatInterface";
import ChatLeftSidebar from "./components/layout/ChatLeftSidebar";
import ChatRightSidebar from "./components/layout/ChatRightSidebar";

function App() {
	return (
		<div className="flex flex-col min-h-screen w-screen overflow-y-auto">
			{/* <Dashboard /> */}
			{/* <ChatInterface /> */}
			<ChatLeftSidebar />
			<ChatRightSidebar />
		</div>
	);
}

export default App;
