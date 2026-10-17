import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUserId, hasCompletedProfile, listenForAuthState } from "../../../features/auth/authService";

type Props = {
	children: React.ReactNode;
	requireProfileComplete?: boolean;
};

export default function ProtectedRoute({ children, requireProfileComplete = true }: Props) {
	const [authReady, setAuthReady] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const [authError, setAuthError] = useState("");
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		let unsubscribe: (() => void) | undefined;
		let mounted = true;

		void listenForAuthState((user) => {
			if (!mounted) return;
				setUserId(user?.uid ?? null);
				setAuthError(user?.profileStatusError ?? "");
				setAuthReady(true);
		}).then((stopListening) => {
			if (mounted) unsubscribe = stopListening;
			else stopListening();
		}).catch((error: unknown) => {
			if (!mounted) return;
			setAuthError(error instanceof Error ? error.message : "Unable to verify your sign-in status.");
			setAuthReady(true);
		});

		return () => {
			mounted = false;
			unsubscribe?.();
		};
	}, [retryCount]);

	if (!authReady) {
		return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#F5F4F2" }}>Loading…</div>;
	}

	if (authError) {
		return (
			<div role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#F5F4F2" }}>
				<p>{authError}</p>
				<button
					type="button"
					onClick={() => {
						setAuthError("");
						setAuthReady(false);
						setRetryCount((count) => count + 1);
					}}
				>
					Retry
				</button>
			</div>
		);
	}

	const currentUserId = userId ?? getCurrentUserId();
	if (!currentUserId) {
		return <Navigate to="/login" replace />;
	}

	if (requireProfileComplete && !hasCompletedProfile(currentUserId)) {
		return <Navigate to="/create-profile" replace />;
	}

	// Authorized
	return <>{children}</>;
}
