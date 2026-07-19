import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatLeftSidebar from "@/components/layout/ChatLeftSidebar";
import ChatInterface from "@/components/layout/ChatInterface";
import ChatRightSidebar from "@/components/layout/ChatRightSidebar";
import Materials from "@/components/layout/Materials";
import Stats from "@/components/layout/Stats";

export default function StudySpace() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [activeSection, setActiveSection] = useState("materials");
	const projectId = id;

	return (
		<div className="flex h-screen gap-4 p-4">
			<ChatLeftSidebar
				activeSection={activeSection}
				onSectionChange={setActiveSection}
				onBack={() => navigate("/dashboard")}
			/>

			{activeSection === "materials" && (
				<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<Materials projectId={projectId} />
				</div>
			)}

			{activeSection === "study" && (
				<>
					<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<ChatInterface projectId={projectId} />
					</div>
					<ChatRightSidebar projectId={projectId} />
				</>
			)}

			{activeSection === "stats" && (
				<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<Stats projectId={projectId} />
				</div>
			)}
		</div>
	);
}
