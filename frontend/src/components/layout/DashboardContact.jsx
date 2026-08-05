import { useState } from "react";
import {
	Mail,
	Globe,
	ExternalLink,
	UserRound,
	Copy,
	Check,
} from "lucide-react";

const contacts = [
	{ label: "Email", value: "muhtasimzawad.jfcl@gmail.com", icon: Mail },
	{
		label: "Website",
		value: "https://muhtasim-zawad.github.io/muhtasim-zawad-portfolio/",
		icon: Globe,
	},
	{
		label: "GitHub",
		value: "https://github.com/Muhtasim-Zawad",
		icon: ExternalLink,
	},
	{
		label: "LinkedIn",
		value: "https://www.linkedin.com/in/mzawad/",
		icon: UserRound,
	},
];

function ContactCard({ label, value, icon: Icon }) {
	const [copied, setCopied] = useState(false);

	function displayText() {
		try {
			const url = new URL(value);
			if (url.hostname.includes("linkedin.com")) {
				return url.pathname.replace(/^\/in\//, "") || value;
			}
			if (url.hostname === "github.com") {
				return url.pathname.replace(/^\//, "") || value;
			}
			if (url.hostname.endsWith("github.io")) {
				return url.pathname.replace(/^\//, "");
			}
			return url.hostname.replace(/^www\./, "") + url.pathname;
		} catch {
			return value;
		}
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	}

	return (
		<div className="flex items-center gap-3 rounded border-2 border-black bg-card p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
			<Icon className="size-5 shrink-0 text-primary" />
			<div className="flex-1 min-w-0">
				<p className="text-xs text-muted-foreground">{label}</p>
				{value.startsWith("http") ? (
					<a
						href={value}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm font-medium truncate text-foreground underline decoration-foreground/40 underline-offset-2 hover:text-primary"
						title={`Open ${label}`}
					>
						{displayText()}
					</a>
				) : (
					<p className="text-sm font-medium truncate">{value}</p>
				)}
			</div>
			<button
				onClick={handleCopy}
				className="shrink-0 rounded border-2 border-black p-1.5 transition-all duration-200 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
				title="Copy"
			>
				{copied ? (
					<Check className="size-4 text-green-600" />
				) : (
					<Copy className="size-4" />
				)}
			</button>
		</div>
	);
}

export default function DashboardContact() {
	return (
		<div className="flex flex-col gap-8">
			<div>
				<h2 className="font-head text-2xl mb-4">Contact</h2>
				<p className="text-muted-foreground">
					Built with care. If you'd like to work together or just say hi, reach
					out.
				</p>
			</div>
			<div className="flex flex-col gap-6 md:flex-row md:items-stretch">
				<div className="shrink-0 w-full md:w-64 rounded border-2 border-black bg-muted flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<span className="text-sm text-muted-foreground">Photo</span>
				</div>
				<div className="flex-1 flex flex-col gap-4">
					<p className="text-sm text-muted-foreground leading-relaxed">
						Hi, I'm a full-stack developer passionate about building tools that
						make learning easier and more interactive. I built BujhAI to explore
						how AI can act as a personal tutor — guiding students through
						materials, checking understanding, and adapting to their pace. The
						project is open-source and always evolving. Whether you have
						feedback, a collaboration idea, or just want to say hi, I'd love to
						hear from you. Let's build something meaningful together.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{contacts.map((c) => (
							<ContactCard key={c.label} {...c} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
