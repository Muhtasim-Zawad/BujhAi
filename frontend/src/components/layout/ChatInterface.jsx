import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Canvas from "@/components/layout/Canvas";
import {
	Send,
	Paperclip,
	Mic,
	Bot,
	User,
	StopCircle,
	Sparkles,
	MessageSquare,
	Pencil,
} from "lucide-react";

const initialMessages = [
	{
		id: 1,
		role: "assistant",
		content: "Hello! I'm BujhAI. How can I help you today?",
		timestamp: new Date(),
	},
];

export default function ChatInterface() {
	const [messages, setMessages] = useState(initialMessages);
	const [input, setInput] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showCanvas, setShowCanvas] = useState(false);
	const messagesEndRef = useRef(null);
	const textareaRef = useRef(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	function handleSubmit(e) {
		e?.preventDefault();
		if (!input.trim()) return;

		const userMessage = {
			id: Date.now(),
			role: "user",
			content: input.trim(),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		setTimeout(() => {
			setMessages((prev) => [
				...prev,
				{
					id: Date.now() + 1,
					role: "assistant",
					content:
						"This is a simulated AI response. The actual AI integration will be added soon.",
					timestamp: new Date(),
				},
			]);
			setIsLoading(false);
		}, 1000);
	}

	function handleKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex items-center justify-end border-b-2 border-black bg-card px-4 py-2">
				<button
					onClick={() => setShowCanvas((v) => !v)}
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

			{showCanvas ? (
				<div className="flex-1 overflow-hidden">
					<Canvas />
				</div>
			) : (
				<>
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
								<div className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
									<Bot className="size-5 text-primary-foreground" />
								</div>
							)}
							<div
								className={cn(
									"max-w-[80%] rounded-xl border-2 border-black px-4 py-2.5 text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
									message.role === "user"
										? "bg-primary text-primary-foreground"
										: "bg-card text-card-foreground",
								)}
							>
								<p className="whitespace-pre-wrap">{message.content}</p>
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

			<div className="border-t-2 border-black bg-card px-4 py-4">
				<form
					onSubmit={handleSubmit}
					className="mx-auto flex max-w-3xl"
				>
					<div className="flex w-full flex-col rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus-within:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[2px] focus-within:translate-y-[2px]">
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => {
								setInput(e.target.value);
								const el = e.target;
								el.style.height = 'auto';
								el.style.height = Math.min(el.scrollHeight, 200) + 'px';
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
											: "text-muted-foreground hover:bg-accent hover:text-foreground",
									)}
									onClick={() => setIsRecording(!isRecording)}
									title={isRecording ? "Stop recording" : "Start recording"}
								>
									<Mic className="size-4" />
								</button>
							</div>
							<Button
								type="submit"
								size="icon-sm"
								disabled={!input.trim() || isLoading}
								className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50"
							>
								{isLoading ? (
									<StopCircle className="size-4" />
								) : (
									<Send className="size-4" />
								)}
							</Button>
						</div>
					</div>
				</form>
			</div>
			</>
			)}
		</div>
	);
}
