// import Canvas from "./components/layout/Canvas";
import InputDemo from "./components/layout/DemoConversation";
import SourcesSidebar from "./components/layout/SourcesSidebar";

function App() {
	return (
		<div style={{ display: "flex" }}>
			<SourcesSidebar />
			<InputDemo />
		</div>
	);
}

export default App;
