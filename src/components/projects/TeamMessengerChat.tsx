import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Image as ImageIcon, Send, X } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type TeamMessengerChatProps = {
  projectId: Id<"projects">;
};

export function TeamMessengerChat({ projectId }: TeamMessengerChatProps) {
  const posts = useQuery(api.daily.listForProject, { projectId });
  const postMutation = useMutation(api.daily.postDailyEvidence);
  const workspace = useQuery(api.tasks.getWorkspace, { projectId });

  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messenger on new posts
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts?.length]);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file (PNG, JPG, WebP).");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;

    setIsSending(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];

      // If image attached, convert to local data url or post
      if (selectedFile) {
        const reader = new FileReader();
        const dataUrlPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
        const dataUrl = await dataUrlPromise;
        uploadedUrls.push(dataUrl);
      }

      await postMutation({
        projectId,
        text: trimmed || "(Photo attached)",
        imageUrls: uploadedUrls,
      });

      setText("");
      handleRemoveFile();
    } catch (err: any) {
      setError(err?.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  }

  // Sorted chronologically for messenger layout (oldest top, newest bottom)
  const sortedMessages = posts ? [...posts].reverse() : [];
  const currentProfileId = workspace?.currentProfileId;
  const currentMember = workspace?.members?.find((m) => m?.profileId === currentProfileId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "520px",
        maxHeight: "68vh",
        background: "#ffffff",
        border: "3px solid #101517",
        boxShadow: "4px 4px 0 #101517",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* Messenger Header: Active User Info */}
      <div
        style={{
          background: "#fffded",
          borderBottom: "2px solid #101517",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#2563eb",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: "0.85rem",
              border: "1.5px solid #101517",
            }}
          >
            {currentMember?.displayName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#101517", lineHeight: 1.1 }}>
              {currentMember?.displayName || "You"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 700 }}>
              ● Online in Team Chat
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            background: "#f1f5f9",
            color: "#475569",
            border: "1.5px solid #101517",
            borderRadius: "6px",
            padding: "2px 8px",
          }}
        >
          {sortedMessages.length} {sortedMessages.length === 1 ? "Message" : "Messages"}
        </span>
      </div>

      {/* Permanent Contribution PDF Notice */}
      <div
        style={{
          background: "#eff6ff",
          borderBottom: "1px solid #bfdbfe",
          padding: "6px 12px",
          fontSize: "0.72rem",
          color: "#1e40af",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>📄</span>
        <span>Everything in this chat will be recorded and put into the PDF download. Post daily updates to see proof and have your contribution recorded.</span>
      </div>

      {/* Scrollable Messenger Bubble Feed */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "#f8fafc",
        }}
      >
        {sortedMessages.length === 0 ? (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 700,
              padding: "20px",
            }}
          >
            💬 No messages yet. Start the conversation with your team!
          </div>
        ) : (
          sortedMessages.map((msg: any) => {
            const isMine = msg.authorProfileId === currentProfileId;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={msg._id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                  gap: "3px",
                  maxWidth: "80%",
                  alignSelf: isMine ? "flex-end" : "flex-start",
                }}
              >
                {/* Author Name for Teammates */}
                {!isMine && (
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#475569", marginLeft: "4px" }}>
                    {msg.authorName || "Teammate"}
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  style={{
                    background: isMine ? "#2563eb" : "#ffffff",
                    color: isMine ? "#ffffff" : "#101517",
                    border: isMine ? "2px solid #1d4ed8" : "2px solid #101517",
                    boxShadow: isMine ? "2px 2px 0 rgba(0,0,0,0.15)" : "2px 2px 0 #101517",
                    borderRadius: isMine ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    lineHeight: 1.35,
                    wordBreak: "break-word",
                  }}
                >
                  {/* Attached Images */}
                  {msg.imageUrls && msg.imageUrls.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: msg.text ? "6px" : "0" }}>
                      {msg.imageUrls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                          <img
                            src={url}
                            alt="Attachment"
                            style={{
                              maxWidth: "180px",
                              maxHeight: "140px",
                              borderRadius: "8px",
                              border: "1.5px solid #101517",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {msg.text && <div>{msg.text}</div>}
                </div>

                {/* Timestamp */}
                <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, padding: "0 4px" }}>
                  {timeStr}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Image Preview before Sending */}
      {previewUrl && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            background: "#fffded",
            borderTop: "1.5px solid #101517",
          }}
        >
          <img
            src={previewUrl}
            alt="Upload preview"
            style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", border: "1.5px solid #101517" }}
          />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#101517", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedFile?.name}
          </span>
          <button
            type="button"
            onClick={handleRemoveFile}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "1.5px solid #101517",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: "4px 12px", background: "#fee2e2", color: "#b91c1c", fontSize: "0.72rem", fontWeight: 800, borderTop: "1px solid #ef4444" }}>
          {error}
        </div>
      )}

      {/* Bottom Typing Box Bar */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          background: "#ffffff",
          borderTop: "2px solid #101517",
          flexShrink: 0,
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: "none" }}
        />

        {/* Upload Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "36px",
            height: "36px",
            display: "grid",
            placeItems: "center",
            background: "#fffded",
            border: "2px solid #101517",
            borderRadius: "8px",
            boxShadow: "2px 2px 0 #101517",
            cursor: "pointer",
            color: "#101517",
            flexShrink: 0,
          }}
          title="Attach an image"
          aria-label="Attach image"
        >
          <ImageIcon size={18} />
        </button>

        {/* Text Input Box */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            height: "36px",
            padding: "0 12px",
            fontSize: "0.85rem",
            background: "#f8fafc",
            border: "2px solid #101517",
            borderRadius: "8px",
            color: "#101517",
            outline: "none",
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !selectedFile)}
          style={{
            height: "36px",
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#2563eb",
            color: "#ffffff",
            border: "2px solid #101517",
            borderRadius: "8px",
            boxShadow: "2px 2px 0 #101517",
            cursor: isSending || (!text.trim() && !selectedFile) ? "not-allowed" : "pointer",
            opacity: isSending || (!text.trim() && !selectedFile) ? 0.6 : 1,
            fontWeight: 800,
            fontSize: "0.8rem",
            flexShrink: 0,
          }}
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
