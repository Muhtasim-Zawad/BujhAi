import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Mail, Lock, User, MailCheck } from "lucide-react";

export default function AuthPage() {
	const navigate = useNavigate();
	const { user } = useSession();
	const [mode, setMode] = useState("signin");
	const [showPassword, setShowPassword] = useState(false);
	const [form, setForm] = useState({ name: "", email: "", password: "" });
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [confirmed, setConfirmed] = useState(false);

	if (user) {
		navigate("/dashboard");
		return null;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");
		if (!form.email || !form.password) return;
		if (mode === "signup" && !form.name) return;

		setSubmitting(true);
		try {
			if (mode === "signup") {
				const { data, error } = await supabase.auth.signUp({
					email: form.email,
					password: form.password,
					options: { data: { full_name: form.name } },
				});
				if (error) throw error;
				if (data.session) {
					navigate("/dashboard");
				} else {
					setConfirmed(true);
				}
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email: form.email,
					password: form.password,
				});
				if (error) throw error;
				navigate("/dashboard");
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	}

	if (confirmed) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-4">
				<div className="w-full max-w-md rounded-2xl border-2 border-black bg-card p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-100">
						<MailCheck className="size-6 text-emerald-600" />
					</div>
					<h1 className="font-head text-2xl font-extrabold tracking-tight">
						Check your email
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						We sent a confirmation link to{" "}
						<span className="font-medium text-foreground">{form.email}</span>.
						Click it to activate your account, then sign in.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md rounded-2xl border-2 border-black bg-card p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-black">
						<div className="size-3 rounded-full bg-yellow-400" />
					</div>
					<h1 className="font-head text-2xl font-extrabold tracking-tight">
						Welcome to BujhAI
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{mode === "signin"
							? "Sign in to continue learning"
							: "Create an account to get started"}
					</p>
				</div>

				<div className="mb-6 flex rounded-xl border-2 border-black bg-background p-1">
					<button
						onClick={() => setMode("signin")}
						className={cn(
							"flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer",
							mode === "signin"
								? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Sign In
					</button>
					<button
						onClick={() => setMode("signup")}
						className={cn(
							"flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer",
							mode === "signup"
								? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Sign Up
					</button>
				</div>

				{error && (
					<div className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 p-3 text-sm text-red-600">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					{mode === "signup" && (
						<div>
							<label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
								Name
							</label>
							<div className="relative">
								<User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<input
									type="text"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									placeholder="Your name"
									className="w-full rounded-xl border-2 border-black bg-white py-2.5 pl-10 pr-3 text-sm outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none"
								/>
							</div>
						</div>
					)}

					<div>
						<label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Email
						</label>
						<div className="relative">
							<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<input
								type="email"
								value={form.email}
								onChange={(e) => setForm({ ...form, email: e.target.value })}
								placeholder="you@example.com"
								className="w-full rounded-xl border-2 border-black bg-white py-2.5 pl-10 pr-3 text-sm outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none"
							/>
						</div>
					</div>

					<div>
						<label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Password
						</label>
						<div className="relative">
							<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<input
								type={showPassword ? "text" : "password"}
								value={form.password}
								onChange={(e) => setForm({ ...form, password: e.target.value })}
								placeholder="Enter your password"
								className="w-full rounded-xl border-2 border-black bg-white py-2.5 pl-10 pr-10 text-sm outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
							>
								{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
							</button>
						</div>
					</div>

					<Button
						type="submit"
						size="lg"
						disabled={submitting}
						className="mt-2 w-full border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none"
					>
						{submitting
							? "Please wait..."
							: mode === "signin"
								? "Sign In"
								: "Create Account"}
					</Button>
				</form>

				<p className="mt-6 text-center text-xs text-muted-foreground">
					{mode === "signin" ? (
						<>
							Don't have an account?{" "}
							<button
								onClick={() => setMode("signup")}
								className="font-semibold text-primary hover:underline cursor-pointer"
							>
								Sign up
							</button>
						</>
					) : (
						<>
							Already have an account?{" "}
							<button
								onClick={() => setMode("signin")}
								className="font-semibold text-primary hover:underline cursor-pointer"
							>
								Sign in
							</button>
						</>
					)}
				</p>
			</div>
		</div>
	);
}
