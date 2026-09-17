import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../../../convex/_generated/api";
import { getErrorMessage } from "../../lib/errors";
import { clearByokSession, getByokSession, setByokSession } from "../../lib/byokSession";
import { CharacterCustomizer } from "../teams/CharacterCustomizer";
import type { SpellType } from "../../lib/character";

const SKILL_CATEGORIES = {
  Creative: [
    "Graphic Design", "Illustration", "Typography", "Layout", "Branding",
    "UI Design", "UX Design", "Interaction Design", "Photography", "Videography",
    "Video Editing", "Motion Graphics", "2D Animation", "3D Animation",
    "Storyboarding", "Sound Design", "Scriptwriting",
  ],
  "Research / Strategy": [
    "User Research", "Market Research", "Academic Research", "Competitor Analysis",
    "Data Analysis", "Survey Design", "Interviewing", "Strategy", "Campaign Planning",
  ],
  General: [
    "Writing", "Copywriting", "Presentation", "Public Speaking", "Communication",
    "Organisation", "Project Management", "Leadership", "Documentation",
  ],
} as const;

const SOFTWARE_SKILLS = [
  "Photoshop", "Illustrator", "InDesign", "Figma", "After Effects", "Premiere Pro",
  "Blender", "Maya", "Cinema 4D", "Procreate", "DaVinci Resolve", "HTML/CSS",
  "JavaScript", "React", "GitHub", "Excel", "PowerPoint", "Canva",
];

const RECOMMENDED_SKILLS = [
  "Communication", "Organisation", "Project Management", "Presentation",
  "User Research", "UI Design", "UX Design", "Writing",
];
const ALL_GENERAL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

const CAPACITY_OPTIONS = [
  { value: 4, label: "Under 5 hours" },
  { value: 8, label: "5–10 hours" },
  { value: 13, label: "10–15 hours" },
  { value: 18, label: "15–20 hours" },
  { value: 24, label: "20+ hours" },
] as const;

function toggleInList(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function SkillPicker({
  skills,
  softwareSkills,
  onSkillsChange,
  onSoftwareSkillsChange,
}: {
  skills: string[];
  softwareSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  onSoftwareSkillsChange: (skills: string[]) => void;
}) {
  const [mode, setMode] = useState<"recommended" | "search" | "all" | "other">("recommended");
  const [query, setQuery] = useState("");
  const [other, setOther] = useState("");
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [...ALL_GENERAL_SKILLS, ...SOFTWARE_SKILLS]
      .filter((skill) => skill.toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [query]);

  function toggle(skill: string) {
    if (SOFTWARE_SKILLS.includes(skill as (typeof SOFTWARE_SKILLS)[number])) {
      onSoftwareSkillsChange(toggleInList(softwareSkills, skill));
    } else {
      onSkillsChange(toggleInList(skills, skill));
    }
  }

  function addOther() {
    const cleaned = other.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!cleaned || skills.some((skill) => skill.toLowerCase() === cleaned.toLowerCase())) return;
    onSkillsChange([...skills, cleaned]);
    setOther("");
  }

  const choices = mode === "recommended"
    ? RECOMMENDED_SKILLS
    : mode === "search"
      ? searchResults
      : [];

  return (
    <div className="profile-skill-picker">
      <div className="profile-skill-toolbar" role="tablist" aria-label="Skill picker views">
        {(["recommended", "search", "all", "other"] as const).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={mode === item} className={mode === item ? "is-active" : ""} onClick={() => setMode(item)}>
            {item === "all" ? "View All" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {mode === "search" ? (
        <label className="profile-skill-search"><span>Search skills</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Figma, writing, research…" /></label>
      ) : null}
      {mode === "other" ? (
        <div className="profile-other-skill"><label><span>Other skill</span><input value={other} maxLength={60} onChange={(event) => setOther(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addOther(); } }} /></label><button className="quiet-button" type="button" onClick={addOther}>Add skill</button></div>
      ) : null}
      {mode === "all" ? (
        <div className="profile-skill-categories">
          {Object.entries(SKILL_CATEGORIES).map(([category, categorySkills]) => (
            <section key={category}><h4>{category}</h4><div className="profile-skill-options">{categorySkills.map((skill) => <button key={skill} type="button" className={skills.includes(skill) ? "is-selected" : ""} aria-pressed={skills.includes(skill)} onClick={() => toggle(skill)}>{skill}</button>)}</div></section>
          ))}
          <section><h4>Software</h4><div className="profile-skill-options">{SOFTWARE_SKILLS.map((skill) => <button key={skill} type="button" className={softwareSkills.includes(skill) ? "is-selected" : ""} aria-pressed={softwareSkills.includes(skill)} onClick={() => toggle(skill)}>{skill}</button>)}</div></section>
        </div>
      ) : null}
      {mode === "recommended" || mode === "search" ? (
        <div className="profile-skill-options">{choices.length ? choices.map((skill) => { const selected = skills.includes(skill) || softwareSkills.includes(skill); return <button key={skill} type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => toggle(skill)}>{skill}</button>; }) : <p>{mode === "search" ? "Type a skill to search." : "No recommendations available."}</p>}</div>
      ) : null}
      <div className="selected-profile-skills" aria-live="polite">
        {[...skills, ...softwareSkills].map((skill) => <button key={skill} type="button" aria-label={`Remove ${skill}`} onClick={() => toggle(skill)}><span>{skill}</span><X aria-hidden="true" /></button>)}
      </div>
    </div>
  );
}

export function ProfileCenter({
  character,
  setupRequired = false,
}: {
  character?: ReactNode;
  setupRequired?: boolean;
}) {
  const profile = useQuery(api.profiles.getOrNull);
  const saveProfile = useMutation(api.profiles.saveCurrent);
  const deleteAccount = useMutation(api.profiles.deleteCurrentAccount);
  const { signOut } = useAuthActions();
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [softwareSkills, setSoftwareSkills] = useState<string[]>(profile?.softwareSkills ?? []);
  const [weeklyCapacity, setWeeklyCapacity] = useState(profile?.weeklyCapacity ?? 8);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profileHydrated = useRef(false);
  const initialByok = getByokSession();
  const [useOwnKey, setUseOwnKey] = useState(initialByok !== null);
  const [apiKey, setApiKey] = useState(initialByok?.apiKey ?? "");
  const [model, setModel] = useState(initialByok?.model ?? "deepseek/deepseek-chat");

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Permanently Delete Account?\n\nAre you sure you want to permanently delete your account and all associated data?\nThis action cannot be undone. You will be signed out immediately."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      const tourKeys = [
        "maylamdi_tour_lobby_done",
        "maylamdi_tour_confirm_done",
        "maylamdi_tour_dashboard_done",
        "maylamdi_tour_workspace_done",
      ];
      for (const key of tourKeys) {
        try {
          localStorage.removeItem(key);
        } catch {}
      }
      clearByokSession();
      await signOut();
      window.location.href = "/";
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not delete account."));
      setIsDeleting(false);
    }
  }

  /* Realtime profile data arrives after the first render; hydrate once without
     overwriting edits made while the save request is in flight. */
  useEffect(() => {
    if (!profile || profileHydrated.current) return;
    profileHydrated.current = true;
    setSkills(profile.skills ?? []);
    setSoftwareSkills(profile.softwareSkills ?? []);
    setWeeklyCapacity(profile.weeklyCapacity ?? 8);
  }, [profile]);

  useEffect(() => {
    if (useOwnKey && apiKey.trim() && model.trim()) setByokSession({ apiKey, model });
    else clearByokSession();
  }, [apiKey, model, useOwnKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveProfile({ skills, softwareSkills, weeklyCapacity });
      setMessage("Profile saved. You can now create or join a project.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Your profile could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="profile-page profile-center" aria-labelledby="profile-page-title">
      <header className="focused-page-heading">
        <div className="focused-heading-stack">
          <p className="kicker">{setupRequired ? "Required first step" : "Profile"}</p>
          <h1 className="display-heading" id="profile-page-title">
            {setupRequired ? "Complete your profile" : "How you work"}
          </h1>
          <p className="profile-subtext">Your saved skills and weekly capacity inform task owner suggestions.</p>
        </div>
      </header>

      <form className="profile-setup-form" onSubmit={submit}>
        <section className="profile-basic-card" aria-labelledby="basic-profile-title">
          <div className="profile-identity">
            {profile?.imageUrl ? (
              <img src={profile.imageUrl} alt="" />
            ) : (
              <span className="member-avatar">{profile?.displayName.slice(0, 1).toUpperCase()}</span>
            )}
            <div className="profile-identity-text">
              <p className="card-eyebrow">Google profile</p>
              <h2 id="basic-profile-title" className="profile-user-name">{profile?.displayName}</h2>
              <span className="profile-user-email">{profile?.email}</span>
            </div>
          </div>
          <details className="compact-character-settings">
            <summary>Customise my character avatar</summary>
            {profile ? (
              <CharacterCustomizer
                member={{
                  displayName: profile.displayName,
                  characterFill: profile.characterFill ?? "#FFF73F",
                  characterOutline: profile.characterOutline ?? "#4CA0FE",
                  spellType: profile.spellType as SpellType | undefined,
                }}
              />
            ) : null}
          </details>
        </section>

        <section className="profile-settings-card" aria-labelledby="work-profile-title">
          <p className="card-eyebrow">Reusable preferences</p>
          <h2 id="work-profile-title">Tell your team how you work</h2>
          <SkillPicker
            skills={skills}
            softwareSkills={softwareSkills}
            onSkillsChange={setSkills}
            onSoftwareSkillsChange={setSoftwareSkills}
          />
        </section>

        <section className="profile-settings-card" aria-labelledby="capacity-title">
          <p className="card-eyebrow">Weekly capacity</p>
          <h2 id="capacity-title">How much time can you contribute each week?</h2>
          <p className="card-description">Used to avoid giving one teammate significantly more work than they can manage.</p>
          <div className="capacity-options">
            {CAPACITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={weeklyCapacity === option.value ? "is-selected" : ""}
                aria-pressed={weeklyCapacity === option.value}
                onClick={() => setWeeklyCapacity(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <div className="profile-form-actions">
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="form-success" role="status">{message}</p> : null}
          <button className="primary-button profile-save-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save My Profile"}
          </button>
        </div>
      </form>

      {!setupRequired ? (
        <div className="profile-context-settings">
          <section className="profile-subscription-link-card">
            <div>
              <p className="card-eyebrow">Subscription</p>
              <h2>Plan and AI access</h2>
              <p>See your current plan, compare Free and MayLamDi+, or review what each plan includes.</p>
            </div>
            <Link to="/subscription">Manage subscription →</Link>
          </section>
          <details className="profile-secondary-settings">
            <summary>AI settings</summary>
            <section className="profile-settings-card ai-settings-card">
              <label className="toggle-field">
                <input type="checkbox" checked={useOwnKey} onChange={(event) => setUseOwnKey(event.target.checked)} />
                <span>Use my own AI key for this session</span>
              </label>
              <div className="guided-field-grid">
                <label>
                  <span>OpenRouter API Key</span>
                  <input disabled={!useOwnKey} type="password" autoComplete="off" placeholder="sk-or-v1-..." value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
                </label>
                <label>
                  <span>AI Engine (Mô hình AI)</span>
                  <select disabled={!useOwnKey} value={model} onChange={(event) => setModel(event.target.value)} className="profile-select-input" style={{ width: "100%", padding: "0.6rem", borderRadius: "0.375rem", border: "1px solid var(--border-color, #ccc)" }}>
                    <option value="deepseek/deepseek-chat"> DeepSeek V3</option>
                    <option value="deepseek/deepseek-r1">DeepSeek R1</option>
                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="google/gemini-2.0-flash"> Gemini 2.0 Flash</option>
                  </select>
                </label>
              </div>
              <p className="ai-security-note">API Key này được bảo mật trong phiên duyệt web hiện tại và không lưu trữ trên máy chủ.</p>
            </section>
          </details>
        </div>
      ) : null}

      <div className="profile-context-settings" style={{ marginTop: "1.5rem" }}>
        <section className="profile-settings-card profile-danger-card">
          <div className="profile-reset-header">
            <h2 style={{ margin: "0 0 0.5rem" }}>Delete Account</h2>
            <p className="card-description" style={{ margin: 0 }}>
              Permanently delete your profile, team memberships, and account record from MayLamDi.
            </p>
          </div>
          <button
            type="button"
            className="danger-button profile-reset-button"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            <Trash2 size={16} aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-2px", marginRight: "6px" }} />
            {isDeleting ? "Deleting Account…" : "Delete Account"}
          </button>
        </section>
      </div>
    </section>
  );
}
