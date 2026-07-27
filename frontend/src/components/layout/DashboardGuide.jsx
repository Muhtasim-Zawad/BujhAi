export default function DashboardGuide() {
	return (
		<div className="flex flex-col gap-8">
			<div>
				<h2 className="font-head text-2xl mb-4">How to Use BujhAI</h2>
				<p className="text-muted-foreground">Two ways to use the platform, depending on your role.</p>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="flex flex-col gap-4 rounded border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<h3 className="font-head text-lg">For Learners</h3>
					<p className="text-sm text-muted-foreground">
						Learn at your own pace with AI-guided materials.
					</p>
					<ol className="flex flex-col gap-3 list-decimal list-inside mt-2">
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Create a Project</span>
							<p className="mt-0.5 text-muted-foreground">
								Click "New Project" in the navbar to create your first learning project.
							</p>
						</li>
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Upload Materials</span>
							<p className="mt-0.5 text-muted-foreground">
								Upload PDFs or documents. BujhAI indexes them and generates modules and resources automatically.
							</p>
						</li>
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Chat with the AI Tutor</span>
							<p className="mt-0.5 text-muted-foreground">
								Ask questions about your materials. The evaluator checks your understanding and the tutor guides you.
							</p>
						</li>
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Track Your Progress</span>
							<p className="mt-0.5 text-muted-foreground">
								Module points track what you've learned. Complete all points to finish.
							</p>
						</li>
					</ol>
				</div>
				<div className="flex flex-col gap-4 rounded border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<h3 className="font-head text-lg">For Teachers</h3>
					<p className="text-sm text-muted-foreground">
						Create a project, invite students, and monitor their progress.
					</p>
					<ol className="flex flex-col gap-3 list-decimal list-inside mt-2">
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Create a Project</span>
							<p className="mt-0.5 text-muted-foreground">
								Set up a project with your learning materials and modules.
							</p>
						</li>
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Share the Join Code</span>
							<p className="mt-0.5 text-muted-foreground">
								Each project has a unique join code. Share it with your students so they can enroll.
							</p>
						</li>
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Students Join & Learn</span>
							<p className="mt-0.5 text-muted-foreground">
								Students enter the join code to access the project, upload materials, and chat with the AI tutor.
							</p>
						</li>
						<li className="pl-2 text-sm">
							<span className="font-semibold text-foreground">Track Progress in Stats</span>
							<p className="mt-0.5 text-muted-foreground">
								Use the Stats tab to see how many materials each student has uploaded and which module points they've completed.
							</p>
						</li>
					</ol>
				</div>
			</div>
		</div>
	);
}
