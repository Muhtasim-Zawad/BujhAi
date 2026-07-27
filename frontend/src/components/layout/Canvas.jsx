import { useCallback, useEffect, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

// Compact canvas data to only essential fields for AI context
export function compactSceneData(elements) {
	try {
		if (!Array.isArray(elements) || elements.length === 0) {
			return null;
		}

		const compacted = elements.map((el) => {
			const compact = {
				id: el.id,
				type: el.type, // rectangle, text, arrow, line, etc.
			};

			// Position and size - spatial context
			if (el.x !== undefined) compact.x = Math.round(el.x);
			if (el.y !== undefined) compact.y = Math.round(el.y);
			if (el.width) compact.width = Math.round(el.width);
			if (el.height) compact.height = Math.round(el.height);

			// Text content - most important for AI
			if (el.text) compact.text = el.text;

			// Visual properties - help AI understand intent
			if (el.strokeColor) compact.color = el.strokeColor;
			if (el.type === "arrow") {
				// Connection info for arrows
				compact.points = el.points;
				if (el.startBinding) compact.from = el.startBinding.elementId;
				if (el.endBinding) compact.to = el.endBinding.elementId;
			}

			// Container reference (for text inside shapes)
			if (el.containerId) compact.container = el.containerId;

			return compact;
		});

		const result = JSON.stringify(compacted);
		console.log(
			"[Canvas] compactSceneData: created",
			compacted.length,
			"elements, size:",
			result.length,
			"bytes",
		);
		return result;
	} catch (err) {
		console.error(
			"[Canvas] compactSceneData: error compacting scene data:",
			err,
		);
		return null;
	}
}

export function getCanvasScene(excalidrawRef) {
	const ref = excalidrawRef?.current;

	// Try multiple ways to get scene data
	if (!ref) {
		console.warn("[Canvas] getCanvasScene: excalidrawRef.current is null");
		return null;
	}

	try {
		// Method 1: Use new approach where onChange data is stored
		if (ref.sceneData) {
			console.log("[Canvas] getCanvasScene: using sceneData from onChange");
			return ref.sceneData;
		}

		// Method 2: Use getSceneElements if it exists (API method)
		if (ref.getSceneElements && typeof ref.getSceneElements === "function") {
			const elements = ref.getSceneElements?.();
			console.log(
				"[Canvas] getCanvasScene: got elements from API, count:",
				elements?.length,
			);
			if (elements && elements.length > 0) {
				return JSON.stringify(elements);
			}
		}

		console.warn("[Canvas] getCanvasScene: no elements found in ref");
		return null;
	} catch (err) {
		console.error("[Canvas] getCanvasScene: error getting scene", err);
		return null;
	}
}

// Wait for canvas to be ready with event listener + polling
export async function waitForCanvasReady(excalidrawRef, maxWaitMs = 1000) {
	const startTime = Date.now();
	let checkCount = 0;

	return new Promise((resolve) => {
		// Set up event listener for canvas-ready event
		const handleCanvasReady = () => {
			const elapsed = Date.now() - startTime;
			console.log(
				"[Canvas] waitForCanvasReady: canvas-ready event received after",
				elapsed,
				"ms",
			);
			cleanup();
			resolve(true);
		};

		const cleanup = () => {
			clearInterval(pollInterval);
			clearTimeout(timeoutId);
			window.removeEventListener("canvas-ready", handleCanvasReady);
		};

		window.addEventListener("canvas-ready", handleCanvasReady);

		// Also poll the ref in case it's already populated
		const pollInterval = setInterval(() => {
			checkCount++;
			if (excalidrawRef?.current?.sceneData) {
				const elapsed = Date.now() - startTime;
				console.log(
					"[Canvas] waitForCanvasReady: sceneData available after",
					elapsed,
					"ms (checks:",
					checkCount + ")",
				);
				cleanup();
				resolve(true);
			}
		}, 25);

		// Timeout if neither happens
		const timeoutId = setTimeout(() => {
			const elapsed = Date.now() - startTime;
			console.warn(
				"[Canvas] waitForCanvasReady: TIMEOUT after",
				elapsed,
				"ms (checks:",
				checkCount + "), sceneData available:",
				!!excalidrawRef?.current?.sceneData,
			);
			cleanup();
			resolve(false);
		}, maxWaitMs);
	});
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
	const currentDataRef = useRef({ elements: [], appState: null, files: null });

	useEffect(() => {
		console.log("[Canvas] useEffect: Canvas component mounted/updated");
	}, []);

	const onChange = useCallback(
		(elements, appState, files) => {
			console.log("[Canvas] onChange fired, elements count:", elements?.length);

			// Store the latest scene data in ref
			currentDataRef.current = { elements, appState, files };

			// Use compacted data for AI context (only essential fields)
			const sceneData = compactSceneData(elements);

			// Sync to parent ref so getCanvasScene can access it
			if (excalidrawRef) {
				excalidrawRef.current = {
					getSceneElements: () => elements,
					getAppState: () => appState,
					getFiles: () => files,
					sceneData: sceneData, // Now contains compacted JSON
				};
				console.log(
					"[Canvas] Updated excalidrawRef.current with compacted scene data",
				);
			}

			// Signal canvas is ready
			window.dispatchEvent(new CustomEvent("canvas-ready"));

			onSceneChange?.(elements, appState, files);
		},
		[onSceneChange, excalidrawRef],
	);

	return (
		<div
			className={className}
			style={{ height: height || "100%", width: "100%" }}
		>
			{console.log("[Canvas] Rendering Excalidraw")}
			<Excalidraw onChange={onChange} theme="light" />
		</div>
	);
}
