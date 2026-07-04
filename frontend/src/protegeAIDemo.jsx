// // ProtegeAIDemo.jsx
// import React, { useState, useRef, useEffect } from "react";

// const ProtegeAIDemo = () => {
// 	const [messages, setMessages] = useState([]);
// 	const [input, setInput] = useState("");
// 	const [isAttached, setIsAttached] = useState(false);
// 	const [fileName, setFileName] = useState("");
// 	const [isProcessing, setIsProcessing] = useState(false);
// 	const [showRubric, setShowRubric] = useState(false);
// 	const [rubricItems, setRubricItems] = useState([
// 		{ id: 1, text: "Understanding of React Hooks", covered: false },
// 		{ id: 2, text: "State Management Concepts", covered: false },
// 		{ id: 3, text: "Component Lifecycle", covered: false },
// 		{ id: 4, text: "Props and Data Flow", covered: false },
// 	]);
// 	const [teachingProgress, setTeachingProgress] = useState(0);
// 	const [isDevilAdvocate, setIsDevilAdvocate] = useState(false);
// 	const messagesEndRef = useRef(null);

// 	const scrollToBottom = () => {
// 		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// 	};

// 	useEffect(() => {
// 		scrollToBottom();
// 	}, [messages]);

// 	// Initial welcome message
// 	useEffect(() => {
// 		setMessages([
// 			{
// 				id: 1,
// 				sender: "ai",
// 				text: "👋 Hi! I'm your AI Student! I'm ready to learn from you. Upload your study material and start teaching me!",
// 				timestamp: new Date().toLocaleTimeString(),
// 			},
// 			{
// 				id: 2,
// 				sender: "ai",
// 				text: "📚 I see you've uploaded a document. I'm curious about what you'll teach me today!",
// 				timestamp: new Date().toLocaleTimeString(),
// 			},
// 		]);
// 	}, []);

// 	const handleAttachFile = () => {
// 		// Mock file attachment
// 		const mockFile = {
// 			name: "React_Advanced_Concepts.pdf",
// 			size: "2.4 MB",
// 			type: "application/pdf",
// 		};
// 		setIsAttached(true);
// 		setFileName(mockFile.name);

// 		// Add system message about file upload
// 		setMessages((prev) => [
// 			...prev,
// 			{
// 				id: Date.now(),
// 				sender: "system",
// 				text: `📎 ${mockFile.name} attached successfully! Ready to learn.`,
// 				timestamp: new Date().toLocaleTimeString(),
// 			},
// 			{
// 				id: Date.now() + 1,
// 				sender: "ai",
// 				text: "🎯 Great! I've analyzed your document. I see sections about React Hooks, State Management, and Component Lifecycle. Where would you like to start teaching?",
// 				timestamp: new Date().toLocaleTimeString(),
// 			},
// 		]);
// 	};

// 	const updateRubric = (concept) => {
// 		setRubricItems((prev) =>
// 			prev.map((item) =>
// 				item.text.toLowerCase().includes(concept.toLowerCase())
// 					? { ...item, covered: true }
// 					: item,
// 			),
// 		);

// 		// Update progress
// 		const covered = rubricItems.filter(
// 			(item) =>
// 				item.text.toLowerCase().includes(concept.toLowerCase()) ||
// 				(concept.toLowerCase().includes("hooks") &&
// 					item.text.toLowerCase().includes("hooks")) ||
// 				(concept.toLowerCase().includes("state") &&
// 					item.text.toLowerCase().includes("state")) ||
// 				(concept.toLowerCase().includes("lifecycle") &&
// 					item.text.toLowerCase().includes("lifecycle")) ||
// 				(concept.toLowerCase().includes("props") &&
// 					item.text.toLowerCase().includes("props")),
// 		);

// 		if (covered.length > 0) {
// 			const newCovered = rubricItems.filter(
// 				(item) =>
// 					item.text.toLowerCase().includes(concept.toLowerCase()) ||
// 					(concept.toLowerCase().includes("hooks") &&
// 						item.text.toLowerCase().includes("hooks")) ||
// 					(concept.toLowerCase().includes("state") &&
// 						item.text.toLowerCase().includes("state")) ||
// 					(concept.toLowerCase().includes("lifecycle") &&
// 						item.text.toLowerCase().includes("lifecycle")) ||
// 					(concept.toLowerCase().includes("props") &&
// 						item.text.toLowerCase().includes("props")),
// 			).length;

// 			setTeachingProgress((prev) => Math.min(prev + 25, 100));

// 			// Check if we should trigger devil's advocate mode
// 			if (teachingProgress >= 50 && !isDevilAdvocate) {
// 				setIsDevilAdvocate(true);
// 				setTimeout(() => {
// 					setMessages((prev) => [
// 						...prev,
// 						{
// 							id: Date.now(),
// 							sender: "system",
// 							text: "⚡ You've covered 50% of the concepts! Switching to Devil's Advocate mode...",
// 							timestamp: new Date().toLocaleTimeString(),
// 						},
// 						{
// 							id: Date.now() + 1,
// 							sender: "ai",
// 							text: "😈 Hmm, but are you SURE about that? I've heard that React Hooks actually work differently... Let me challenge you on that!",
// 							timestamp: new Date().toLocaleTimeString(),
// 						},
// 					]);
// 				}, 1000);
// 			}
// 		}
// 	};

// 	const handleSendMessage = () => {
// 		if (!input.trim()) return;

// 		// Add user message
// 		const userMessage = {
// 			id: Date.now(),
// 			sender: "user",
// 			text: input,
// 			timestamp: new Date().toLocaleTimeString(),
// 		};
// 		setMessages((prev) => [...prev, userMessage]);
// 		setInput("");
// 		setIsProcessing(true);

// 		// Simulate AI thinking and response
// 		setTimeout(
// 			() => {
// 				let aiResponse = "";
// 				let isQuestion = false;

// 				// Mock responses based on user input
// 				const lowerInput = input.toLowerCase();

// 				if (lowerInput.includes("hook") || lowerInput.includes("hooks")) {
// 					aiResponse =
// 						"🤔 Oh, so hooks are functions that let you use state and lifecycle features in functional components? Can you tell me more about the useState hook specifically? I'm a bit confused about how it works compared to class components.";
// 					updateRubric("hooks");
// 				} else if (lowerInput.includes("state")) {
// 					aiResponse =
// 						"📊 State management! I see. So the state holds data that can change over time. But what about Redux? When would you use Redux instead of useState?";
// 					updateRubric("state");
// 				} else if (
// 					lowerInput.includes("lifecycle") ||
// 					lowerInput.includes("mount") ||
// 					lowerInput.includes("unmount")
// 				) {
// 					aiResponse =
// 						"🔄 Oh! So components go through mounting, updating, and unmounting phases. Can you explain what happens during the mounting phase? I'm trying to understand useEffect better.";
// 					updateRubric("lifecycle");
// 				} else if (lowerInput.includes("prop")) {
// 					aiResponse =
// 						"📦 Props! So data flows down from parent to child components. But wait, what about passing data back up? How do you handle that?";
// 					updateRubric("props");
// 				} else if (
// 					lowerInput.includes("help") ||
// 					lowerInput.includes("confused")
// 				) {
// 					aiResponse =
// 						"😅 I'm a bit lost! Could you explain that again in simpler terms? Maybe use an analogy?";
// 				} else if (lowerInput.includes("yes") && isDevilAdvocate) {
// 					aiResponse =
// 						"😈 Hmm, I'm not convinced! What if I told you that React's reconciliation algorithm makes useEffect obsolete? How would you respond to that?";
// 					setIsDevilAdvocate(true);
// 				} else if (
// 					lowerInput.includes("correct") ||
// 					lowerInput.includes("wrong") ||
// 					lowerInput.includes("misconception")
// 				) {
// 					aiResponse =
// 						"🎓 Great catch! You spotted my intentional error. That's exactly the kind of critical thinking that deepens understanding! But now, can you explain why my statement was wrong?";
// 				} else if (
// 					teachingProgress < 100 &&
// 					rubricItems.some((item) => !item.covered)
// 				) {
// 					const uncovered = rubricItems.filter((item) => !item.covered);
// 					const randomConcept =
// 						uncovered[Math.floor(Math.random() * uncovered.length)];
// 					aiResponse = `🤓 Interesting! Can you tell me more about ${randomConcept.text}? I want to make sure I understand it correctly.`;
// 				} else if (teachingProgress >= 100) {
// 					aiResponse =
// 						"🌟 Wow! You've covered everything! I think I finally understand React now! Thank you for being such a great teacher! Would you like to export a study sheet of everything we covered?";
// 					// Show completion message
// 					setTimeout(() => {
// 						setMessages((prev) => [
// 							...prev,
// 							{
// 								id: Date.now(),
// 								sender: "system",
// 								text: "📄 Study sheet generated! You've covered all concepts successfully.",
// 								timestamp: new Date().toLocaleTimeString(),
// 							},
// 						]);
// 					}, 1500);
// 				} else {
// 					const concepts = ["hooks", "state", "lifecycle", "props"];
// 					const randomConcept =
// 						concepts[Math.floor(Math.random() * concepts.length)];
// 					const responses = [
// 						`🤔 Can you explain ${randomConcept} in a different way? I think I almost understand it...`,
// 						`📚 I see! But how does that connect to ${randomConcept}? I'm trying to build the bigger picture.`,
// 						`💡 That's interesting! Could you give me a concrete example of ${randomConcept}?`,
// 						`🤯 Wait, so ${randomConcept} works differently than I thought! Can you elaborate?`,
// 					];
// 					aiResponse = responses[Math.floor(Math.random() * responses.length)];
// 				}

// 				const aiMessage = {
// 					id: Date.now() + 1,
// 					sender: "ai",
// 					text: aiResponse,
// 					timestamp: new Date().toLocaleTimeString(),
// 				};

// 				setMessages((prev) => [...prev, aiMessage]);
// 				setIsProcessing(false);
// 			},
// 			1000 + Math.random() * 1500,
// 		);
// 	};

// 	const handleKeyPress = (e) => {
// 		if (e.key === "Enter" && !e.shiftKey) {
// 			e.preventDefault();
// 			handleSendMessage();
// 		}
// 	};

// 	const resetConversation = () => {
// 		setMessages([
// 			{
// 				id: Date.now(),
// 				sender: "ai",
// 				text: "🔄 Let's start fresh! Upload your study material and we'll begin again.",
// 				timestamp: new Date().toLocaleTimeString(),
// 			},
// 		]);
// 		setIsAttached(false);
// 		setFileName("");
// 		setRubricItems(rubricItems.map((item) => ({ ...item, covered: false })));
// 		setTeachingProgress(0);
// 		setIsDevilAdvocate(false);
// 	};

// 	return (
// 		<div style={styles.container}>
// 			<div style={styles.header}>
// 				<div style={styles.headerContent}>
// 					<div style={styles.headerLeft}>
// 						<span style={styles.logo}>🧠</span>
// 						<div>
// 							<h1 style={styles.title}>Protege AI</h1>
// 							<p style={styles.subtitle}>Teach the AI Student</p>
// 						</div>
// 					</div>
// 					<div style={styles.headerRight}>
// 						<span style={styles.statusBadge}>
// 							{isDevilAdvocate ? "😈 Devil's Advocate" : "🎓 Learning Mode"}
// 						</span>
// 						<button onClick={resetConversation} style={styles.resetButton}>
// 							🔄 Reset
// 						</button>
// 					</div>
// 				</div>
// 			</div>

// 			<div style={styles.mainContent}>
// 				<div style={styles.chatContainer}>
// 					<div style={styles.messagesContainer}>
// 						{messages.map((message) => (
// 							<div
// 								key={message.id}
// 								style={{
// 									...styles.messageWrapper,
// 									...(message.sender === "user"
// 										? styles.userMessage
// 										: styles.aiMessage),
// 									...(message.sender === "system" ? styles.systemMessage : {}),
// 								}}
// 							>
// 								{message.sender !== "system" && (
// 									<div style={styles.avatar}>
// 										{message.sender === "user" ? "👤" : "🤖"}
// 									</div>
// 								)}
// 								<div style={styles.messageContent}>
// 									<div style={styles.messageText}>{message.text}</div>
// 									<div style={styles.timestamp}>{message.timestamp}</div>
// 								</div>
// 							</div>
// 						))}
// 						{isProcessing && (
// 							<div style={styles.typingIndicator}>
// 								<div style={styles.typingDot}></div>
// 								<div style={styles.typingDot}></div>
// 								<div style={styles.typingDot}></div>
// 							</div>
// 						)}
// 						<div ref={messagesEndRef} />
// 					</div>

// 					<div style={styles.inputContainer}>
// 						<div style={styles.fileAttachment}>
// 							<button
// 								onClick={handleAttachFile}
// 								style={styles.attachButton}
// 								disabled={isAttached}
// 							>
// 								📎
// 							</button>
// 							{isAttached && <span style={styles.fileName}>{fileName} ✅</span>}
// 						</div>
// 						<textarea
// 							value={input}
// 							onChange={(e) => setInput(e.target.value)}
// 							onKeyPress={handleKeyPress}
// 							placeholder={
// 								isDevilAdvocate
// 									? "Defend your teaching against my challenges..."
// 									: "Explain a concept to your AI Student..."
// 							}
// 							style={styles.input}
// 							rows={2}
// 							disabled={isProcessing}
// 						/>
// 						<button
// 							onClick={handleSendMessage}
// 							style={styles.sendButton}
// 							disabled={isProcessing || !input.trim()}
// 						>
// 							{isProcessing ? "⏳" : "➤"}
// 						</button>
// 					</div>
// 				</div>

// 				<div style={styles.sidebar}>
// 					<div style={styles.sidebarSection}>
// 						<h3 style={styles.sidebarTitle}>
// 							📋 Mastery Rubric
// 							<span style={styles.progressText}>{teachingProgress}%</span>
// 						</h3>
// 						<div style={styles.progressBar}>
// 							<div
// 								style={{
// 									...styles.progressFill,
// 									width: `${teachingProgress}%`,
// 								}}
// 							/>
// 						</div>
// 						{rubricItems.map((item) => (
// 							<div key={item.id} style={styles.rubricItem}>
// 								<span style={item.covered ? styles.checkmark : styles.circle}>
// 									{item.covered ? "✅" : "⭕"}
// 								</span>
// 								<span
// 									style={
// 										item.covered ? styles.coveredText : styles.uncoveredText
// 									}
// 								>
// 									{item.text}
// 								</span>
// 							</div>
// 						))}
// 					</div>

// 					<div style={styles.sidebarSection}>
// 						<h3 style={styles.sidebarTitle}>📊 Knowledge Graph</h3>
// 						<div style={styles.graphContainer}>
// 							<div style={styles.graphNode}>
// 								<div style={styles.nodeCircle}>React</div>
// 								<div style={styles.nodeConnections}>
// 									<div style={styles.connectionLine}></div>
// 									<div style={styles.connectionLine}></div>
// 									<div style={styles.connectionLine}></div>
// 								</div>
// 								<div style={styles.nodeChildren}>
// 									<div style={styles.nodeChild}>Hooks</div>
// 									<div style={styles.nodeChild}>State</div>
// 									<div style={styles.nodeChild}>Props</div>
// 								</div>
// 							</div>
// 						</div>
// 					</div>

// 					<div style={styles.sidebarSection}>
// 						<h3 style={styles.sidebarTitle}>🎯 Session Stats</h3>
// 						<div style={styles.statItem}>
// 							<span>Messages:</span>
// 							<span>{messages.length}</span>
// 						</div>
// 						<div style={styles.statItem}>
// 							<span>Concepts Covered:</span>
// 							<span>
// 								{rubricItems.filter((i) => i.covered).length}/
// 								{rubricItems.length}
// 							</span>
// 						</div>
// 						<div style={styles.statItem}>
// 							<span>Mode:</span>
// 							<span>{isDevilAdvocate ? "🔴 Challenger" : "🟢 Teacher"}</span>
// 						</div>
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	);
// };

// const styles = {
// 	container: {
// 		height: "100vh",
// 		display: "flex",
// 		flexDirection: "column",
// 		backgroundColor: "#f0f2f5",
// 		fontFamily:
// 			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
// 	},
// 	header: {
// 		backgroundColor: "#2c3e50",
// 		color: "white",
// 		padding: "16px 24px",
// 		boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
// 		flexShrink: 0,
// 	},
// 	headerContent: {
// 		maxWidth: "1400px",
// 		margin: "0 auto",
// 		display: "flex",
// 		justifyContent: "space-between",
// 		alignItems: "center",
// 	},
// 	headerLeft: {
// 		display: "flex",
// 		alignItems: "center",
// 		gap: "12px",
// 	},
// 	logo: {
// 		fontSize: "28px",
// 	},
// 	title: {
// 		margin: 0,
// 		fontSize: "24px",
// 		fontWeight: "600",
// 	},
// 	subtitle: {
// 		margin: "2px 0 0 0",
// 		fontSize: "14px",
// 		opacity: 0.8,
// 	},
// 	headerRight: {
// 		display: "flex",
// 		alignItems: "center",
// 		gap: "12px",
// 	},
// 	statusBadge: {
// 		padding: "6px 12px",
// 		borderRadius: "20px",
// 		fontSize: "12px",
// 		fontWeight: "500",
// 		backgroundColor: "rgba(255,255,255,0.15)",
// 	},
// 	resetButton: {
// 		padding: "6px 12px",
// 		backgroundColor: "rgba(255,255,255,0.1)",
// 		border: "1px solid rgba(255,255,255,0.2)",
// 		borderRadius: "6px",
// 		color: "white",
// 		cursor: "pointer",
// 		fontSize: "12px",
// 		transition: "background-color 0.2s",
// 	},
// 	mainContent: {
// 		display: "flex",
// 		flex: 1,
// 		padding: "20px",
// 		gap: "20px",
// 		overflow: "hidden",
// 	},
// 	chatContainer: {
// 		flex: 1,
// 		display: "flex",
// 		flexDirection: "column",
// 		backgroundColor: "white",
// 		borderRadius: "12px",
// 		boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
// 		overflow: "hidden",
// 	},
// 	messagesContainer: {
// 		flex: 1,
// 		padding: "20px",
// 		overflowY: "auto",
// 		display: "flex",
// 		flexDirection: "column",
// 		gap: "12px",
// 	},
// 	messageWrapper: {
// 		display: "flex",
// 		gap: "10px",
// 		maxWidth: "80%",
// 	},
// 	userMessage: {
// 		alignSelf: "flex-end",
// 		flexDirection: "row-reverse",
// 	},
// 	aiMessage: {
// 		alignSelf: "flex-start",
// 	},
// 	systemMessage: {
// 		alignSelf: "center",
// 		maxWidth: "90%",
// 		backgroundColor: "#e8f4f8",
// 		padding: "8px 16px",
// 		borderRadius: "20px",
// 		fontSize: "13px",
// 		color: "#1a5276",
// 		fontStyle: "italic",
// 	},
// 	avatar: {
// 		width: "36px",
// 		height: "36px",
// 		borderRadius: "50%",
// 		display: "flex",
// 		alignItems: "center",
// 		justifyContent: "center",
// 		fontSize: "18px",
// 		flexShrink: 0,
// 		backgroundColor: "#e9ecef",
// 	},
// 	messageContent: {
// 		padding: "10px 14px",
// 		borderRadius: "12px",
// 		backgroundColor: "#e9ecef",
// 		maxWidth: "100%",
// 	},
// 	userMessage: {
// 		"& $messageContent": {
// 			backgroundColor: "#0084ff",
// 			color: "white",
// 		},
// 	},
// 	messageText: {
// 		lineHeight: "1.5",
// 		whiteSpace: "pre-wrap",
// 	},
// 	timestamp: {
// 		fontSize: "10px",
// 		opacity: 0.6,
// 		marginTop: "4px",
// 	},
// 	typingIndicator: {
// 		display: "flex",
// 		gap: "4px",
// 		padding: "10px 14px",
// 		backgroundColor: "#e9ecef",
// 		borderRadius: "12px",
// 		alignSelf: "flex-start",
// 		maxWidth: "60px",
// 	},
// 	typingDot: {
// 		width: "8px",
// 		height: "8px",
// 		backgroundColor: "#999",
// 		borderRadius: "50%",
// 		animation: "typing 1.4s infinite",
// 	},
// 	inputContainer: {
// 		display: "flex",
// 		padding: "16px",
// 		borderTop: "1px solid #e9ecef",
// 		gap: "10px",
// 		backgroundColor: "white",
// 	},
// 	fileAttachment: {
// 		display: "flex",
// 		alignItems: "center",
// 		gap: "8px",
// 	},
// 	attachButton: {
// 		padding: "8px 12px",
// 		backgroundColor: "transparent",
// 		border: "1px solid #ddd",
// 		borderRadius: "6px",
// 		cursor: "pointer",
// 		fontSize: "16px",
// 		transition: "all 0.2s",
// 		display: "flex",
// 		alignItems: "center",
// 		justifyContent: "center",
// 	},
// 	fileName: {
// 		fontSize: "12px",
// 		color: "#2e7d32",
// 		fontWeight: "500",
// 	},
// 	input: {
// 		flex: 1,
// 		padding: "10px",
// 		border: "1px solid #ddd",
// 		borderRadius: "6px",
// 		resize: "none",
// 		fontFamily: "inherit",
// 		fontSize: "14px",
// 		outline: "none",
// 		transition: "border-color 0.2s",
// 	},
// 	sendButton: {
// 		padding: "8px 16px",
// 		backgroundColor: "#0084ff",
// 		color: "white",
// 		border: "none",
// 		borderRadius: "6px",
// 		cursor: "pointer",
// 		fontSize: "18px",
// 		transition: "background-color 0.2s",
// 		alignSelf: "flex-end",
// 	},
// 	sidebar: {
// 		width: "320px",
// 		display: "flex",
// 		flexDirection: "column",
// 		gap: "16px",
// 		flexShrink: 0,
// 		overflowY: "auto",
// 	},
// 	sidebarSection: {
// 		backgroundColor: "white",
// 		borderRadius: "12px",
// 		padding: "16px",
// 		boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
// 	},
// 	sidebarTitle: {
// 		margin: "0 0 12px 0",
// 		fontSize: "16px",
// 		fontWeight: "600",
// 		display: "flex",
// 		justifyContent: "space-between",
// 		alignItems: "center",
// 	},
// 	progressText: {
// 		fontSize: "14px",
// 		fontWeight: "500",
// 		color: "#0084ff",
// 	},
// 	progressBar: {
// 		height: "6px",
// 		backgroundColor: "#e9ecef",
// 		borderRadius: "3px",
// 		overflow: "hidden",
// 		marginBottom: "12px",
// 	},
// 	progressFill: {
// 		height: "100%",
// 		backgroundColor: "#0084ff",
// 		transition: "width 0.5s ease",
// 	},
// 	rubricItem: {
// 		display: "flex",
// 		alignItems: "center",
// 		gap: "10px",
// 		padding: "6px 0",
// 	},
// 	checkmark: {
// 		fontSize: "14px",
// 	},
// 	circle: {
// 		fontSize: "14px",
// 	},
// 	coveredText: {
// 		color: "#2e7d32",
// 		textDecoration: "line-through",
// 	},
// 	uncoveredText: {
// 		color: "#333",
// 	},
// 	graphContainer: {
// 		padding: "8px 0",
// 	},
// 	graphNode: {
// 		display: "flex",
// 		flexDirection: "column",
// 		alignItems: "center",
// 	},
// 	nodeCircle: {
// 		padding: "8px 16px",
// 		backgroundColor: "#0084ff",
// 		color: "white",
// 		borderRadius: "20px",
// 		fontSize: "14px",
// 		fontWeight: "500",
// 	},
// 	nodeConnections: {
// 		display: "flex",
// 		gap: "20px",
// 		margin: "4px 0",
// 	},
// 	connectionLine: {
// 		width: "2px",
// 		height: "20px",
// 		backgroundColor: "#ccc",
// 	},
// 	nodeChildren: {
// 		display: "flex",
// 		gap: "16px",
// 		marginTop: "4px",
// 	},
// 	nodeChild: {
// 		padding: "4px 12px",
// 		backgroundColor: "#e9ecef",
// 		borderRadius: "12px",
// 		fontSize: "12px",
// 	},
// 	statItem: {
// 		display: "flex",
// 		justifyContent: "space-between",
// 		padding: "6px 0",
// 		fontSize: "14px",
// 		borderBottom: "1px solid #f0f0f0",
// 	},
// };

// // Add typing animation keyframes
// const styleSheet = document.createElement("style");
// styleSheet.textContent = `
//   @keyframes typing {
//     0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
//     30% { transform: translateY(-10px); opacity: 1; }
//   }
//   .user-message .message-content {
//     background-color: #0084ff;
//     color: white;
//   }
// `;
// document.head.appendChild(styleSheet);

// export default ProtegeAIDemo;
