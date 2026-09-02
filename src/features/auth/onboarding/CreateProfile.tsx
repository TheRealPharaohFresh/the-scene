import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  entertainmentRoles,
  type EntertainmentCategory,
} from "../../../data/entertainmentRoles";
import { saveUserProfile } from "../../../services/firebase";
import {
  getCurrentUserId,
  hasCompletedProfile,
  markProfileComplete,
} from "../authService";
import type {
  GenderOption,
  LookingForOption,
  SocialMediaLinks,
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
  RoleCheckbox,
  LookingForCheckbox,
} from "../../../components/ui/Checkbox";
import { State, City } from "country-state-city";

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

export default function CreateProfile() {
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currentRoles = useMemo(
    () => (category ? entertainmentRoles[category] : []),
    [category],
  );

  const states = useMemo(() => State.getStatesOfCountry("US"), []);

  const cities = useMemo(() => {
    if (!stateCode) return [];
    return City.getCitiesOfState("US", stateCode);
  }, [stateCode]);

  const selectedState = useMemo(
  () => states.find((state) => state.isoCode === stateCode),
  [states, stateCode]
);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      navigate("/login");
      return;
    }

    if (hasCompletedProfile()) {
      navigate("/dashboard");
    }
  }, [navigate]);

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

    const profile: UserProfile = {
      userId,
      displayName: nickname || "",
      nickname: nickname || undefined,
      gender,
      entertainmentCategory: category,
      roles,
      bio,
      location: `${city}, ${selectedState?.name ?? ""}`,
      city,
      stateCode: selectedState?.isoCode ?? "",
      portfolioUrl,
      socialMedia: socialMedia as SocialMediaLinks,
      lookingFor,
      createdAt: new Date().toISOString(),
    };

    try {
      setSaving(true);
      await saveUserProfile(userId, profile);
      markProfileComplete();
      setMessage("Profile saved. Redirecting to your dashboard...");
      setTimeout(() => navigate("/dashboard"), 750);
    } catch (error) {
      console.error("CreateProfile save error:", error);
      setMessage(error instanceof Error ? error.message : "Unable to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #050408 0%, #7727E9 45%, #F7326D 100%)",
        padding: 24,
        color: "#F5F4F2",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "0 auto",
          padding: 28,
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
            Create your profile
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
            />
            <div
              style={{
                padding: "14px 16px",
                border: "1px solid rgba(245,244,242,0.2)",
                borderRadius: 12,
                background: "rgba(5,4,8,0.24)",
                opacity: 0.85,
              }}
            >
              Photo uploads are temporarily unavailable. You can add your
              profile and cover photos after storage is enabled.
            </div>

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
            />

            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "1fr 1fr",
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
                  State
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

                    {states.map((state) => (
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
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!stateCode}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                    }}
                  >
                    <option value="">Select City</option>

                    {cities.map((cityOption) => (
                      <option key={cityOption.name} value={cityOption.name}>
                        {cityOption.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <PortfolioInput
                label="Portfolio link"
                value={portfolioUrl}
                onChange={setPortfolioUrl}
                placeholder="https://yourportfolio.com"
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <SubmitButton />
            {saving ? (
              <span style={{ opacity: 0.9 }}>Saving profile...</span>
            ) : null}
            {message ? <span style={{ opacity: 0.85 }}>{message}</span> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
