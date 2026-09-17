import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errors";

type TeamLobbyProps = {
  displayName: string;
  hasTeams: boolean;
  onCancel: () => void;
  onTeamReady: (teamId: Id<"teams">) => void;
};

export function TeamLobby({
  displayName,
  hasTeams,
  onCancel,
  onTeamReady,
}: TeamLobbyProps) {
  const createTeam = useMutation(api.teams.create);
  const joinTeam = useMutation(api.teams.joinByCode);
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(
    null,
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setPendingAction("create");

    try {
      const teamId = await createTeam({ name: teamName });
      setTeamName("");
      onTeamReady(teamId);
    } catch (error) {
      setCreateError(
        getErrorMessage(error, "The team could not be created. Try again."),
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinError(null);
    setPendingAction("join");

    try {
      const teamId = await joinTeam({ code: joinCode });
      setJoinCode("");
      onTeamReady(teamId);
    } catch (error) {
      setJoinError(
        getErrorMessage(error, "The team could not be joined. Try again."),
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="team-lobby" aria-labelledby="team-lobby-title">
      <div className="team-lobby-heading">
        <div>
          <p className="kicker">Teams</p>
          <h1 id="team-lobby-title">Who are we making with, {displayName}?</h1>
          <p>
            Start a fresh team or enter the six-character code shared by a
            teammate.
          </p>
        </div>
        {hasTeams ? (
          <button className="quiet-button" type="button" onClick={onCancel}>
            Back to my team
          </button>
        ) : null}
      </div>

      <div className="team-action-grid">
        <form className="team-action-card accent-pink" onSubmit={handleCreate}>
          <p className="card-eyebrow">Create a team</p>
          <h2>Create a new team.</h2>
          <label htmlFor="team-name">Team name</label>
          <input
            id="team-name"
            name="teamName"
            type="text"
            minLength={2}
            maxLength={60}
            required
            autoComplete="off"
            placeholder="Studio Sidequest"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
          />
          {createError ? (
            <p className="form-error" role="alert">
              {createError}
            </p>
          ) : null}
          <button
            className="primary-button"
            type="submit"
            disabled={pendingAction !== null}
          >
            {pendingAction === "create" ? "Creating…" : "Create team"}
          </button>
        </form>

        <form className="team-action-card accent-yellow" onSubmit={handleJoin}>
          <p className="card-eyebrow">Join a team</p>
          <h2>Enter the team code.</h2>
          <label htmlFor="join-code">Team code</label>
          <input
            id="join-code"
            className="join-code-input"
            name="joinCode"
            type="text"
            minLength={6}
            maxLength={8}
            required
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="ABC234"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          />
          {joinError ? (
            <p className="form-error" role="alert">
              {joinError}
            </p>
          ) : null}
          <button
            className="primary-button"
            type="submit"
            disabled={pendingAction !== null}
          >
            {pendingAction === "join" ? "Joining…" : "Join team"}
          </button>
        </form>
      </div>
    </section>
  );
}
