import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUserId, hasCompletedProfile } from "../../../features/auth/authService";

type Props = {
	children: React.ReactNode;
	requireProfileComplete?: boolean;
};

export default function ProtectedRoute({ children, requireProfileComplete = true }: Props) {
	const userId = getCurrentUserId();
	if (!userId) {
		return <Navigate to="/login" replace />;
	}

	if (requireProfileComplete && !hasCompletedProfile()) {
		return <Navigate to="/create-profile" replace />;
	}

	// Authorized
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
}

