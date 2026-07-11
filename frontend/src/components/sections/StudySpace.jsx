import { useState } from "react";
import ChatLeftSidebar from "@/components/layout/ChatLeftSidebar";
import ChatInterface from "@/components/layout/ChatInterface";
import ChatRightSidebar from "@/components/layout/ChatRightSidebar";
import Materials from "@/components/layout/Materials";
import Stats from "@/components/layout/Stats";

export default function StudySpace() {
	const [activeSection, setActiveSection] = useState("materials");

	return (
		<div className="flex h-full gap-4 p-4">
			<ChatLeftSidebar
				activeSection={activeSection}
				onSectionChange={setActiveSection}
			/>

			{activeSection === "materials" && (
				<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<Materials />
				</div>
			)}

			{activeSection === "study" && (
				<>
					<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<ChatInterface />
					</div>
					<ChatRightSidebar />
				</>
			)}

			{activeSection === "stats" && (
				<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<Stats />
				</div>
			)}
		</div>
	);
}
