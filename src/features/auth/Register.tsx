import React, { useState } from 'react';
import { SubmitButton } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { registerUser } from './authService';

export default function Register() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [password, setPassword] = useState('');
	const [adultAttested, setAdultAttested] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	
	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (submitting) return;
		
		if (!username || !email || !firstName || !lastName || !password) {
			setError('Please fill in all fields.');
			return;
		}
		if (!adultAttested) {
			setError('You must confirm that you are at least 18 to create an account.');
			return;
		}

		try {
			setSubmitting(true);
			await registerUser({ username, email, firstName, lastName, password, adultAttested });
			navigate('/create-profile');
			setUsername('');
			setEmail('');
			setFirstName('');
			setLastName('');
			setPassword('');
		} catch (registerError) {
			setError(registerError instanceof Error ? registerError.message : 'Registration failed.');
		} finally {
			setSubmitting(false);
		}
	}
	return (
		<div
					style={{
						minHeight: '100dvh',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 23,
						background: 'linear-gradient(135deg, #050408 0%, #7727E9 45%, #F7326D 100%)',
						color: '#F5F4F2'
					}}
				>
					<div
						style={{
							width: '100%',
							maxWidth: 450,
							padding: '32px 28px',
							borderRadius: 24,
							background: 'rgba(255, 255, 255, 0.12)',
							backdropFilter: 'blur(14px)',
							WebkitBackdropFilter: 'blur(14px)',
							boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
							border: '1px solid rgba(245, 244, 242, 0.22)'
						}}
					>
						<h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800 }}>Register</h1>
						<p style={{ margin: '0 0 20px', color: '#F5F4F2', opacity: 0.9 }}>Create your account.</p>
						<form onSubmit={handleRegister}>
							<input
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Username"
								aria-label="Username"
								maxLength={30}
								required
								autoComplete="username"
								style={{
									display: 'block',
									width: '100%',
									marginBottom: 14,
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid rgba(245, 244, 242, 0.25)',
									background: 'rgba(5, 4, 8, 0.45)',
									color: '#F5F4F2',
									outline: 'none'
								}}
							/>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email"
								aria-label="Email"
								autoComplete="email"
								required
								style={{
									display: 'block',
									width: '100%',
									marginBottom: 14,
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid rgba(245, 244, 242, 0.25)',
									background: 'rgba(5, 4, 8, 0.45)',
									color: '#F5F4F2',
									outline: 'none'
								}}
							/>
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="First Name"
								aria-label="First name"
								maxLength={80}
								required
								style={{
									display: 'block',
									width: '100%',
									marginBottom: 14,
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid rgba(245, 244, 242, 0.25)',
									background: 'rgba(5, 4, 8, 0.45)',
									color: '#F5F4F2',
									outline: 'none'
								}}
							/>
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Last Name"
								aria-label="Last name"
								maxLength={80}
								required
								style={{
									display: 'block',
									width: '100%',
									marginBottom: 18,
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid rgba(245, 244, 242, 0.25)',
									background: 'rgba(5, 4, 8, 0.45)',
									color: '#F5F4F2',
									outline: 'none'
								}}
							/>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
								aria-label="Password"
								autoComplete="new-password"
								minLength={6}
								required
								style={{
									display: 'block',
									width: '100%',
									marginBottom: 18,
									padding: '12px 14px',
									borderRadius: 12,
									border: '1px solid rgba(245, 244, 242, 0.25)',
									background: 'rgba(5, 4, 8, 0.45)',
									color: '#F5F4F2',
									outline: 'none'
								}}
							/>
							<label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
								<input
									type="checkbox"
									checked={adultAttested}
									onChange={(e) => setAdultAttested(e.target.checked)}
									required
								/>
								<span>I confirm that I am at least 18 years old.</span>
							</label>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
								<SubmitButton disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</SubmitButton>
							</div>
							{error ? <p role="alert" style={{ color: '#F7326D', marginTop: 12 }}>{error}</p> : null}
							<p>Already have an account? <Link to="/login" style={{ color: '#F7326D', textDecoration: 'underline' }}>Login</Link></p>
						</form>
					</div>
				</div>
			);
}
