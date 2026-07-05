import React, { useState } from "react";
import {
	Columns,
	ChevronRight,
	Check,
	PlusCircle,
	Layers,
	Network,
} from "lucide-react";

export default function StudioSidebar() {
	// Rubrics Checklist State
	const [checklist, setChecklist] = useState([
		{
			id: "topic1",
			title: "1. Introduction to Search",
			subtopics: [
				{ id: "sub1_1", name: "Defining the State Space", checked: true },
				{ id: "sub1_2", name: "Initial vs Goal States", checked: false },
			],
		},
		{
			id: "topic2",
			title: "2. Uninformed Strategies",
			subtopics: [
				{ id: "sub2_1", name: "Breadth-First Search (BFS)", checked: true },
				{ id: "sub2_2", name: "Depth-First Search (DFS)", checked: true },
				{ id: "sub2_3", name: "Uniform Cost Search", checked: false },
			],
		},
	]);

	const toggleSubtopic = (topicId, subtopicId) => {
		setChecklist((prev) =>
			prev.map((topic) => {
				if (topic.id !== topicId) return topic;
				return {
					...topic,
					subtopics: topic.subtopics.map((sub) =>
						sub.id === subtopicId ? { ...sub, checked: !sub.checked } : sub,
					),
				};
			}),
		);
	};

	// Studio Cards Config (Replaced with your custom set)
	const cards = [
		{
			title: "Add Note",
			icon: <PlusCircle className="w-5 h-5 text-[#a8c7fa]" />,
			bg: "bg-[#21252e] hover:bg-[#2a303d]",
		},
		{
			title: "Flashcards",
			icon: <Layers className="w-5 h-5 text-[#fcb1a6]" />,
			bg: "bg-[#2d2121] hover:bg-[#3b2b2b]",
		},
		{
			title: "Knowledge Graph",
			icon: <Network className="w-5 h-5 text-[#fbc2eb]" />,
			bg: "bg-[#2c202b] hover:bg-[#3a2a39]",
		},
	];

	return (
		<div className="w-[320px] h-full bg-[#1e2022] text-[#e3e3e3] p-4 rounded-lg flex flex-shrink-0 flex-col font-sans select-none border-l border-[#2d2f31]">
			{/* HEADER */}
			<div className="flex items-center justify-between mb-4 flex-shrink-0">
				<h2 className="text-xl font-medium text-white">Studio</h2>
				<button className="text-[#c4c7c5] hover:bg-[#2d2f31] p-1.5 rounded-lg transition-colors">
					<Columns className="w-5 h-5" />
				</button>
			</div>

			{/* SECTION 1: RUBRICS CHECKLIST */}
			<div className="flex-1 min-h-0 overflow-y-auto border-b border-[#2d2f31] pb-4 custom-scrollbar">
				<p className="text-xs font-semibold tracking-wider text-[#9aa0a6] uppercase mb-3 px-1">
					Rubrics Checklist
				</p>

				<div className="space-y-4">
					{checklist.map((topic) => (
						<div key={topic.id} className="space-y-1.5">
							<h3 className="text-sm font-medium text-[#e3e3e3] px-1 truncate">
								{topic.title}
							</h3>

							<div className="space-y-1">
								{topic.subtopics.map((subtopic) => (
									<div
										key={subtopic.id}
										onClick={() => toggleSubtopic(topic.id, subtopic.id)}
										className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#282a2c] cursor-pointer transition-colors group"
									>
										<span
											className={`text-xs truncate max-w-[230px] ${
												subtopic.checked
													? "text-[#a8c7fa] line-through opacity-70"
													: "text-[#c4c7c5]"
											}`}
										>
											{subtopic.name}
										</span>

										<button
											className={`w-4 h-4 rounded flex items-center justify-center transition-colors border flex-shrink-0 ${
												subtopic.checked
													? "bg-[#a8c7fa] border-[#a8c7fa]"
													: "border-[#8e918f] group-hover:border-[#e3e3e3]"
											}`}
										>
											{subtopic.checked && (
												<Check className="w-3 h-3 text-[#1e2022] stroke-[3.5]" />
											)}
										</button>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* SECTION 2: STUDIO CARDS */}
			<div className="pt-4 flex-shrink-0">
				<p className="text-xs font-semibold tracking-wider text-[#9aa0a6] uppercase mb-3 px-1">
					Tools & Actions
				</p>

				<div className="grid grid-cols-1 gap-2.5">
					{cards.map((card, idx) => (
						<div
							key={idx}
							className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent hover:border-[#444746]/40 ${card.bg}`}
						>
							<div className="flex items-center gap-3.5 min-w-0">
								<div className="flex-shrink-0">{card.icon}</div>
								<span className="text-sm font-medium text-white truncate">
									{card.title}
								</span>
							</div>

							<div className="bg-[#1e2022]/60 p-1.5 rounded-full text-[#c4c7c5]">
								<ChevronRight className="w-4 h-4" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
