import { UiIcon } from "../common/UiIcon";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { REVIEW_WAITING_MESSAGE } from "./reviewCopy";
import { getErrorMessage } from "../../lib/errors";
import { trackEvent } from "../../lib/analytics";

type EvidenceType = "note" | "link" | "image" | "pdf";

type TaskEvidencePanelProps = {
  taskId: Id<"tasks">;
  taskTitle: string;
  taskStatus: "todo" | "in_progress" | "blocked" | "review" | "completed" | "submitted" | "changes_requested" | "verified" | "awaiting_creator";
  requiresReview: boolean;
  reviewerName?: string;
};

function uploadFile(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  return new Promise<Id<"_storage">>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", uploadUrl);
    request.setRequestHeader("Content-Type", file.type);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error("The evidence file upload failed."));
        return;
      }

      try {
        const response = JSON.parse(request.responseText) as {
          storageId: Id<"_storage">;
        };
        resolve(response.storageId);
      } catch {
        reject(new Error("The upload response could not be read."));
      }
    });
    request.addEventListener("error", () =>
      reject(new Error("The evidence file upload failed.")),
    );
    request.send(file);
  });
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

export function TaskEvidencePanel({
  taskId,
  taskTitle,
  taskStatus,
  requiresReview,
  reviewerName,
}: TaskEvidencePanelProps) {
  const details = useQuery(api.evidence.listForTask, { taskId });
  const generateUploadUrl = useMutation(api.evidence.generateUploadUrl);
  const addEvidence = useMutation(api.evidence.add);
  const submitReview = useMutation(api.evidence.submitReview);
  const submitForReview = useMutation(api.evidence.submitForReview);
  const chooseReviewer = useMutation(api.tasks.chooseReviewer);
  const selfCompleteSoloTask = useMutation(api.evidence.selfCompleteSoloTask);
  const [type, setType] = useState<EvidenceType>("note");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelfCompleteSoloTask() {
    setError(null);
    setIsSaving(true);
    try {
      await selfCompleteSoloTask({ taskId });
      trackEvent("review_completed", { review_status: "approved" });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "The task could not be completed."));
    } finally {
      setIsSaving(false);
    }
  }

  function validateFile(selectedFile: File) {
    if (type === "image") {
      if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]).has(selectedFile.type)) {
        throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        throw new Error("Images must be 5 MB or smaller.");
      }
    }

    if (type === "pdf") {
      if (selectedFile.type !== "application/pdf") {
        throw new Error("Choose a PDF file.");
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error("PDF files must be 10 MB or smaller.");
      }
    }
  }

  async function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    setUploadProgress(0);

    try {
      if (type === "image" || type === "pdf") {
        if (!file) {
          throw new Error("Choose a file to upload.");
        }
        validateFile(file);
        const uploadUrl = await generateUploadUrl({ taskId });
        const storageId = await uploadFile(uploadUrl, file, setUploadProgress);
        await addEvidence({
          taskId,
          type,
          note,
          storageId,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });
      } else {
        await addEvidence({
          taskId,
          type,
          note: type === "note" ? note : note || undefined,
          url: type === "link" ? url : undefined,
        });
      }

      setNote("");
      setUrl("");
      setFile(null);
      setUploadProgress(0);
      trackEvent("evidence_submitted", {
        evidence_type: type,
        has_file: type === "image" || type === "pdf",
      });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "The evidence could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReview(status: "approved" | "changes_requested") {
    setError(null);
    setIsSaving(true);

    try {
      await submitReview({ taskId, status, comment: reviewComment });
      trackEvent("review_completed", {
        review_status: status,
      });
      setReviewComment("");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "The review could not be submitted."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitForReview() {
    setError(null);
    setIsSaving(true);
    try {
      await submitForReview({ taskId });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "The task could not be submitted for review."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChooseReviewer() {
    if (!selectedReviewerId) return;
    setError(null);
    setIsSaving(true);
    try {
      await chooseReviewer({
        taskId,
        reviewerProfileId: selectedReviewerId as Id<"userProfiles">,
      });
      setSelectedReviewerId("");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "The reviewer could not be assigned."));
    } finally {
      setIsSaving(false);
    }
  }

  if (details === undefined) {
    return <div className="task-evidence-panel" aria-busy="true">Loading evidence…</div>;
  }

  const isSolo = details.isSoloProject || details.eligibleReviewers.length === 0;
  const canReviewNow = details.canReview;

  return (
    <section className="task-evidence-panel" aria-label={`Evidence and review for ${taskTitle}`}>
      <div className="evidence-panel-heading">
        <div>
          <p className="card-eyebrow">Contribution evidence</p>
          <h5>{details.evidence.length} saved items</h5>
        </div>
        {requiresReview ? (
          <span className={`review-state review-${details.latestReview?.status ?? "not-requested"}`}>
            {details.latestReview?.status.replace("_", " ") ?? "Review not requested"}
          </span>
        ) : (
          <span className="review-state">Review optional</span>
        )}
      </div>

      {details.canSubmit ? (
        <form className="evidence-form" onSubmit={handleEvidenceSubmit}>
          <label>
            <span>Evidence type</span>
            <select value={type} onChange={(event) => {
              setType(event.target.value as EvidenceType);
              setFile(null);
              setUploadProgress(0);
            }}>
              <option value="note">Short note</option>
              <option value="link">External link</option>
              <option value="image">Image</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          {type === "link" ? (
            <label>
              <span>Evidence URL</span>
              <input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://figma.com/…" />
            </label>
          ) : null}
          {type === "image" || type === "pdf" ? (
            <label className="evidence-file-field">
              <span>{type === "image" ? "Image (max 5 MB)" : "PDF (max 10 MB)"}</span>
              <input
                required
                type="file"
                accept={type === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "application/pdf"}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          ) : null}
          <label className="evidence-note-field">
            <span>{type === "note" ? "Evidence note" : "Description (optional)"}</span>
            <textarea required={type === "note"} maxLength={2000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          {isSaving && uploadProgress > 0 ? (
            <div className="upload-progress" role="progressbar" aria-label="Evidence upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
              <span style={{ width: `${uploadProgress}%` }} />
              <strong>{uploadProgress}%</strong>
            </div>
          ) : null}
          <button className="secondary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving evidence…" : "Add evidence"}
          </button>
        </form>
      ) : null}

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {details.evidence.length > 0 ? (
        <ul className="evidence-list">
          {details.evidence.map((item) => (
            <li key={item._id}>
              <div>
                <strong>{item.type.toUpperCase()}</strong>
                <span>Added by {item.submitterName}</span>
              </div>
              {item.note ? <p>{item.note}</p> : null}
              {item.url ? <a href={item.url} target="_blank" rel="noreferrer">Open external evidence</a> : null}
              {item.fileUrl ? <a href={item.fileUrl} target="_blank" rel="noreferrer">Open {item.fileName ?? "uploaded file"} {formatFileSize(item.fileSize)}</a> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="evidence-empty">No evidence has been added to this task.</p>
      )}

      {isSolo && details.isTaskOwner && !["completed", "verified"].includes(taskStatus) ? (
        <div className="solo-complete-panel">
          <p><UiIcon name="Zap" /> <strong>Solo / Single Member:</strong> You can self-approve and complete your task once evidence is added.</p>
          <button
            className="primary-button submit-review-button"
            type="button"
            disabled={isSaving || details.evidence.length === 0}
            onClick={() => void handleSelfCompleteSoloTask()}
          >
            {isSaving ? "Completing task..." : "Self-Approve & Complete Task"}
          </button>
        </div>
      ) : null}

      {!isSolo && requiresReview && details.isTaskOwner && !reviewerName && ["todo", "in_progress", "changes_requested"].includes(taskStatus) ? (
        <div className="reviewer-picker">
          <label>
            <span>Choose your reviewer</span>
            <select value={selectedReviewerId} onChange={(event) => setSelectedReviewerId(event.target.value)}>
              <option value="">Select a teammate</option>
              {details.eligibleReviewers.map((reviewer) => (
                <option key={reviewer.profileId} value={reviewer.profileId} disabled={reviewer.atCapacity}>
                  {reviewer.displayName} · {reviewer.reviewCount}/{details.fairReviewCapacity} reviews{reviewer.atCapacity ? " · at capacity" : ""}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" type="button" disabled={isSaving || !selectedReviewerId} onClick={() => void handleChooseReviewer()}>
            Assign reviewer
          </button>
          <small>Capacity is recalculated from the team’s current review load.</small>
        </div>
      ) : null}

      {!isSolo && requiresReview && details.isTaskOwner && ["todo", "in_progress", "changes_requested"].includes(taskStatus) ? (
        <button className="primary-button submit-review-button maylamdi-button" type="button" disabled={isSaving || details.evidence.length === 0 || !reviewerName} onClick={() => void handleSubmitForReview()}>
          MayLamDi
        </button>
      ) : null}

      {!isSolo && requiresReview ? (
        <div className="review-panel">
          <strong>{reviewerName ? `Assigned reviewer: ${reviewerName}` : "Reviewer not selected yet"}</strong>
          <p>The assigned reviewer approves task completion or requests changes.</p>
          {canReviewNow ? (
            <>
              <label>
                <span>Review comment</span>
                <textarea maxLength={1000} rows={3} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="What works, or what should change?" />
              </label>
              <div className="review-actions">
                <button className="primary-button" type="button" disabled={isSaving} onClick={() => void handleReview("approved")}>Approve & Complete</button>
                <button className="secondary-button" type="button" disabled={isSaving} onClick={() => void handleReview("changes_requested")}>Request changes</button>
              </div>
            </>
          ) : taskStatus === "review" || taskStatus === "submitted" ? (
            <p>Waiting for {reviewerName ?? "the assigned reviewer"}.</p>
          ) : taskStatus === "awaiting_creator" ? (
            <p>The reviewer recommended completion. Waiting for the room creator’s final decision.</p>
          ) : !details.isTaskOwner && !canReviewNow ? (
            <p className="waiting-label">{REVIEW_WAITING_MESSAGE}</p>
          ) : (
            <p>Add evidence, then use Submit for Review when the work is ready.</p>
          )}
          {details.latestReview?.comment ? (
            <blockquote>{details.latestReview.comment}</blockquote>
          ) : null}
          {details.reviews.length > 0 ? (
            <details className="review-history">
              <summary>Review history ({details.reviews.length})</summary>
              <ol>
                {details.reviews.map((review) => (
                  <li key={review._id}>
                    <strong>{review.reviewerName}: {review.status === "approved" ? "recommended complete" : review.status.replace("_", " ")}</strong>
                    {review.comment ? <span>{review.comment}</span> : null}
                    <time>{new Date(review.updatedAt).toLocaleString()}</time>
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
