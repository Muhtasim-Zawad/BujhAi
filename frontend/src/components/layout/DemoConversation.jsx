import {
	Attachment,
	AttachmentPreview,
	AttachmentRemove,
	Attachments,
} from "@/components/ai-elements/attachments";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionAddScreenshot,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputHeader,
	PromptInputSelect,
	PromptInputSelectContent,
	PromptInputSelectItem,
	PromptInputSelectTrigger,
	PromptInputSelectValue,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputFooter,
	PromptInputTools,
	usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon, Columns, Mic, MessageSquare, PenTool } from "lucide-react";
import { useState } from "react";
// import { useChat } from "@ai-sdk/react";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import Canvas from "@/components/layout/Canvas";

const PromptInputAttachmentsDisplay = () => {
	const attachments = usePromptInputAttachments();

	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<Attachments variant="inline">
			{attachments.files.map((attachment) => (
				<Attachment
					data={attachment}
					key={attachment.id}
					onRemove={() => attachments.remove(attachment.id)}
				>
					<AttachmentPreview />
					<AttachmentRemove />
				</Attachment>
			))}
		</Attachments>
	);
};

const models = [
	{ id: "llama-3.3-70b", name: "llama-3.3-70b" },
	{ id: "gpt-4o", name: "GPT-4o" },
	{ id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
];

const InputDemo = () => {
	const [text, setText] = useState("");
	const [model, setModel] = useState(models[0].id);
	const [useWebSearch, setUseWebSearch] = useState(false);

	// const { messages, status, sendMessage } = useChat();

	// const handleSubmit = (message) => {
	// 	const hasText = Boolean(message.text);
	// 	const hasAttachments = Boolean(message.files?.length);

	// 	if (!(hasText || hasAttachments)) {
	// 		return;
	// 	}

	// 	sendMessage(
	// 		{
	// 			text: message.text || "Sent with attachments",
	// 			files: message.files,
	// 		},
	// 		{
	// 			body: {
	// 				model: model,
	// 				webSearch: useWebSearch,
	// 			},
	// 		},
	// 	);
	// 	setText("");
	// };

	const [messages, setMessages] = useState([]);
	const [status, setStatus] = useState("ready");
	const [mode, setMode] = useState("chat");

	const handleSubmit = async (message) => {
		const hasText = Boolean(message.text);
		const hasAttachments = Boolean(message.files?.length);
		if (!(hasText || hasAttachments)) return;

		const userMessage = {
			id: crypto.randomUUID(),
			role: "user",
			parts: [{ type: "text", text: message.text || "Sent with attachments" }],
		};
		setMessages((prev) => [...prev, userMessage]);
		setText("");

		setTimeout(() => {
			const botMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				parts: [
					{
						type: "text",
						text: "Great! I've analyzed your document. I see sections about Informed and Uninformed Search, and the foundations of Artificial Intelligence. Where would you like to start teaching?",
					},
				],
			};
			setMessages((prev) => [...prev, botMessage]);
		}, 1000);
	};

	return (
		<div className="max-w-4xl mx-auto p-4 relative size-full rounded-lg border">
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center rounded-lg bg-[#282a2c] p-0.5">
						<button
							onClick={() => setMode("chat")}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
								mode === "chat"
									? "bg-[#3d3f41] text-white shadow-sm"
									: "text-[#9aa0a6] hover:text-white"
							}`}
						>
							<MessageSquare className="w-4 h-4" />
							Chat
						</button>
						<button
							onClick={() => setMode("canvas")}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
								mode === "canvas"
									? "bg-[#3d3f41] text-white shadow-sm"
									: "text-[#9aa0a6] hover:text-white"
							}`}
						>
							<PenTool className="w-4 h-4" />
							Canvas
						</button>
					</div>
					<button className="text-[#c4c7c5] hover:bg-[#2d2f31] p-1.5 rounded-lg transition-colors">
						<Columns className="w-5 h-5" />
					</button>
				</div>
				{mode === "chat" ? (
					<>
						<Conversation>
							<ConversationContent>
								{messages.map((message) => (
									<Message from={message.role} key={message.id}>
										<MessageContent>
											{message.parts.map((part, i) => {
												switch (part.type) {
													case "text":
														return (
															<MessageResponse key={`${message.id}-${i}`}>
																{part.text}
															</MessageResponse>
														);
													default:
														return null;
												}
											})}
										</MessageContent>
									</Message>
								))}
							</ConversationContent>
							<ConversationScrollButton />
						</Conversation>

						<PromptInput
							onSubmit={handleSubmit}
							className="mt-4"
							globalDrop
							multiple
						>
							<PromptInputHeader>
								<PromptInputAttachmentsDisplay />
							</PromptInputHeader>
							<PromptInputBody>
								<PromptInputTextarea
									onChange={(e) => setText(e.target.value)}
									value={text}
									className="text-[white]"
								/>
							</PromptInputBody>
							<PromptInputFooter>
								<PromptInputTools>
									<PromptInputActionMenu>
										<PromptInputActionMenuTrigger />
										<PromptInputActionMenuContent>
											<PromptInputActionAddAttachments />
											<PromptInputActionAddScreenshot />
										</PromptInputActionMenuContent>
									</PromptInputActionMenu>
									<PromptInputButton
										onClick={() => setUseWebSearch(!useWebSearch)}
										tooltip={{ content: "Use microphone", shortcut: "⌘K" }}
										variant={useWebSearch ? "default" : "ghost"}
									>
										<Mic size={16} />
										{/* <span>Search</span> */}
									</PromptInputButton>
									<PromptInputSelect
										onValueChange={(value) => {
											setModel(value);
										}}
										value={model}
									>
										<PromptInputSelectTrigger>
											<PromptInputSelectValue />
										</PromptInputSelectTrigger>
										<PromptInputSelectContent>
											{models.map((model) => (
												<PromptInputSelectItem key={model.id} value={model.id}>
													{model.name}
												</PromptInputSelectItem>
											))}
										</PromptInputSelectContent>
									</PromptInputSelect>
								</PromptInputTools>
								<PromptInputSubmit disabled={!text && !status} status={status} />
							</PromptInputFooter>
						</PromptInput>
					</>
				) : (
					<Canvas />
				)}
			</div>
		</div>
	);
};

export default InputDemo;
