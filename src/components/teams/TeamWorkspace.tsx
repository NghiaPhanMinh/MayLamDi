import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MainSection } from "../../lib/navigation";
import type { BuiltInFramework } from "../../data/frameworks";
import { CustomFrameworkSection } from "../frameworks/CustomFrameworkSection";
import { FrameworkLibrary } from "../frameworks/FrameworkLibrary";
import { ProjectHub } from "../projects/ProjectHub";

type RoomSummary = {
  _id: Id<"teams">;
  name: string;
  memberCount: number;
};

type TeamWorkspaceProps = {
  selectedTeamId: Id<"teams">;
  teams: RoomSummary[];
  onAddTeam: () => void;
  onSelectTeam: (teamId: Id<"teams">) => void;
  activeSection?: MainSection;
};

export function TeamWorkspace({
  selectedTeamId,
  teams,
  onAddTeam,
  onSelectTeam,
  activeSection,
}: TeamWorkspaceProps) {
  const workspace = useQuery(api.teams.getWorkspace, { teamId: selectedTeamId });
  const [copyStatus, setCopyStatus] = useState("Share code");
  const [frameworkSeed, setFrameworkSeed] = useState<BuiltInFramework | null>(null);

  if (workspace === undefined) {
    return <section className="team-loading" aria-busy="true"><p className="kicker">Opening room</p><h1 className="display-heading">Loading your project room…</h1></section>;
  }

  if (workspace === null) {
    return (
      <section className="project-empty" style={{ margin: "2rem auto", maxWidth: "600px" }}>
        <strong>Room not found or no longer accessible.</strong>
        <p>You may not be a member of this room or it may have been deleted.</p>
        <button className="primary-button" type="button" onClick={() => window.location.href = "/projects"}>View My Projects</button>
      </section>
    );
  }

  const currentMember = workspace.members.find((member) => member.profileId === workspace.currentProfileId);
  const joinCode = workspace.team.joinCode;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopyStatus("Copied!");
    } catch {
      setCopyStatus(joinCode);
    }
  }

  return (
    <section className="room-workspace">
      <ProjectHub
        teamId={selectedTeamId}
        members={workspace.members.map((member) => ({ profileId: member.profileId, displayName: member.displayName }))}
        currentProfileId={workspace.currentProfileId}
        requestedProjectTab="progress"
      />
    </section>
  );
}
