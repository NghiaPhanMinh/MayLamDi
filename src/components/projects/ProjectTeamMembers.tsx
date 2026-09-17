import { UiIcon } from "../common/UiIcon";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errors";
import { MAYLAMDI_SKILL_COLORS, paletteColorAt } from "../../lib/brandPalette";
import { CharacterAvatar } from "../common/CharacterAvatar";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 13 }, (_, index) => index + 8);

function timeLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function skillChipStyle(index: number) {
  return {
    "--mld-chip-color": paletteColorAt(MAYLAMDI_SKILL_COLORS, index),
  } as CSSProperties;
}

export function ProjectTeamMembers({ projectId }: { projectId: Id<"projects"> }) {
  const data = useQuery(api.availability.getForProject, { projectId });
  const updateMine = useMutation(api.availability.updateMine);
  const saveMeetingPlan = useMutation(api.availability.saveMeetingPlan);
  const voteMeeting = useMutation(api.availability.voteMeeting);
  const selectMeeting = useMutation(api.availability.selectMeeting);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [duration, setDuration] = useState("60");
  const [cadence, setCadence] = useState<"weekly" | "fortnightly" | "as_needed">("weekly");
  const [meetingMode, setMeetingMode] = useState<"online" | "offline">("online");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mine = useMemo(() => data?.members.find((member) => member.profileId === data.currentProfileId), [data]);

  /* Query-backed values hydrate this editable realtime form. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!data) return;
    const next = new Set<string>();
    data.blocks.filter((block) => block.profileId === data.currentProfileId).forEach((block) => {
      for (let minute = block.startMinute; minute < block.endMinute; minute += 60) next.add(`${block.dayOfWeek}-${minute}`);
    });
    setSelected(next);
    setTimezone(mine?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setDuration(String(mine?.meetingDurationMinutes ?? 60));
    setCadence(mine?.meetingCadence ?? "weekly");
  }, [data, mine]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggle(dayOfWeek: number, minute: number) {
    const key = `${dayOfWeek}-${minute}`;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setSaved(false);
  }

  function toggleFullDay(dayOfWeek: number) {
    setSelected((current) => {
      const next = new Set(current);
      const allBusy = HOURS.every((hour) => next.has(`${dayOfWeek}-${hour * 60}`));
      HOURS.forEach((hour) => {
        const key = `${dayOfWeek}-${hour * 60}`;
        if (allBusy) next.delete(key); else next.add(key);
      });
      return next;
    });
    setSaved(false);
  }

  function toBlocks() {
    const blocks: Array<{ dayOfWeek: number; startMinute: number; endMinute: number }> = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      const minutes = [...selected].filter((key) => key.startsWith(`${dayOfWeek}-`)).map((key) => Number(key.split("-")[1])).sort((a, b) => a - b);
      for (const minute of minutes) {
        const previous = blocks.at(-1);
        if (previous?.dayOfWeek === dayOfWeek && previous.endMinute === minute) previous.endMinute += 60;
        else blocks.push({ dayOfWeek, startMinute: minute, endMinute: minute + 60 });
      }
    }
    return blocks;
  }

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError(null);
    setIsSaving(true);
    try { await action(); } catch (caughtError) { setError(getErrorMessage(caughtError, fallback)); } finally { setIsSaving(false); }
  }

  async function saveAvailability() {
    await run(async () => {
      await updateMine({ projectId, timezone, meetingDurationMinutes: Number(duration), meetingCadence: cadence, blocks: toBlocks() });
      setSaved(true);
    }, "Your busy-time calendar could not be saved.");
  }

  async function createCandidate(suggestion: NonNullable<typeof data>["suggestions"][number]) {
    await run(() => saveMeetingPlan({
      projectId,
      title: "Team meeting candidate",
      dayOfWeek: suggestion.dayOfWeek,
      startMinute: suggestion.startMinute,
      durationMinutes: Math.min(Number(duration), suggestion.endMinute - suggestion.startMinute),
      timezone,
      attendeeProfileIds: suggestion.attendeeProfileIds,
      source: "deterministic",
      meetingMode,
    }), "The meeting candidate could not be created.");
  }

  const battleState = useQuery(api.battle.getState, { projectId });

  if (!data) return <section className="team-members-tab" aria-busy="true">Loading team members…</section>;
  const finalPlan = data.plans.find((plan) => plan.status === "selected");

  return (
    <section className="team-members-tab" aria-labelledby="team-members-title">
      <header className="project-list-heading"><div><h3 id="team-members-title">Team Members &amp; Availability</h3></div></header>

      {finalPlan ? <aside className="final-meeting-overlay" aria-label="Final meeting selected"><strong>Final meeting selected</strong><span>{DAYS[finalPlan.dayOfWeek]} · {timeLabel(finalPlan.startMinute)} · {finalPlan.durationMinutes} min · {finalPlan.meetingMode ?? "online"}</span></aside> : null}

      <div className="member-profile-grid">
        {data.members.map((member) => {
          const isInactive = battleState?.members.find((m) => m.profileId === member.profileId)?.isInactive7Days;
          return (
            <article key={member.profileId} className="member-profile-card">
              <CharacterAvatar
                fill={member.characterFill}
                outline={member.characterOutline}
                spellType={member.spellType}
                name={member.displayName}
                imageUrl={member.imageUrl}
                size="md"
              />
              <div>
                <strong>
                  {member.displayName}
                  {isInactive ? <span className="member-inactive-badge" style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "999px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid #ef4444", fontSize: "0.75rem", fontWeight: 800 }}><UiIcon name="TriangleAlert" /> Inactive (7+ days)</span> : null}
                </strong>
                <small>{member.weeklyCapacity ?? "?"}h/week · {member.assignedTaskCount} assigned · {member.reviewTaskCount} reviews</small>
              </div>
              <div><small>General skills</small><div className="skill-chip-list">{member.skills.length ? member.skills.map((skill, index) => <span key={skill} className="member-skill-chip" style={skillChipStyle(index)}>{skill}</span>) : <span className="member-skill-chip is-empty">None saved</span>}</div></div>
              <div><small>Software skills</small><div className="skill-chip-list">{member.softwareSkills.length ? member.softwareSkills.map((skill, index) => <span key={skill} className="member-skill-chip" style={skillChipStyle(member.skills.length + index)}>{skill}</span>) : <span className="member-skill-chip is-empty">None saved</span>}</div></div>
            </article>
          );
        })}
      </div>

      <section className="availability-editor" aria-labelledby="availability-title">
        <div><h4 id="availability-title">Mark your busy hours</h4></div>
        <div className="full-day-busy-row"><span>Full day busy:</span>{DAYS.map((day, dayOfWeek) => <button className="text-link" key={day} type="button" onClick={() => toggleFullDay(dayOfWeek)}>{day.slice(0, 3)}</button>)}</div>
        <div className="availability-calendar" role="grid" aria-label="Weekly busy times from 8 AM to 9 PM">
          <span className="availability-corner" />{DAYS.map((day) => <strong key={day} role="columnheader">{day.slice(0, 3)}</strong>)}
          {HOURS.map((hour) => <div className="availability-row" role="row" key={hour}><span>{timeLabel(hour * 60)}</span>{DAYS.map((day, dayOfWeek) => { const key = `${dayOfWeek}-${hour * 60}`; return <button key={day} type="button" className={selected.has(key) ? "is-selected is-busy" : ""} aria-pressed={selected.has(key)} aria-label={`${day} ${timeLabel(hour * 60)} busy`} onClick={() => toggle(dayOfWeek, hour * 60)} />; })}</div>)}
        </div>
        <button className="primary-button" type="button" disabled={isSaving} onClick={() => void saveAvailability()}>{isSaving ? "Saving…" : saved ? "Busy times saved" : "Save Busy Times"}</button>
      </section>

      <section className="meeting-overlap" aria-labelledby="meeting-overlap-title">
        <p className="card-eyebrow">Shared free times</p><h4 id="meeting-overlap-title">Meeting candidates</h4><p>These options come from the busy times your teammates saved.</p>
        {data.canManageMeetings ? <label className="meeting-mode-field"><span>Meeting type</span><select value={meetingMode} onChange={(event) => setMeetingMode(event.target.value as typeof meetingMode)}><option value="online">Online</option><option value="offline">Offline</option></select></label> : null}
        {data.suggestions.length ? <div className="meeting-suggestion-grid">{data.suggestions.map((suggestion) => <article key={`${suggestion.dayOfWeek}-${suggestion.startMinute}`}><strong>{DAYS[suggestion.dayOfWeek]} · {timeLabel(suggestion.startMinute)}–{timeLabel(suggestion.endMinute)}</strong><span>{suggestion.attendeeProfileIds.length}/{data.members.length} members available</span>{data.canManageMeetings ? <button className="quiet-button" type="button" disabled={isSaving} onClick={() => void createCandidate(suggestion)}>Create Candidate</button> : null}</article>)}</div> : <div className="project-empty"><strong>No shared slot yet.</strong><p>Ask teammates to save their busy times.</p></div>}

        {data.plans.length ? <div className="saved-meeting-plans"><h5>Candidate vote</h5>{data.plans.map((plan) => <article key={plan._id} className={plan.status === "selected" ? "is-selected" : ""}><div><strong>{DAYS[plan.dayOfWeek]} {timeLabel(plan.startMinute)}</strong><span>{plan.durationMinutes} min · {plan.meetingMode ?? "online"} · {plan.suitableCount}/{data.members.length} suitable</span></div>{plan.status === "candidate" ? <div><button className="secondary-button" type="button" disabled={isSaving} onClick={() => void run(() => voteMeeting({ meetingPlanId: plan._id, suitable: true }), "Your vote could not be saved.")}>{plan.hasMyVote ? "Update: Suitable" : "Suitable"}</button><button className="quiet-button" type="button" disabled={isSaving} onClick={() => void run(() => voteMeeting({ meetingPlanId: plan._id, suitable: false }), "Your vote could not be saved.")}>Not suitable</button>{data.canManageMeetings ? <button className="primary-button" type="button" disabled={isSaving} onClick={() => void run(() => selectMeeting({ meetingPlanId: plan._id }), "The final meeting could not be selected.")}>Select Final Meeting</button> : null}</div> : <strong>FINAL</strong>}</article>)}</div> : null}
      </section>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>
  );
}
