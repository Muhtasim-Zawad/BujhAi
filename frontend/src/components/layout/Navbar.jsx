import React from "react";
import { Plus, Share2, Settings, Grip } from "lucide-react";

export default function Navbar() {
	return (
		<div className="w-full h-16 bg-[#131314] text-[#e3e3e3] px-6 flex items-center justify-between font-sans select-none">
			{/* LEFT SECTION: Logo & Title */}
			<div className="flex items-center gap-4">
				{/* NotebookLM Abstract Logo Icon */}
				<div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#131314]">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						className="w-5 h-5"
					>
						<path
							d="M4 12a8 8 0 0116 0M6 12a6 6 0 0112 0M8 12a4 4 0 018 0"
							strokeLinecap="round"
						/>
					</svg>
				</div>

				{/* Notebook Title */}
				<span className="text-xl font-normal text-white tracking-wide">
					BujhAI
				</span>
			</div>

			{/* RIGHT SECTION: Controls & Profile */}
			<div className="flex items-center gap-3">
				{/* Create Notebook Button */}
				<button className="flex items-center gap-2 bg-white hover:bg-[#e3e3e3] text-[#131314] py-2 px-5 rounded-full transition-colors text-sm font-medium">
					<Plus className="w-4 h-4 stroke-[3]" />
					Create
				</button>

				{/* Share Button */}
				<button className="flex items-center gap-2 bg-transparent hover:bg-[#282a2c] text-[#e3e3e3] border border-[#444746] py-2 px-4 rounded-full transition-colors text-sm font-medium">
					<Share2 className="w-4 h-4" />
					Share
				</button>

				{/* Settings Button */}
				<button className="flex items-center gap-2 bg-transparent hover:bg-[#282a2c] text-[#e3e3e3] border border-[#444746] py-2 px-4 rounded-full transition-colors text-sm font-medium">
					<Settings className="w-4 h-4" />
					Settings
				</button>

				{/* Google Apps Grid Icon */}
				<button className="text-[#c4c7c5] hover:bg-[#282a2c] p-2 rounded-full transition-colors ml-1">
					<Grip className="w-5 h-5" />
				</button>

				{/* User Profile Avatar */}
				<div className="w-8 h-8 rounded-full overflow-hidden ml-1 border border-transparent hover:border-[#444746] cursor-pointer transition-colors">
					<img
						src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
						alt="User profile"
						className="w-full h-full object-cover"
					/>
				</div>
			</div>
		</div>
	);
}
