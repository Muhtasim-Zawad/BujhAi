// import Canvas from "./components/layout/Canvas";
import InputDemo from "./components/layout/DemoConversation";
import SourcesSidebar from "./components/layout/SourcesSidebar";
import StudioSidebar from "./components/layout/StudioSidebar";

function App() {
	return (
		<div className="flex h-screen w-screen p-5 gap-4 overflow-hidden bg-[#131314] box-border">
			<SourcesSidebar />
			<InputDemo />
			<StudioSidebar />
		</div>
	);
}

export default App;
