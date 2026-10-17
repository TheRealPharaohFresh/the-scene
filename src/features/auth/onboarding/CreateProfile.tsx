import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  entertainmentRoles,
  type EntertainmentCategory,
} from "../../../data/entertainmentRoles";
import { usStates } from "../../../data/usStates";
import { fetchUserProfile, saveUserProfile } from "../../../services/firebase";
import { deletePhoto, photoList } from "../../../services/photos";
import PhotoManager from "../../photos/PhotoManager";
import {
  getCurrentUserId,
  hasCompletedProfile,
  markProfileComplete,
} from "../authService";
import type {
  GenderOption,
  LookingForOption,
  ShareableField,
  UserProfile,
} from "../../../types/profile";
import { SubmitButton } from "../../../components/ui/Button";
import {
  NicknameInput,
  BioInput,
  PortfolioInput,
  SocialMediaInput,
} from "../../../components/ui/Input";
import { GenderSelect, CategorySelect } from "../../../components/ui/Select";
import {
  CheckboxItem,
  RoleCheckbox,
  LookingForCheckbox,
} from "../../../components/ui/Checkbox";
import { DEFAULT_SHARED_FIELDS, fetchPublicSettings } from "../../../services/publicProfiles";

const lookingForOptions: LookingForOption[] = [
  "Friends",
  "Networking",
  "Relationship",
];
const socialFields = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "instagram.com/yourname",
  },
  { key: "tiktok", label: "TikTok", placeholder: "tiktok.com/@yourname" },
  { key: "youtube", label: "YouTube", placeholder: "youtube.com/channel/.." },
  { key: "twitter", label: "Twitter", placeholder: "twitter.com/yourhandle" },
  { key: "website", label: "Website", placeholder: "https://" },
] as const;

type SocialFieldKey = (typeof socialFields)[number]["key"];

type CreateProfileProps = {
  editMode?: boolean;
};

const shareOptions: { field: ShareableField; label: string }[] = [
  { field: "bio", label: "My bio" },
  { field: "location", label: "My city" },
  { field: "lookingFor", label: "What I'm looking for" },
  { field: "links", label: "My portfolio and social links" },
];

export default function CreateProfile({ editMode = false }: CreateProfileProps) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<GenderOption>("Prefer not to say");
  const [category, setCategory] = useState<EntertainmentCategory | "">("");
  const [roles, setRoles] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [socialMedia, setSocialMedia] = useState<
    Record<SocialFieldKey, string>
  >({
    instagram: "",
    tiktok: "",
    youtube: "",
    twitter: "",
    website: "",
  });
  const [lookingFor, setLookingFor] = useState<LookingForOption[]>([]);
  const [discoverable, setDiscoverable] = useState(true);
  const [shared, setShared] = useState<ShareableField[]>([...DEFAULT_SHARED_FIELDS]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(editMode);
  const [message, setMessage] = useState("");
  const [profileLoadError, setProfileLoadError] = useState("");
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);

  const currentRoles = useMemo(
    () => (category ? entertainmentRoles[category] : []),
    [category],
  );

  const selectedState = useMemo(
    () => usStates.find((state) => state.isoCode === stateCode),
    [stateCode],
  );

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      navigate("/login");
      return;
    }

    if (!editMode && hasCompletedProfile(userId)) {
      navigate("/discover");
      return;
    }

    if (!editMode) return;

    let mounted = true;
    void Promise.all([fetchUserProfile(userId), fetchPublicSettings(userId)])
      .then(([profile, savedSettings]) => {
        if (!mounted) return;
        if (!profile) {
          setMessage("No saved profile was found to edit. Create your profile first.");
          return;
        }

        setProfileLoadError("");
        setExistingProfile(profile);
        // Profiles saved before discovery existed have no public copy; keep them hidden until the owner opts in.
        setDiscoverable(savedSettings?.discoverable ?? false);
        if (savedSettings) setShared(savedSettings.shared);
        setNickname(profile.nickname ?? profile.displayName ?? "");
        setGender(profile.gender);
        setCategory(profile.entertainmentCategory ?? "");
        setRoles(profile.roles ?? []);
        setBio(profile.bio ?? "");
        setStateCode(profile.stateCode ?? "");
        setCity(profile.city ?? "");
        setPortfolioUrl(profile.portfolioUrl ?? "");
        setSocialMedia({
          instagram: profile.socialMedia?.instagram ?? "",
          tiktok: profile.socialMedia?.tiktok ?? "",
          youtube: profile.socialMedia?.youtube ?? "",
          twitter: profile.socialMedia?.twitter ?? "",
          website: profile.socialMedia?.website ?? "",
        });
        setLookingFor(profile.lookingFor ?? []);
        setPhotos(photoList(profile));
      })
      .catch((error: unknown) => {
        if (mounted) {
          setProfileLoadError(error instanceof Error ? error.message : "Unable to load your profile.");
        }
      })
      .finally(() => {
        if (mounted) setLoadingProfile(false);
      });

    return () => {
      mounted = false;
    };
  }, [editMode, navigate, profileLoadAttempt]);

  const handleRoleToggle = (role: string) => {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((selected) => selected !== role)
        : [...current, role],
    );
  };

  const handleSocialChange = (key: SocialFieldKey, value: string) => {
    setSocialMedia((current) => ({ ...current, [key]: value }));
  };

  const handleLookingForToggle = (option: LookingForOption) => {
    setLookingFor((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const userId = getCurrentUserId();
    if (!userId) {
      setMessage("No user session found. Please log in again.");
      navigate("/login");
      return;
    }

    if (!category) {
      setMessage("Please select an entertainment category.");
      return;
    }
    if (saving) return;

    const profile: UserProfile = {
      ...existingProfile,
      userId,
      displayName: nickname || "",
      nickname: nickname || undefined,
      gender,
      entertainmentCategory: category,
      roles,
      bio,
      location: [city.trim(), selectedState?.isoCode].filter(Boolean).join(", "),
      city: city.trim(),
      stateCode: selectedState?.isoCode ?? "",
      portfolioUrl,
      socialMedia,
      lookingFor,
      photos,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
    };

    try {
      setSaving(true);
      await saveUserProfile(userId, profile, { discoverable, shared });
      await Promise.all(removedPhotos.filter((url) => !photos.includes(url)).map(deletePhoto));
      setRemovedPhotos([]);
      markProfileComplete();
      setMessage(editMode ? "Profile updated." : "Profile saved. Taking you to Discover...");
      if (!editMode) {
        setTimeout(() => navigate("/discover"), 750);
      }
    } catch (error) {
      console.error("CreateProfile save error:", error);
      setMessage(error instanceof Error ? error.message : "Unable to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return <div role="status" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#F5F4F2" }}>Loading profile…</div>;
  }

  if (editMode && !existingProfile) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: 16, color: "#F5F4F2" }}>
        <p role={profileLoadError ? "alert" : "status"}>
          {profileLoadError || message || "Your profile could not be loaded."}
        </p>
        {profileLoadError ? (
          <button
            type="button"
            onClick={() => {
              setProfileLoadError("");
              setMessage("");
              setLoadingProfile(true);
              setProfileLoadAttempt((attempt) => attempt + 1);
            }}
          >
            Retry
          </button>
        ) : null}
        <button type="button" onClick={() => navigate("/discover")}>Back to Discover</button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(135deg, #050408 0%, #7727E9 45%, #F7326D 100%)",
        padding: "max(16px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))",
        boxSizing: "border-box",
        color: "#F5F4F2",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "0 auto",
          padding: "clamp(16px, 5vw, 28px)",
          boxSizing: "border-box",
          borderRadius: 24,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(245,244,242,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>
            {editMode ? "Edit your profile" : "Create your profile"}
          </h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Add a nickname, select your entertainment path, and tell the
            community what you are looking for.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <section style={{ display: "grid", gap: 16, marginBottom: 18 }}>
            <NicknameInput
              label="Nickname (optional)"
              value={nickname}
              onChange={setNickname}
              placeholder="Preferred name"
              maxLength={50}
            />
            <PhotoManager
              photos={photos}
              onChange={setPhotos}
              onRemove={(url) => setRemovedPhotos((current) => [...current, url])}
            />

            <GenderSelect
              value={gender}
              onChange={(value) => setGender(value as GenderOption)}
            />

            <CategorySelect
              value={category}
              onChange={(value) => {
                const selected = value as EntertainmentCategory | "";
                setCategory(selected);
                setRoles([]);
              }}
              categories={Object.keys(entertainmentRoles)}
            />
          </section>

          <section style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22 }}>Select roles</h2>
              <span style={{ opacity: 0.88 }}>{roles.length} selected</span>
            </div>
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {category ? (
                currentRoles.map((role) => (
                  <RoleCheckbox
                    key={role}
                    label={role}
                    checked={roles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                  />
                ))
              ) : (
                <p style={{ margin: 0, opacity: 0.8 }}>
                  Pick a category to see the role options.
                </p>
              )}
            </div>
          </section>

          <section style={{ display: "grid", gap: 16, marginBottom: 18 }}>
            <BioInput
              label="Bio (max 1500 characters)"
              value={bio}
              onChange={(value) => {
                if (value.length <= 1500) setBio(value);
              }}
              placeholder="Tell people who you are, what you do, and what you are looking for."
              maxLength={1500}
            />

            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
              }}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontWeight: 600,
                  }}
                >
                  State or territory
                  <select
                    value={stateCode}
                    onChange={(e) => {
                      setStateCode(e.target.value);
                      setCity("");
                    }}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                    }}
                  >
                    <option value="">Select State</option>

                    {usStates.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontWeight: 600,
                  }}
                >
                  City
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    disabled={!stateCode}
                    maxLength={100}
                    placeholder="Enter a city"
                    aria-label="City"
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                    }}
                  />
                </label>
              </div>

              <PortfolioInput
                label="Portfolio link"
                value={portfolioUrl}
                onChange={setPortfolioUrl}
                placeholder="https://yourportfolio.com"
                maxLength={2048}
              />
            </div>
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 22 }}>Social media</h2>
            <div style={{ display: "grid", gap: 14 }}>
              {socialFields.map(({ key, label, placeholder }) => (
                <SocialMediaInput
                  key={key}
                  name={`social-${key}-input`}
                  label={label}
                  value={socialMedia[key]}
                  onChange={(value) => handleSocialChange(key, value)}
                  placeholder={placeholder}
                  maxLength={2048}
                />
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 22 }}>
              What are you looking for?
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {lookingForOptions.map((option) => (
                <LookingForCheckbox
                  key={option}
                  label={option}
                  checked={lookingFor.includes(option)}
                  onChange={() => handleLookingForToggle(option)}
                />
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 18 }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 22 }}>Visibility</h2>
            <CheckboxItem
              name="discoverable-checkbox"
              label="Let other members find me in Discover"
              checked={discoverable}
              onChange={() => setDiscoverable((current) => !current)}
            />
            {discoverable ? (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: "0 0 6px", fontSize: 14 }}>
                  Always shown: nickname, category, roles, and state. Choose what else members can see:
                </p>
                {shareOptions.map(({ field, label }) => (
                  <CheckboxItem
                    key={field}
                    name={`share-${field}`}
                    label={label}
                    checked={shared.includes(field)}
                    onChange={() =>
                      setShared((current) =>
                        current.includes(field) ? current.filter((item) => item !== field) : [...current, field],
                      )
                    }
                  />
                ))}
              </div>
            ) : null}
            <p style={{ margin: "8px 0 0", opacity: 0.8, fontSize: 14 }}>
              Your email and gender always stay private. You can change this any time.
            </p>
          </section>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <SubmitButton disabled={saving}>{saving ? "Saving..." : editMode ? "Save changes" : "Save profile"}</SubmitButton>
            {saving ? (
              <span style={{ opacity: 0.9 }}>Saving profile...</span>
            ) : null}
            {message ? <span role="status" style={{ opacity: 0.85 }}>{message}</span> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
