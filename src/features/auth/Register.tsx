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
	const [error, setError] = useState('');
	const navigate = useNavigate();
	
	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		console.log('Register attempt with:', { username, email, firstName, lastName, password });
		
		if (!username || !email || !firstName || !lastName || !password) {
			setError('Please fill in all fields.');
			return;
		}

		try {
			await registerUser({ username, email, firstName, lastName, password });
			navigate('/create-profile');
			setUsername('');
			setEmail('');
			setFirstName('');
			setLastName('');
			setPassword('');
		} catch (registerError) {
			setError(registerError instanceof Error ? registerError.message : 'Registration failed.');
		}
	}
	return (
		<div
					style={{
						minHeight: '100vh',
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
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
								<SubmitButton/>
							</div>
							{error ? <p style={{ color: '#F7326D', marginTop: 12 }}>{error}</p> : null}
							<p>Already have an account? <Link to="/login" style={{ color: '#F7326D', textDecoration: 'underline' }}>Login</Link></p>
						</form>
					</div>
				</div>
			);
}
