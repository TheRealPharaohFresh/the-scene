import './Button.css';
import type { ReactNode } from 'react';

type ButtonProps = {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  children?: ReactNode;
};

export function LoginButton({ onClick, disabled, children }: ButtonProps) {
    return <button className="login-button" onClick={onClick} type="submit" disabled={disabled}>{children ?? 'Login'}</button>;
}

export function RegisterButton({ onClick }: ButtonProps) {
    return <button className="register-button" onClick={onClick} type="button">Sign Up</button>;
}

export function LogoutButton({ onClick, }: ButtonProps) {
    return <button className="logout-button" onClick={onClick} type="button">Logout</button>;
}

export function SubmitButton({ onClick, disabled, children }: ButtonProps) {
    return <button className="submit-button" onClick={onClick} type="submit" disabled={disabled}>{children ?? 'Submit'}</button>;
}

export function CancelButton({ onClick}: ButtonProps) {
    return <button className="cancel-button" onClick={onClick} type="button">Cancel</button>;
}

export function SendButton({ onClick, }: ButtonProps) {
    return <button className="send-button" onClick={onClick} type="submit">Send</button>;
}

export function DiscoverButton({ onClick, }: ButtonProps) {
    return <button className="discover-button" onClick={onClick} type="button">Discover</button>;
}
