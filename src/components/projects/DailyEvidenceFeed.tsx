import { UiIcon } from "../common/UiIcon";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errors";
import { CharacterAvatar } from "../common/CharacterAvatar";

type DailyEvidenceFeedProps = {
  projectId: Id<"projects">;
};

export function DailyEvidenceFeed({ projectId }: DailyEvidenceFeedProps) {
  const posts = useQuery(api.daily.listForProject, { projectId });
  const postMutation = useMutation(api.daily.postDailyEvidence);

  const [text, setText] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedText = text.trim();
  const wordCount = trimmedText.length > 0 ? trimmedText.split(/\s+/).filter(Boolean).length : 0;
  const imageCount = imageUrls.length;

  // Validation rule: At least 20 words OR at least 2 pictures attached
  const isValidSubmission = wordCount >= 20 || imageCount >= 2;

  function handleAddImage() {
    const trimmed = imageInput.trim();
    if (!trimmed) return;
    setImageUrls((current) => [...current, trimmed]);
    setImageInput("");
  }

  function handleRemoveImage(index: number) {
    setImageUrls((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text && imageUrls.length === 0) return;

    setError(null);
    setIsPosting(true);

    try {
      await postMutation({
        projectId,
        text,
        imageUrls,
      });
      setText("");
      setImageInput("");
      setImageUrls([]);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Failed to post daily evidence."));
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <section className="daily-evidence-feed" aria-labelledby="daily-feed-title">
      <header className="daily-feed-header">
        <div>
          <div className="daily-feed-title-row">
            <h3 className="display-heading" id="daily-feed-title">Daily Evidence Feed</h3>
            <span className="read-only-label">LIVE FEED</span>
          </div>
          <p className="daily-feed-requirement">
            <strong>Minimum requirement:</strong> At least 20 words OR 2 pictures attached.
          </p>
        </div>
      </header>

      {/* New Post Form */}
      <form className="daily-post-form" onSubmit={handleSubmit}>
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <label className="daily-text-field">
          <span className="field-label">Work Description / Progress Notes</span>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what you built, researched, or accomplished today (at least 20 words required if no images attached)..."
          />
        </label>

        {/* Live Validation Counters */}
        <div className="daily-validation-status-bar">
          <span className={`validation-counter ${wordCount >= 20 ? "is-valid" : ""}`}>
            <UiIcon name="FileText" /> {wordCount}/20 words {wordCount >= 20 ? <><UiIcon name="Check" /></> : ""}
          </span>
          <span className={`validation-counter ${imageCount >= 2 ? "is-valid" : ""}`}>
            <UiIcon name="Image" /> {imageCount}/2 pictures {imageCount >= 2 ? <><UiIcon name="Check" /></> : ""}
          </span>
          {isValidSubmission ? (
            <span className="validation-result-badge is-valid-badge">
              <UiIcon name="Swords" /> Valid evidence. Defeats today’s goblin.
            </span>
          ) : (
            <span className="validation-result-badge is-warning-badge">
              <UiIcon name="TriangleAlert" /> Needs 20 words or 2 images to count towards goblin defense
            </span>
          )}
        </div>

        {/* Image Attachment Links Input */}
        <div className="daily-image-input-row">
          <input
            className="daily-image-url-input"
            type="url"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="Paste image URL (e.g. screenshot link)..."
          />
          <button className="secondary-button" type="button" onClick={handleAddImage}>
            Attach image
          </button>
        </div>

        {/* Attached Images List */}
        {imageUrls.length > 0 ? (
          <div className="attached-images-preview">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="attached-image-chip">
                <span>Image {idx + 1}</span>
                <button type="button" onClick={() => handleRemoveImage(idx)} aria-label={`Remove image ${idx + 1}`}>×</button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="daily-form-actions">
          <button className="primary-button" type="submit" disabled={isPosting || (!text && imageUrls.length === 0)}>
            {isPosting ? "Posting evidence..." : "Post daily evidence"}
          </button>
        </div>
      </form>

      {/* Feed List */}
      <div className="daily-feed-list" aria-label="Team daily evidence log">
        <h4 className="feed-list-title">Team Evidence Activity</h4>
        {posts === undefined ? (
          <p>Loading daily evidence feed...</p>
        ) : posts.length === 0 ? (
          <p className="empty-feed-notice">No daily evidence posted today.</p>
        ) : (
          posts.map((post) => (
            <article key={post._id} className={`daily-feed-card ${post.isValid ? "feed-card-valid" : "feed-card-invalid"}`}>
              <header className="feed-card-header">
                <CharacterAvatar
                  fill={post.authorFill}
                  outline={post.authorOutline}
                  spellType={post.authorSpellType}
                  name={post.authorName}
                  size="sm"
                />
                <span className="feed-author-name">{post.authorName}</span>
                <time className="feed-post-time">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                {post.isValid ? (
                  <span className="feed-status-tag valid-tag"><UiIcon name="ShieldCheck" /> Goblin defeated</span>
                ) : (
                  <span className="feed-status-tag invalid-tag"><UiIcon name="TriangleAlert" /> Logged (Short)</span>
                )}
              </header>
              <p className="feed-post-text">{post.text}</p>
              {post.imageUrls && post.imageUrls.length > 0 ? (
                <div className="feed-post-images">
                  {post.imageUrls.map((url: string, idx: number) => (
                    <img key={idx} src={url} alt={`Evidence attachment ${idx + 1}`} className="feed-image-preview" />
                  ))}
                </div>
              ) : null}
              <footer className="feed-card-footer">
                <span>{post.wordCount} words · {post.imageCount} images</span>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
