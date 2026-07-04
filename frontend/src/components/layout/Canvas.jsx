import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export default function Canvas() {
	return (
		<div style={{ height: "100vh", width: "100vw" }}>
			<Excalidraw>
				{/* <MainMenu>
              
            </MainMenu> */}
			</Excalidraw>
		</div>
	);
}
