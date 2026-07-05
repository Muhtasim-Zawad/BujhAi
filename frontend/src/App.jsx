// import Canvas from "./components/layout/Canvas";
import InputDemo from "./components/layout/DemoConversation";
import SourcesSidebar from "./components/layout/SourcesSidebar";
import StudioSidebar from "./components/layout/StudioSidebar";
import Navbar from "./components/layout/Navbar";

function App() {
	return (
		<div className="flex flex-col h-screen w-screen bg-[#131314] overflow-hidden">
			<Navbar />

			{/* Sidebar and canvas content row */}
			<div className="flex flex-1 p-3 gap-4 overflow-hidden box-border">
				<SourcesSidebar />
				<InputDemo />
				<StudioSidebar />
			</div>
		</div>
	);
}

export default App;
