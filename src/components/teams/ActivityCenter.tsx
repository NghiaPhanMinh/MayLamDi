import { useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import {
  Bell,
  CheckCircle2,
  FilePlus2,
  FolderKanban,
  History,
  ListTodo,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errors";

type ActivityCenterProps = {
  teamId: Id<"teams">;
};

function localDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function ActionIcon({ action }: { action: string }) {
  if (action.includes("review")) return <CheckCircle2 aria-hidden="true" />;
  if (action.includes("evidence")) return <FilePlus2 aria-hidden="true" />;
  if (action.includes("task") || action.includes("milestone")) return <ListTodo aria-hidden="true" />;
  if (action.includes("project") || action.includes("framework")) return <FolderKanban aria-hidden="true" />;
  if (action.includes("member") || action.includes("team")) return <UsersRound aria-hidden="true" />;
  return <Sparkles aria-hidden="true" />;
}

export function ActivityCenter({ teamId }: ActivityCenterProps) {
  const unread = useQuery(api.activity.getUnreadSummary, { teamId });
  const { results, status, loadMore } = usePaginatedQuery(
    api.activity.list,
    { teamId },
    { initialNumItems: 12 },
  );
  const markAllRead = useMutation(api.activity.markAllRead);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleActivities = unreadOnly
    ? results.filter((activity) => activity.isUnread)
    : results;

  async function handleMarkAllRead() {
    setError(null);
    setIsMarking(true);

    try {
      await markAllRead({ teamId });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Notifications could not be marked as read."));
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <section className="activity-center" aria-labelledby="activity-center-title">
      <button
        className="activity-center-toggle"
        type="button"
        aria-label={isOpen ? "Close activity and notifications" : "Open activity and notifications"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <small>Realtime team history</small>
          <strong id="activity-center-title">Activity & notifications</strong>
        </span>
        <span className="activity-bell" aria-hidden="true">
          <Bell />
        </span>
        {unread !== undefined && unread.count > 0 ? (
          <span className="notification-count has-unread" aria-label={`${unread.count}${unread.hasMore ? "+" : ""} unread notifications`}>
            {unread.count > 99 ? "99+" : unread.count}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="activity-drawer">
          <div className="activity-controls">
            <label>
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
              />
              Unread only
            </label>
            <button
              className="quiet-button"
              type="button"
              disabled={isMarking || unread?.count === 0}
              onClick={() => void handleMarkAllRead()}
            >
              {isMarking ? "Marking…" : "Mark all read"}
            </button>
          </div>
          <p className="notification-scope-note">
            Updates appear here in the app. This panel does not send email, browser or phone notifications.
          </p>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {status === "LoadingFirstPage" ? (
            <p className="activity-empty" aria-busy="true">Loading team activity…</p>
          ) : visibleActivities.length === 0 ? (
            <p className="activity-empty">
              {unreadOnly ? "No unread team updates." : "No team activity yet."}
            </p>
          ) : (
            <ol className="activity-list" aria-live="polite">
              {visibleActivities.map((activity) => (
                <li
                  key={activity._id}
                  className={activity.isUnread ? "activity-item is-unread" : "activity-item"}
                >
                  <span className="activity-glyph" aria-hidden="true">
                    <ActionIcon action={activity.action} />
                  </span>
                  <div>
                    <div className="activity-item-heading">
                      <strong>{activity.title}</strong>
                      {activity.isUnread ? <span>New</span> : null}
                    </div>
                    <p>{activity.detail}</p>
                    <time dateTime={new Date(activity.createdAt).toISOString()}>
                      {localDateTime(activity.createdAt)}{activity.isOwn ? " · You" : ""}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {!unreadOnly && status === "CanLoadMore" ? (
            <button
              className="secondary-button activity-load-more"
              type="button"
              onClick={() => loadMore(12)}
            >
              <History aria-hidden="true" />
              Load older activity
            </button>
          ) : null}
          {status === "LoadingMore" ? <p className="activity-loading-more">Loading older activity…</p> : null}
        </div>
      ) : null}
    </section>
  );
}
