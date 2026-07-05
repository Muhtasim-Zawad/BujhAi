import React, { useState } from "react";
import { Plus, Globe, Sparkles, Search, Columns, Check } from "lucide-react";

export default function SourcesSidebar() {
	// Mock source data state
	const [sources, setSources] = useState([
		{ id: "1", name: "01. Uninformed_Search.pdf", type: "pdf" },
		{ id: "2", name: "02. Informed_Search.pdf", type: "pdf" },
	]);

	// Track selected items by their unique id
	const [selectedIds, setSelectedIds] = useState(["1", "2"]);

	const toggleSelectAll = () => {
		if (selectedIds.length === sources.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(sources.map((s) => s.id));
		}
	};

	const toggleSelectOne = (id) => {
		if (selectedIds.includes(id)) {
			setSelectedIds(selectedIds.filter((item) => item !== id));
		} else {
			setSelectedIds([...selectedIds, id]);
		}
	};

	const isAllSelected =
		sources.length > 0 && selectedIds.length === sources.length;

	return (
		<div className="w-[320px] h-full bg-[#1e2022] text-[#e3e3e3] p-4 rounded-lg flex flex-col font-sans">
			{/* Header */}
			<div className="flex items-center justify-between mb-5">
				<h2 className="text-xl font-medium text-white">Sources</h2>
				<button className="text-[#c4c7c5] hover:bg-[#2d2f31] p-1.5 rounded-lg transition-colors">
					<Columns className="w-5 h-5" />
				</button>
			</div>

			{/* Add Sources Button */}
			<button className="w-full flex items-center justify-center gap-2 bg-[#282a2c] hover:bg-[#333538] text-[#e3e3e3] border border-[#444746] py-3 px-4 rounded-full transition-colors mb-4 text-sm font-medium">
				<Plus className="w-5 h-5 text-[#a8c7fa]" />
				Add sources
			</button>

			{/* Search Bar / Web Search Area */}
			<div className="bg-[#131314] rounded-2xl p-3 border border-[#2d2f31] mb-4">
				<p className="text-sm text-[#c4c7c5] px-1 mb-3">
					Search the web for new sources
				</p>
				<div className="flex items-center justify-between">
					<div className="flex gap-2">
						{/* Globe Dropdown Button */}
						<button className="flex items-center gap-1 bg-[#282a2c] hover:bg-[#333538] px-3 py-1.5 rounded-full text-xs text-[#e3e3e3] transition-colors border border-[#444746]">
							<Globe className="w-3.5 h-3.5 text-[#a8c7fa]" />
							<span className="text-[10px] opacity-70">▼</span>
						</button>
						{/* AI Search Dropdown Button */}
						<button className="flex items-center gap-1 bg-[#282a2c] hover:bg-[#333538] px-3 py-1.5 rounded-full text-xs text-[#e3e3e3] transition-colors border border-[#444746]">
							<Sparkles className="w-3.5 h-3.5 text-[#c4eed0]" />
							<span className="text-[10px] opacity-70">▼</span>
						</button>
					</div>
					{/* Action Search Action */}
					<button className="bg-[#282a2c] hover:bg-[#333538] p-2 rounded-full transition-colors border border-[#444746]">
						<Search className="w-4 h-4 text-[#c4c7c5]" />
					</button>
				</div>
			</div>

			{/* Select All Toggle */}
			<div className="flex items-center justify-end gap-3 px-2 mb-4 text-sm">
				<span className="text-[#c4c7c5] font-medium">Select all</span>
				<button
					onClick={toggleSelectAll}
					className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
						isAllSelected
							? "bg-[#a8c7fa] border-[#a8c7fa]"
							: "border-[#8e918f] hover:bg-[#2d2f31]"
					}`}
				>
					{isAllSelected && (
						<Check className="w-3.5 h-3.5 text-[#1e2022] stroke-3" />
					)}
				</button>
			</div>

			{/* Sources List */}
			<div className="flex-1 overflow-y-auto space-y-1">
				{sources.map((source) => {
					const isSelected = selectedIds.includes(source.id);
					return (
						<div
							key={source.id}
							onClick={() => toggleSelectOne(source.id)}
							className="flex items-center justify-between p-2 gap-1 rounded-xl hover:bg-[#282a2c] cursor-pointer transition-colors group"
						>
							<div className="flex items-center gap-3 min-w-0">
								{/* PDF Label Icon Container */}
								<div className="shrink-0 bg-[#3b1e1e] border border-[#602020] rounded px-1.5 py-1 flex items-center justify-center">
									<span className="text-[9px] font-bold text-[#f28b82]">
										PDF
									</span>
								</div>
								{/* File Title */}
								<span className="text-sm truncate text-[#e3e3e3] font-normal">
									{source.name}
								</span>
							</div>

							{/* Checkbox item */}
							<button
								onClick={(e) => {
									e.stopPropagation(); // Stops the container click event from double toggling
									toggleSelectOne(source.id);
								}}
								className={`w-5 h-5 rounded flex items-center justify-center transition-colors border shrink-0 ${
									isSelected
										? "bg-[#8e918f] border-[#8e918f]"
										: "border-[#8e918f] group-hover:border-[#e3e3e3]"
								}`}
							>
								{isSelected && (
									<Check className="w-3.5 h-3.5 text-[#1e2022] stroke-3" />
								)}
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
