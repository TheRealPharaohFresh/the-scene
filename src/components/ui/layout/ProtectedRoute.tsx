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

	useEffect(() => {
		let unsubscribe: (() => void) | undefined;

		(async () => {
			unsubscribe = await listenForAuthState((user) => {
				setUserId(user?.uid ?? null);
				setAuthReady(true);
			});
		})();

		return () => {
			unsubscribe?.();
		};
	}, []);

	if (!authReady) {
		return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#F5F4F2" }}>Loading…</div>;
	}

	const currentUserId = userId ?? getCurrentUserId();
	if (!currentUserId) {
		return <Navigate to="/login" replace />;
	}

	if (requireProfileComplete && !hasCompletedProfile()) {
		return <Navigate to="/create-profile" replace />;
	}

	// Authorized
	return <>{children}</>;
}

