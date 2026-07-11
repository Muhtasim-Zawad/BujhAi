import { useState } from "react";
import { cn } from "@/lib/utils";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";

const resultsData = [
	{
		title: "Overall Score",
		remark: "Excellent",
		info: "You scored in the top 15% of all participants across all assessments.",
	},
	{
		title: "Completion Rate",
		remark: "85%",
		info: "You completed 17 out of 20 assigned modules on schedule.",
	},
	{
		title: "Accuracy",
		remark: "92%",
		info: "Your average accuracy across all quizzes and assignments.",
	},
];

const comparisonData = [
	{
		title: "Module 1: Algebra Basics",
		current: { score: 88, completion: 90, time: "4h" },
		previous: { score: 72, completion: 75, time: "5h" },
	},
	{
		title: "Module 2: Geometry",
		current: { score: 82, completion: 85, time: "3.5h" },
		previous: { score: 78, completion: 80, time: "4h" },
	},
	{
		title: "Module 3: Statistics",
		current: { score: 91, completion: 95, time: "3h" },
		previous: { score: 70, completion: 70, time: "4.5h" },
	},
];

const resourcesData = [
	{
		title: "Study Guide",
		content:
			"Comprehensive guide covering all key topics and concepts for the course. Includes summaries, diagrams, and practice questions to reinforce your understanding.",
	},
	{
		title: "Video Tutorials",
		content:
			"Step-by-step video walkthroughs for each module. Covers fundamental concepts through advanced topics with real-world examples.",
	},
	{
		title: "Practice Tests",
		content:
			"Sample tests with answer keys to help you prepare. Each test includes detailed explanations for every question to help you learn from mistakes.",
	},
];

export default function Stats() {
	const [section, setSection] = useState("results");

	return (
		<div className="flex flex-col gap-6 p-4">
			{/* Welcome message */}
			<div className="flex flex-col gap-1">
				<h1 className="font-head text-2xl tracking-tight">
					Your Stats Overview
				</h1>
				<p className="text-sm text-muted-foreground">
					Track your progress, compare results, and access learning
					resources.
				</p>
			</div>

			{/* Toggle buttons */}
			<div className="flex gap-2">
				{["results", "comparison", "resources"].map((tab) => (
					<button
						key={tab}
						onClick={() => setSection(tab)}
						className={cn(
							"inline-flex items-center justify-center gap-1 rounded border-2 text-sm font-head font-medium whitespace-nowrap shadow-sm transition-all duration-200 px-3 py-1 h-8 cursor-pointer",
							section === tab
								? "bg-primary text-primary-foreground border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								: "bg-background border-black hover:bg-accent hover:translate-y-0.5 active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
						)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
				))}
			</div>

			{/* Results */}
			{section === "results" && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{resultsData.map((item) => (
						<Card key={item.title}>
							<CardHeader>
								<CardTitle>{item.title}</CardTitle>
								<CardDescription>{item.remark}</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									{item.info}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Comparison */}
			{section === "comparison" && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{comparisonData.map((item) => (
						<Card key={item.title}>
							<CardHeader>
								<CardTitle>{item.title}</CardTitle>
								<CardDescription>
									Current vs Previous attempt
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-2">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											Score
										</span>
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground line-through">
												{item.previous.score}
											</span>
											<span className="font-medium">
												{item.current.score}
											</span>
											<span
												className={
													item.current.score >=
													item.previous.score
														? "text-xs text-green-600"
														: "text-xs text-destructive"
												}
											>
												{item.current.score >=
												item.previous.score
													? `+${
															item.current.score -
															item.previous.score
														}`
													: item.current.score -
														item.previous.score}
											</span>
										</div>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											Completion
										</span>
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground line-through">
												{item.previous.completion}%
											</span>
											<span className="font-medium">
												{item.current.completion}%
											</span>
											<span
												className={
													item.current.completion >=
													item.previous.completion
														? "text-xs text-green-600"
														: "text-xs text-destructive"
												}
											>
												{item.current.completion >=
												item.previous.completion
													? `+${
															item.current
																.completion -
															item.previous
																.completion
														}%`
													: `${item.current.completion - item.previous.completion}%`}
											</span>
										</div>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											Time
										</span>
										<div className="flex items-center gap-2">
											<span className="text-muted-foreground line-through">
												{item.previous.time}
											</span>
											<span className="font-medium">
												{item.current.time}
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Resources */}
			{section === "resources" && (
				<Accordion>
					{resourcesData.map((item) => (
						<AccordionItem key={item.title}>
							<AccordionTrigger>{item.title}</AccordionTrigger>
							<AccordionContent>
								<p className="text-sm">{item.content}</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			)}
		</div>
	);
}
