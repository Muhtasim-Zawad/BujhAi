import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const COLORS = [
	"#3B82F6",
	"#10B981",
	"#F43F5E",
	"#F59E0B",
	"#8B5CF6",
	"#06B6D4",
	"#F97316",
	"#D946EF",
	"#84CC16",
	"#EC4899",
];

const BASE = `rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 4px, transparent 20px`;

const PATTERNS = [
	`repeating-linear-gradient(45deg, ${BASE})`,
	`repeating-linear-gradient(-45deg, ${BASE})`,
	`repeating-linear-gradient(0deg, ${BASE}), repeating-linear-gradient(90deg, ${BASE})`,
	`repeating-linear-gradient(45deg, ${BASE}), repeating-linear-gradient(-45deg, ${BASE})`,
	`repeating-conic-gradient(rgba(0,0,0,0.2) 0% 25%, transparent 0% 50%) 0px 0px / 20px 20px`,
	`radial-gradient(circle at 50% 50%, rgba(0,0,0,0.25) 4px, transparent 4px) 0px 0px / 20px 20px`,
];

function hashString(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash);
}

const MAX_DESCRIPTION_LENGTH = 30;

function truncate(text, max) {
	if (!text || text.length <= max) return text;
	return text.slice(0, max).trimEnd() + "...";
}

function pickColorAndPattern(title) {
	const hash = hashString(title || "");
	return {
		color: COLORS[hash % COLORS.length],
		pattern: PATTERNS[hash % PATTERNS.length],
	};
}

export function ProjectCard({
	title,
	description,
	badge,
	buttonText = "Open Project",
	onAction,
}) {
	const { color, pattern } = pickColorAndPattern(title);

	return (
		<Card className="relative mx-auto w-full max-w-sm pt-0">
			<div
				className="aspect-video w-full border-b-2 border-black"
				style={{ backgroundColor: color, backgroundImage: pattern }}
			/>
			<CardHeader>
				<CardAction>
					<Badge variant="secondary">{badge}</Badge>
				</CardAction>
				<CardTitle>{title}</CardTitle>
				<CardDescription>
					{truncate(description, MAX_DESCRIPTION_LENGTH)}
				</CardDescription>
			</CardHeader>
			<CardFooter>
				<Button className="w-full" onClick={onAction}>
					{buttonText}
				</Button>
			</CardFooter>
		</Card>
	);
}
