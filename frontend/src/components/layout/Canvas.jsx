import { useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

export function getCanvasScene(excalidrawRef) {
	const api = excalidrawRef?.current;
	if (!api) return null;
	const elements = api.getSceneElements();
	if (!elements || elements.length === 0) return null;
	return JSON.stringify(elements);
}

export function loadCanvasScene(excalidrawRef, sceneJson) {
	const api = excalidrawRef?.current;
	if (!api || !sceneJson) return;
	try {
		const elements = JSON.parse(sceneJson);
		api.updateScene({ elements });
	} catch {
		// ignore invalid JSON
	}
}

export function clearCanvas(excalidrawRef) {
	const api = excalidrawRef?.current;
	if (!api) return;
	try {
		api.resetScene();
	} catch {
		api.updateScene?.({ elements: [] });
	}
}

export default function Canvas({
	excalidrawRef,
	onSceneChange,
	height,
	className,
}) {
	const onChange = useCallback(
		(elements, state) => {
			onSceneChange?.(elements);
		},
		[onSceneChange],
	);

	return (
		<div
			className={className}
			style={{ height: height || "100%", width: "100%" }}
		>
			<Excalidraw
				ref={excalidrawRef}
				onChange={onChange}
			/>
		</div>
	);
}
