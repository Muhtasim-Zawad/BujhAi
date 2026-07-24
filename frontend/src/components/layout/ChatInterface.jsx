import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Canvas, {
	getCanvasScene,
	clearCanvas,
	loadCanvasScene,
} from "@/components/layout/Canvas";
import { streamChat, sendStt, fetchCanvas, saveCanvas } from "@/utils/api";
import {
	Send,
	Paperclip,
	Mic,
	Bot,
	User,
	Sparkles,
	Pencil,
	MessageSquare,
	Trash2,
} from "lucide-react";

const AVATARS = {
	evaluator: "https://avatar.vercel.sh/evaluator",
	student: "https://avatar.vercel.sh/tutor",
};

export default function ChatInterface({ projectId }) {
	const [messages, setMessages] = useState([
		{
			id: 1,
			role: "assistant",
			persona: "student",
			content: "Hello! I'm BujhAI. How can I help you today?",
			timestamp: new Date(),
		},
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showCanvas, setShowCanvas] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [recordingTimer, setRecordingTimer] = useState(0);

	const messagesEndRef = useRef(null);
	const textareaRef = useRef(null);
	const excalidrawRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const audioChunksRef = useRef([]);
	const timerRef = useRef(null);
	const currentPersonaRef = useRef(null);
	const evaluatorMsgIdRef = useRef(null);
	const autoSaveTimerRef = useRef(null);
	const [savedCanvasScene, setSavedCanvasScene] = useState(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	useEffect(() => {
		if (!projectId) return;
		fetchCanvas(projectId)
			.then((scene) => {
				if (scene?.scene_data) {
					setSavedCanvasScene(scene.scene_data);
				}
			})
			.catch(() => {});
	}, [projectId]);

	useEffect(() => {
		if (showCanvas && savedCanvasScene) {
			loadCanvasScene(excalidrawRef, savedCanvasScene);
		}
	}, [showCanvas, savedCanvasScene]);

	useEffect(() => {
		if (!showCanvas || !projectId) {
			if (autoSaveTimerRef.current) {
				clearInterval(autoSaveTimerRef.current);
				autoSaveTimerRef.current = null;
			}
			return;
		}
		autoSaveTimerRef.current = setInterval(() => {
			const sceneData = getCanvasScene(excalidrawRef);
			if (sceneData) {
				saveCanvas(projectId, sceneData).catch(() => {});
			}
		}, 10000);
		return () => {
			if (autoSaveTimerRef.current) {
				clearInterval(autoSaveTimerRef.current);
				autoSaveTimerRef.current = null;
			}
		};
	}, [showCanvas, projectId]);

	const onEvaluatorStart = useCallback(() => {
		const id = Date.now();
		evaluatorMsgIdRef.current = id;
		currentPersonaRef.current = "evaluator";
		setMessages((prev) => [
			...prev,
			{
				id,
				role: "assistant",
				persona: "evaluator",
				content: "",
				timestamp: new Date(),
			},
		]);
	}, []);

	const onText = useCallback((text) => {
		const persona = currentPersonaRef.current;
		if (!persona) return;
		setMessages((prev) => {
			const last = prev[prev.length - 1];
			if (!last || last.persona !== persona) return prev;
			return [...prev.slice(0, -1), { ...last, content: last.content + text }];
		});
	}, []);

	const onModuleUpdate = useCallback((updates) => {
		console.log("[ChatInterface] Dispatching module-update event with", updates.length, "updates");
		window.dispatchEvent(new CustomEvent("module-update", { detail: updates }));
	}, []);

	const onStudentStart = useCallback(() => {
		currentPersonaRef.current = "student";
		setMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				role: "assistant",
				persona: "student",
				content: "",
				timestamp: new Date(),
			},
		]);
	}, []);

	const onFinish = useCallback(() => {
		setIsLoading(false);
		currentPersonaRef.current = null;
	}, []);

	const onError = useCallback((err) => {
		console.error("Chat error:", err);
		setIsLoading(false);
		currentPersonaRef.current = null;
		setMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				role: "assistant",
				persona: "student",
				content: `**Error:** ${err.message}`,
				timestamp: new Date(),
			},
		]);
	}, []);

	async function handleSubmit(e) {
		e?.preventDefault();
		const text = input.trim();
		if (!text || isLoading) return;

		const canvasData = showCanvas ? getCanvasScene(excalidrawRef) : null;

		setMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				role: "user",
				content: text,
				timestamp: new Date(),
			},
		]);
		setInput("");
		setIsLoading(true);

		if (showCanvas && canvasData) {
			clearCanvas(excalidrawRef);
		}

		if (canvasData && projectId) {
			saveCanvas(projectId, canvasData).catch(() => {});
		}

		if (!projectId) {
			onStudentStart();
			setTimeout(
				() =>
					onText(
						"Backend not connected. Please use a project created via the API.",
					),
				100,
			);
			setTimeout(() => onFinish(), 600);
			return;
		}

		try {
			await streamChat(
				projectId,
				text,
				{
					onEvaluatorStart,
					onText,
					onModuleUpdate,
					onStudentStart,
					onFinish,
					onError,
				},
				canvasData,
			);
		} catch (err) {
			onError(err);
		}
	}

	function handleKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	// --- Voice recording ---
	async function toggleRecording() {
		if (isRecording) {
			stopRecording();
			return;
		}
		startRecording();
	}

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const recorder = new MediaRecorder(stream);
			mediaRecorderRef.current = recorder;
			audioChunksRef.current = [];

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunksRef.current.push(e.data);
			};

			recorder.onstop = async () => {
				stream.getTracks().forEach((t) => t.stop());
				setIsRecording(false);
				setIsTranscribing(true);

				const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
				try {
					const text = await sendStt(projectId, blob);
					if (text) {
						setInput((prev) => (prev ? prev + " " + text : text));
					}
				} catch (err) {
					console.error("STT failed:", err);
				}
				setIsTranscribing(false);
				clearInterval(timerRef.current);
				setRecordingTimer(0);
			};

			recorder.start();
			setIsRecording(true);
			timerRef.current = setInterval(() => {
				setRecordingTimer((t) => t + 1);
			}, 1000);
		} catch (err) {
			console.error("Mic access denied:", err);
		}
	}

	function stopRecording() {
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state !== "inactive"
		) {
			mediaRecorderRef.current.stop();
		}
	}

	function formatTimer(seconds) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="flex items-center justify-end border-b-2 border-black bg-card px-4 py-2">
				<button
					onClick={() => {
						if (showCanvas && projectId) {
							const sceneData = getCanvasScene(excalidrawRef);
							if (sceneData) {
								saveCanvas(projectId, sceneData).catch(() => {});
							}
						}
						setShowCanvas((v) => !v);
					}}
					className="flex cursor-pointer items-center gap-1.5 rounded-md border-2 border-black bg-background px-3 py-1.5 text-xs font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
				>
					{showCanvas ? (
						<>
							<MessageSquare className="size-4" />
							Chat
						</>
					) : (
						<>
							<Pencil className="size-4" />
							Canvas
						</>
					)}
				</button>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-6">
				<div className="mx-auto flex max-w-3xl flex-col gap-4">
					{messages.map((message) => (
						<div
							key={message.id}
							className={cn(
								"flex gap-3",
								message.role === "user" ? "justify-end" : "justify-start",
							)}
						>
							{message.role === "assistant" && (
								<div
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
										message.persona === "evaluator"
											? "bg-purple-600"
											: "bg-primary",
									)}
								>
									<Bot className="size-5 text-primary-foreground" />
								</div>
							)}
							<div className="flex max-w-[80%] flex-col gap-1">
								{message.role === "assistant" && message.persona && (
									<span
										className={cn(
											"text-xs font-semibold uppercase tracking-wide",
											message.persona === "evaluator"
												? "text-purple-600"
												: "text-blue-600",
										)}
									>
										{message.persona === "evaluator" ? "Evaluator" : "Tutor"}
									</span>
								)}
								<div
									className={cn(
										"rounded-xl border-2 border-black px-4 py-2.5 text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
										message.role === "user"
											? "bg-primary text-primary-foreground"
											: message.persona === "evaluator"
												? "bg-purple-50 text-card-foreground"
												: "bg-card text-card-foreground",
									)}
								>
									<p className="whitespace-pre-wrap">{message.content}</p>
								</div>
							</div>
							{message.role === "user" && (
								<div className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-secondary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
									<User className="size-5" />
								</div>
							)}
						</div>
					))}
					{isLoading && (
						<div className="flex gap-3">
							<div className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
								<Bot className="size-5 text-primary-foreground" />
							</div>
							<div className="flex max-w-[80%] items-center gap-2 rounded-xl border-2 border-black bg-card px-4 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
								<Skeleton className="size-2 animate-bounce rounded-full bg-foreground" />
								<Skeleton className="size-2 animate-bounce rounded-full bg-foreground [animation-delay:0.1s]" />
								<Skeleton className="size-2 animate-bounce rounded-full bg-foreground [animation-delay:0.2s]" />
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Canvas panel */}
			{showCanvas && (
				<div
					className="flex min-h-0 flex-col border-t-2 border-black bg-card"
					style={{ flex: "0 0 60%" }}
				>
					<div className="flex items-center justify-between border-b border-black/20 px-4 py-1.5">
						<span className="text-xs font-semibold uppercase text-muted-foreground">
							Canvas
						</span>
						<button
							onClick={() => clearCanvas(excalidrawRef)}
							className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="size-3" />
							Clear
						</button>
					</div>
					<div className="flex-1 min-h-0">
						<Canvas excalidrawRef={excalidrawRef} height="100%" />
					</div>
				</div>
			)}

			{/* Input area */}
			<div className="border-t-2 border-black bg-card px-4 py-4">
				<form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl">
					<div className="flex w-full flex-col rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus-within:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[2px] focus-within:translate-y-[2px]">
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => {
								setInput(e.target.value);
								const el = e.target;
								el.style.height = "auto";
								el.style.height = Math.min(el.scrollHeight, 200) + "px";
							}}
							onKeyDown={handleKeyDown}
							placeholder="Type your message..."
							className="min-h-[60px] max-h-[200px] w-full resize-none border-0 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
						/>
						<div className="flex items-center justify-between px-2 pb-1.5">
							<div className="flex items-center gap-1">
								<button
									type="button"
									className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
									title="Attach file"
								>
									<Paperclip className="size-4" />
								</button>
								<button
									type="button"
									className={cn(
										"flex cursor-pointer items-center justify-center rounded-lg p-1.5 transition-colors",
										isRecording
											? "bg-destructive text-destructive-foreground animate-pulse"
											: isTranscribing
												? "text-muted-foreground"
												: "text-muted-foreground hover:bg-accent hover:text-foreground",
									)}
									onClick={toggleRecording}
									disabled={isTranscribing}
									title={
										isRecording
											? "Stop recording"
											: isTranscribing
												? "Transcribing..."
												: "Start recording"
									}
								>
									{isTranscribing ? (
										<Sparkles className="size-4 animate-spin" />
									) : (
										<Mic className="size-4" />
									)}
								</button>
								{isRecording && (
									<span className="text-xs font-medium text-destructive">
										{formatTimer(recordingTimer)}
									</span>
								)}
							</div>
							<Button
								type="submit"
								size="icon-sm"
								disabled={!input.trim() || isLoading}
								className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50"
							>
								<Send className="size-4" />
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
