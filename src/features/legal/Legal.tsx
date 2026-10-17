import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

const section = { margin: "22px 0 6px", fontSize: 18 } as const;

function Page({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(135deg, #050408 0%, #3b1590 45%, #8f1d4d 100%)", color: "#F5F4F2" }}>
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "calc(20px + env(safe-area-inset-top)) 20px 40px", lineHeight: 1.55 }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
          ← Back
        </button>
        <h1>{title}</h1>
        <p style={{ opacity: 0.75, fontSize: 14 }}>
          Draft for the early-access launch. This is not legal advice and must be reviewed by a lawyer before public launch.
        </p>
        {children}
        <p style={{ marginTop: 28, fontSize: 14 }}>
          <Link to="/terms" style={{ color: "#F7326D" }}>Terms</Link> · <Link to="/privacy" style={{ color: "#F7326D" }}>Privacy</Link>
        </p>
      </main>
    </div>
  );
}

export function Terms() {
  return (
    <Page title="Terms of Use">
      <h2 style={section}>Who can use The Scene</h2>
      <p>You must be at least 18. The Scene is for entertainment creatives and industry professionals to connect, collaborate and meet.</p>
      <h2 style={section}>Your account and content</h2>
      <p>You are responsible for your account and for everything you post: profile details, photos, messages, forum posts, events and listings. Only post content you have the right to share. Don't post anything unlawful, hateful, sexually explicit, harassing, deceptive or that exposes someone else's private information.</p>
      <h2 style={section}>Conduct</h2>
      <p>No harassment, spam, impersonation, scams or fake casting calls. Don't ask members for money to be considered for a job. Report problems with the Report button and block anyone you don't want to hear from.</p>
      <h2 style={section}>Opportunities and meetups</h2>
      <p>Listings and events are posted by members and businesses. We review business accounts and listings but don't guarantee their accuracy or any job, booking or result. Meet in public places and use your own judgment.</p>
      <h2 style={section}>Moderation</h2>
      <p>We may remove content, limit features or suspend accounts that break these terms or put others at risk.</p>
      <h2 style={section}>Paid features</h2>
      <p>Paid plans are not available yet. Prices and terms will be shown before any purchase.</p>
      <h2 style={section}>Contact</h2>
      <p>Support contact: [to be added by the owner before launch].</p>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy Policy">
      <h2 style={section}>What we collect</h2>
      <p>Your email and sign-in details, your profile (name, category, roles, bio, state and city, links, photos), your likes, passes, matches and messages, forum activity, reports and blocks.</p>
      <h2 style={section}>What others can see</h2>
      <p>Your public profile is shown in Discover only if you turn discovery on, and only the fields you choose to share. Your email is never shown. Messages are visible only to you and the person you matched with. Event addresses are shown only to the host and members who RSVP going. Photos are visible to signed-in members.</p>
      <h2 style={section}>Your choices</h2>
      <p>You can edit your profile, change what you share, turn off discovery, remove photos and block or report members at any time.</p>
      <h2 style={section}>How it's stored</h2>
      <p>Data is stored with Google Firebase (Authentication, Firestore and Cloud Storage). Photos are resized and stripped of location metadata before upload.</p>
      <h2 style={section}>Deletion</h2>
      <p>Account deletion is not self-service yet. Contact support to request it. [Retention and deletion process to be finalized by the owner.]</p>
      <h2 style={section}>Contact</h2>
      <p>Privacy contact: [to be added by the owner before launch].</p>
    </Page>
  );
}
