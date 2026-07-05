import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export default function Canvas() {
	return (
		<div style={{ height: "100%", width: "100%" }}>
			<Excalidraw>
				{/* <MainMenu>
              
            </MainMenu> */}
			</Excalidraw>
		</div>
	);
}
