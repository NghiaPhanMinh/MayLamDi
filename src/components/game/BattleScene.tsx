import { UiIcon } from "../common/UiIcon";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { jsPDF } from "jspdf";
import {
  BookOpen,
  BarChart2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Flag,
  Gamepad2,
  GripHorizontal,
  Shield,
  ShieldCheck,
  ShieldX,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errors";

import { SVGDefs } from "./landscape/SVGDefs";
import { LandscapeSky } from "./landscape/LandscapeSky";
import { LandscapeTerrain } from "./landscape/LandscapeTerrain";
import { LandscapeVillage } from "./landscape/LandscapeVillage";
import { LandscapeGoblins, getGoblinCoordinates } from "./landscape/LandscapeGoblins";
import { LandscapePlayers, getMageTheme, getPlayerCoordinates, getPlayerStaffTip } from "./landscape/LandscapePlayers";
import { LandscapeDragon, DRAGON_ORIGINAL_SHAPES, parseCoordinates } from "./landscape/LandscapeDragon";
import { LandscapeFX, type ActiveAttacker } from "./landscape/LandscapeFX";
import { LandscapeQuestBoard, type QuestTask } from "./landscape/LandscapeQuestBoard";
import { LandscapeTutorial } from "./landscape/LandscapeTutorial";
import { CharacterAvatar } from "../common/CharacterAvatar";
import {
  gameAudio,
  sendWebNotification,
  requestWebPushPermission,
  areNotificationsEnabled,
} from "../../lib/gameAudio";
import { useTheme } from "../../hooks/useTheme";

const BOSS_FUNNY_NAMES = [
  "Lord Procrastinax the Ever-Delaying",
  "Baron Bug-a-Lot, Scourge of Sprints",
  "Dread Wyrm Merge-Conflictus",
  "Archmage 404: Sleep Not Found",
  "Ignis Deadlineus, Consumer of Weekends",
  "Overlord Scope-Creep the Endless",
  "Duke NullPointer the Unhandled",
];

const VILLAGE_FUNNY_NAMES = [
  "Town of Last-Minute Hope",
  "Sanctuary of Clean Commits",
  "Citadel of Coffee & Prayers",
  "The Shire of Passed Tests",
  "Fortress of Zero Warnings",
  "Hamlet of 11:59 PM Submissions",
  "Haven of the All-Nighters",
];

function getFunnyName(list: string[], seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return list[Math.abs(hash) % list.length];
}

function PeerReviewEvidencePreview({ taskId }: { taskId: Id<"tasks"> }) {
  const details = useQuery(api.evidence.listForTask, { taskId });

  if (details === undefined) {
    return (
      <div style={{ fontSize: "0.75rem", color: "var(--color-muted, #64748b)", fontStyle: "italic" }}>
        Loading attached proof...
      </div>
    );
  }

  const evidence = details.evidence ?? [];

  if (evidence.length === 0) {
    return (
      <div
        style={{
          fontSize: "0.76rem",
          color: "var(--color-muted, #64748b)",
          fontStyle: "italic",
          padding: "8px 10px",
          background: "var(--mld-surface-01, #f8fafc)",
          borderRadius: "8px",
          border: "1px dashed var(--color-border, #cbd5e1)",
        }}
      >
        No proof attached yet by the assignee.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--color-text, #101517)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Attached Proof & Evidence ({evidence.length}):
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {evidence.map((item) => (
          <div
            key={item._id}
            style={{
              padding: "8px 10px",
              background: "var(--mld-surface-01, #f8fafc)",
              borderRadius: "8px",
              border: "1px solid var(--color-border, #e2e8f0)",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.68rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "#e2e8f0",
                  color: "#334155",
                  textTransform: "uppercase",
                }}
              >
                {item.type}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--color-muted, #64748b)" }}>
                by {item.submitterName}
              </span>
            </div>

            {item.note && (
              <p style={{ margin: "4px 0", color: "var(--color-text, #101517)", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                {item.note}
              </p>
            )}

            {item.url && (
              <div style={{ marginTop: "4px" }}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#2563eb",
                    textDecoration: "underline",
                    wordBreak: "break-all",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                  }}
                >
                  <UiIcon name="Link" /> <span>{item.url}</span>
                </a>
              </div>
            )}

            {item.fileUrl && (
              <div style={{ marginTop: "6px" }}>
                {item.type === "image" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer">
                      <img
                        src={item.fileUrl}
                        alt={item.fileName ?? "Proof image"}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "220px",
                          borderRadius: "6px",
                          objectFit: "contain",
                          border: "1px solid #cbd5e1",
                          display: "block",
                          background: "#ffffff",
                        }}
                      />
                    </a>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-muted, #64748b)" }}>
                      {item.fileName} {item.fileSize ? `(${(item.fileSize / 1024).toFixed(0)} KB)` : ""} (Click to open full view)
                    </span>
                  </div>
                ) : (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#2563eb",
                      textDecoration: "underline",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 700,
                    }}
                  >
                    <UiIcon name="FileText" /> <span>View {item.fileName ?? "Uploaded File"} {item.fileSize ? `(${(item.fileSize / 1024).toFixed(0)} KB)` : ""}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type BattleSceneProps = {
  projectId: Id<"projects">;
  currentPhase?: string;
  tasksLocked?: boolean;
  openTaskId?: Id<"tasks"> | null;
  onClearOpenTaskId?: () => void;
  activeBattleAction?: "my_tasks" | "peer_review" | null;
  onClearActiveBattleAction?: () => void;
};

type OptionalBattleMetrics = {
  goblinsRemaining?: number;
  totalGoblinsForProject?: number;
  isVillageDestroyed?: boolean;
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

const SHAPE_LABELS: Record<string, string> = {
  backWing_membrane1: "Back Wing Membrane 1",
  backWing_membrane2: "Back Wing Membrane 2",
  backWing_membrane3: "Back Wing Membrane 3",
  backWing_strut1: "Back Wing Bone Strut 1",
  backWing_strut2: "Back Wing Bone Strut 2",
  backWing_joint: "Back Wing Joint",
  backWing_claw: "Back Wing Claw",
  frontWing_membrane1: "Front Wing Membrane 1",
  frontWing_membrane2: "Front Wing Membrane 2",
  frontWing_membrane3: "Front Wing Membrane 3",
  frontWing_strut1: "Front Wing Bone Strut 1",
  frontWing_strut2: "Front Wing Bone Strut 2",
  frontWing_joint: "Front Wing Joint",
  frontWing_claw: "Front Wing Claw",
  tail_seg1: "Tail Segment 1",
  tail_seg2: "Tail Segment 2",
  tail_seg3: "Tail Segment 3",
  tail_shadow: "Tail Shadow Overlay",
  tail_barb1: "Tail Barb Tip 1",
  tail_barb2: "Tail Barb Tip 2",
  tail_barb3: "Tail Barb Tip 3",
  tail_spine1: "Tail Spine 1",
  tail_spine2: "Tail Spine 2",
  tail_spine3: "Tail Spine 3",
  spine1: "Dorsal Spine 1",
  spine2: "Dorsal Spine 2",
  spine3: "Dorsal Spine 3",
  spine4: "Dorsal Spine 4",
  spine5: "Dorsal Spine 5",
  spine6: "Dorsal Spine 6",
  spine7: "Dorsal Spine 7",
  backLeg_thigh: "Back Leg Thigh",
  backLeg_knee: "Back Leg Knee Joint",
  backLeg_calf: "Back Leg Calf",
  backLeg_ankle: "Back Leg Ankle Joint",
  backLeg_foot: "Back Leg Foot",
  backLeg_claw1: "Back Leg Talon 1",
  backLeg_claw2: "Back Leg Talon 2",
  backLeg_claw3: "Back Leg Talon 3",
  torso_base: "Torso Main Frame",
  torso_plate1: "Torso Muscle Overlay 1",
  torso_plate2: "Torso Muscle Overlay 2",
  torso_chest1: "Chest Segment Plate 1",
  torso_chest2: "Chest Segment Plate 2",
  torso_chest3: "Chest Segment Plate 3",
  torso_chest4: "Chest Segment Plate 4",
  torso_chest5: "Chest Segment Plate 5",
  frontLeg_thigh: "Front Leg Thigh",
  frontLeg_knee: "Front Leg Knee Joint",
  frontLeg_calf: "Front Leg Calf",
  frontLeg_ankle: "Front Leg Ankle Joint",
  frontLeg_foot: "Front Leg Foot",
  frontLeg_claw1: "Front Leg Talon 1",
  frontLeg_claw2: "Front Leg Talon 2",
  frontLeg_claw3: "Front Leg Talon 3",
  frontArm_shoulder: "Shoulder Joint",
  frontArm_bicep: "Muscular Bicep",
  frontArm_elbow: "Elbow Joint",
  frontArm_forearm: "Forearm Frame",
  frontArm_wrist: "Wrist Joint",
  frontArm_claw1: "Arm Talon 1",
  frontArm_claw2: "Arm Talon 2",
  neck_base1: "Neck Segment 1",
  neck_base2: "Neck Segment 2",
  neck_plate1: "Neck Plate 1",
  neck_plate2: "Neck Plate 2",
  neck_plate3: "Neck Plate 3",
  mouth_cavity: "Throat Cavity Backfill",
  skull_base: "Skull Core base",
  mouth_webbing: "Mouth Flap Webbing",
  snout_base: "Snout structure",
  snout_nostril: "Nostril Cavity",
  lower_jaw: "Lower Jawbone",
  upper_fang1: "Upper Fang 1",
  upper_fang2: "Upper Fang 2",
  upper_fang3: "Upper Fang 3",
  upper_fang4: "Upper Fang 4",
  upper_fang5: "Upper Fang 5",
  upper_fang6: "Upper Fang 6",
  lower_fang1: "Lower Fang 1",
  lower_fang2: "Lower Fang 2",
  lower_fang3: "Lower Fang 3",
  lower_fang4: "Lower Fang 4",
  horn1: "Main Lightning Horn (Left)",
  horn2: "Under Lightning Horn (Right)",
  spine_head1: "Crest Horn Plate 1",
  spine_head2: "Crest Horn Plate 2",
  spine_head3: "Crest Horn Plate 3",
  eye_base: "Eye Iris",
  eye_pupil: "Eye Slit Pupil",
  eye_specular: "Eye Light Specular",
  eye_brow: "Eyebrow Plate",
  frontClaw_arm: "Rigged Claw Arm",
  frontClaw_claw1: "Claw Talon 1",
  frontClaw_claw2: "Claw Talon 2",
  frontClaw_claw3: "Claw Talon 3",
};

const LOCAL_STORAGE_KEY = "dragon_editor_config_v4";

const DEFAULT_DRAGON_OFFSETS: Record<string, { x: number; y: number; rotate: number; scale?: number }> = {
  "backWing_membrane1": { "x": 0, "y": 0, "rotate": 0 },
  "backWing_membrane2": { "x": 0, "y": 0, "rotate": 0 },
  "backWing_membrane3": { "x": 0, "y": 0, "rotate": 0 },
  "backWing_strut1": { "x": 0, "y": 0, "rotate": 0 },
  "backWing_strut2": { "x": 0, "y": 0, "rotate": 0 },
  "backWing_joint": { "x": 0, "y": 0, "rotate": 0 },
  "backWing_claw": { "x": 0, "y": 0, "rotate": 0 },
  "frontWing_membrane1": { "x": 0, "y": 0, "rotate": 0 },
  "frontWing_membrane2": { "x": 0, "y": 0, "rotate": 0 },
  "frontWing_membrane3": { "x": 0, "y": 0, "rotate": 0 },
  "frontWing_strut1": { "x": 0, "y": 0, "rotate": 0 },
  "frontWing_strut2": { "x": 0, "y": 0, "rotate": 0 },
  "frontWing_joint": { "x": 0, "y": 0, "rotate": 0 },
  "frontWing_claw": { "x": 0, "y": 0, "rotate": 0 },
  "tail_seg1": { "x": 0, "y": 0, "rotate": 0 },
  "tail_seg2": { "x": 0, "y": 0, "rotate": 0 },
  "tail_seg3": { "x": 0, "y": 0, "rotate": 0 },
  "tail_shadow": { "x": 64, "y": 32, "rotate": 0 },
  "tail_barb1": { "x": 16, "y": -6, "rotate": 0 },
  "tail_barb2": { "x": 0, "y": 0, "rotate": 0 },
  "tail_barb3": { "x": 13, "y": 22, "rotate": 0 },
  "tail_spine1": { "x": 0, "y": 8, "rotate": 0 },
  "tail_spine2": { "x": 0, "y": 0, "rotate": 0 },
  "tail_spine3": { "x": 0, "y": 0, "rotate": 0 },
  "spine1": { "x": 0, "y": 0, "rotate": 0 },
  "spine2": { "x": 0, "y": 0, "rotate": 0 },
  "spine3": { "x": 0, "y": 0, "rotate": 0 },
  "spine4": { "x": 0, "y": 0, "rotate": 0 },
  "spine5": { "x": 0, "y": 0, "rotate": 0 },
  "spine6": { "x": 0, "y": 0, "rotate": 0 },
  "spine7": { "x": 231, "y": -80, "rotate": 60 },
  "backLeg_thigh": { "x": 0, "y": 0, "rotate": 0 },
  "backLeg_knee": { "x": 0, "y": 0, "rotate": 0 },
  "backLeg_calf": { "x": 0, "y": 0, "rotate": 0 },
  "backLeg_ankle": { "x": -12, "y": -15, "rotate": 0 },
  "backLeg_foot": { "x": -9, "y": -9, "rotate": 0 },
  "backLeg_claw1": { "x": -2, "y": 2, "rotate": 0 },
  "backLeg_claw2": { "x": -5, "y": 3, "rotate": 0 },
  "backLeg_claw3": { "x": -10, "y": 8, "rotate": 0 },
  "torso_base": { "x": 0, "y": 0, "rotate": 0 },
  "torso_plate1": { "x": -89, "y": 51, "rotate": 0 },
  "torso_plate2": { "x": 10, "y": -2, "rotate": 0 },
  "torso_chest1": { "x": 0, "y": 0, "rotate": 0 },
  "torso_chest2": { "x": 4, "y": 0, "rotate": 0 },
  "torso_chest3": { "x": 0, "y": 0, "rotate": 0 },
  "torso_chest4": { "x": 0, "y": 0, "rotate": 0 },
  "torso_chest5": { "x": 0, "y": 0, "rotate": 0 },
  "frontLeg_thigh": { "x": 0, "y": 0, "rotate": 0 },
  "frontLeg_knee": { "x": 0, "y": 0, "rotate": 0 },
  "frontLeg_calf": { "x": 9, "y": 7, "rotate": 0 },
  "frontLeg_ankle": { "x": -3, "y": 2, "rotate": 0 },
  "frontLeg_foot": { "x": -1, "y": 7, "rotate": 0 },
  "frontLeg_claw1": { "x": -48, "y": -15, "rotate": 0 },
  "frontLeg_claw2": { "x": -50, "y": 7, "rotate": 0 },
  "frontLeg_claw3": { "x": -50, "y": 25, "rotate": 0 },
  "frontArm_shoulder": { "x": 0, "y": 0, "rotate": 0 },
  "frontArm_bicep": { "x": -92, "y": 87, "rotate": 0 },
  "frontArm_elbow": { "x": -26, "y": -43, "rotate": 0, "scale": 1.25 },
  "frontArm_forearm": { "x": -10, "y": 3, "rotate": 0 },
  "frontArm_wrist": { "x": -12, "y": -5, "rotate": 0 },
  "frontArm_claw1": { "x": -59, "y": -17, "rotate": 0 },
  "frontArm_claw2": { "x": -38, "y": -2, "rotate": 0 },
  "neck_base1": { "x": 0, "y": 0, "rotate": 0 },
  "neck_base2": { "x": 45, "y": 112, "rotate": -160 },
  "neck_plate1": { "x": 0, "y": 0, "rotate": 0 },
  "neck_plate2": { "x": 0, "y": 0, "rotate": 0 },
  "neck_plate3": { "x": 0, "y": 0, "rotate": 0 },
  "mouth_cavity": { "x": 13, "y": -4, "rotate": 0 },
  "skull_base": { "x": 0, "y": 0, "rotate": 0 },
  "mouth_webbing": { "x": 0, "y": 0, "rotate": 0 },
  "snout_base": { "x": 0, "y": 0, "rotate": 0 },
  "snout_nostril": { "x": 0, "y": 0, "rotate": 0 },
  "lower_jaw": { "x": 0, "y": 0, "rotate": 0 },
  "upper_fang1": { "x": 0, "y": 0, "rotate": 0 },
  "upper_fang2": { "x": 0, "y": 0, "rotate": 0 },
  "upper_fang3": { "x": 0, "y": 0, "rotate": 0 },
  "upper_fang4": { "x": 0, "y": 0, "rotate": 0 },
  "upper_fang5": { "x": 0, "y": 0, "rotate": 0 },
  "upper_fang6": { "x": 0, "y": 0, "rotate": 0 },
  "lower_fang1": { "x": 5, "y": -1, "rotate": 0 },
  "lower_fang2": { "x": 4, "y": -1, "rotate": 0 },
  "lower_fang3": { "x": 3, "y": -3, "rotate": 0 },
  "lower_fang4": { "x": 2, "y": -2, "rotate": 0 },
  "horn1": { "x": 0, "y": 0, "rotate": 0 },
  "horn2": { "x": 0, "y": 0, "rotate": 0 },
  "spine_head1": { "x": 0, "y": 0, "rotate": 0 },
  "spine_head2": { "x": -54, "y": 27, "rotate": 0 },
  "spine_head3": { "x": -81, "y": 13, "rotate": 0 },
  "eye_base": { "x": 5, "y": 5, "rotate": 0, "scale": 0.75 },
  "eye_pupil": { "x": -5, "y": 3, "rotate": 0 },
  "eye_specular": { "x": -5, "y": 4, "rotate": 0 },
  "eye_brow": { "x": 0, "y": 0, "rotate": 0 },
  "frontClaw_arm": { "x": 13, "y": 4, "rotate": 0 },
  "frontClaw_claw1": { "x": -14, "y": 1, "rotate": 0 },
  "frontClaw_claw2": { "x": -16, "y": 5, "rotate": 0 },
  "frontClaw_claw3": { "x": -13, "y": 4, "rotate": 0 },
  "custom_1786872953815": { "x": -269, "y": -119, "rotate": 0 },
  "custom_1786873091485": { "x": -123, "y": -127, "rotate": 260 },
  "custom_1786873263651": { "x": -92, "y": -132, "rotate": 80, "scale": 1.05 },
  "custom_1786873460613": { "x": -85, "y": -127, "rotate": 70, "scale": 1 },
  "custom_1786978504240": { "x": 0, "y": 0, "rotate": 0, "scale": 1 },
  "custom_1786978550424": { "x": 0, "y": 0, "rotate": 0, "scale": 100 },
  "custom_1786978786209": { "x": 33, "y": -29, "rotate": 0, "scale": 0.45 },
  "custom_1786978835140": { "x": 0, "y": 0, "rotate": 0, "scale": 2.4 },
  "custom_178697881829": { "x": 0, "y": 0, "rotate": 0, "scale": 1 },
  "custom_1786979572697": { "x": -71, "y": -129, "rotate": -15, "scale": 1 },
  "custom_1786979651336": { "x": -116, "y": -162, "rotate": 0, "scale": 1 },
  "custom_1786980002439": { "x": -67, "y": -107, "rotate": 80, "scale": 1.05 },
  "custom_1786980030730": { "x": -98, "y": -102, "rotate": 260, "scale": 1 },
  "custom_1786980038964": { "x": -92, "y": -148, "rotate": 0, "scale": 0.9 },
  "custom_1786980109541": { "x": -76, "y": -155, "rotate": 0, "scale": 0.9 },
  "custom_1786980127871": { "x": -65, "y": -161, "rotate": 0, "scale": 0.9 },
  "custom_1786980243010": { "x": -124, "y": -101, "rotate": 0, "scale": 0.75 },
  "custom_1786980264091": { "x": -121, "y": -97, "rotate": 0, "scale": 0.75 },
  "custom_1786980270419": { "x": -118, "y": -92, "rotate": 0, "scale": 0.75 }
};

const DEFAULT_DRAGON_FILLS: Record<string, string> = {
  "frontWing_membrane2": "#2b0808",
  "frontWing_membrane1": "#4a0d0d",
  "frontArm_shoulder": "#9a1d1d",
  "lower_jaw": "#810404",
  "backLeg_thigh": "#2a0404",
  "backLeg_knee": "#1c0202",
  "frontWing_membrane3": "#000000",
  "neck_base1": "#8a1414"
};

const DEFAULT_DELETED_SHAPES: Record<string, boolean> = {
  "horn1": true,
  "horn2": true,
  "spine_head2": true,
  "spine_head3": true,
  "mouth_webbing": true,
  "spine_head1": true,
  "frontArm_bicep": true,
  "frontArm_claw2": true,
  "frontArm_claw1": true,
  "tail_barb3": true,
  "frontLeg_claw1": true,
  "frontLeg_claw2": true,
  "frontLeg_claw3": true,
  "tail_shadow": true,
  "torso_plate1": true,
  "eye_brow": true
};

const DEFAULT_CUSTOM_SHAPES = [
  {
    "id": "custom_1786873091485",
    "name": "Custom POLYGON (2)",
    "type": "polygon" as const,
    "fill": "#9c1111",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "0,-15 15,15 -15,15",
    "d": "M -15 -15 L 15 15",
    "rotate": 0
  },
  {
    "id": "custom_1786873263651",
    "name": "Custom POLYGON (3)",
    "type": "polygon" as const,
    "fill": "#b91c1c",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "0,-15 10,15 -15,20",
    "d": "M -15 -15 L 15 15",
    "rotate": 0
  },
  {
    "id": "custom_1786873460613",
    "name": "Custom POLYGON (4)",
    "type": "polygon" as const,
    "fill": "#e6ac2d",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "0,-20 2,15 -15,15",
    "d": "M -15 -15 L 15 15",
    "rotate": 0
  },
  {
    "id": "custom_1786978550424",
    "name": "Custom CIRCLE (4)",
    "type": "circle" as const,
    "fill": "#b91c1c",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 15,
    "ry": 0,
    "points": "0,-15 15,15 -15,15",
    "d": "M -15 -15 L 15 15",
    "rotate": 0
  },
  {
    "id": "custom_1786978881829",
    "name": "Custom PATH (6)",
    "type": "path" as const,
    "fill": "#b91c1c",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "0,-15 15,15 -15,15",
    "d": "M -15 -15 L 15 15",
    "rotate": 0
  },
  {
    "id": "custom_1786979572697",
    "name": "Duplicate of Custom POLYGON (4)",
    "type": "polygon" as const,
    "fill": "#e6ac2d",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "-11,-26 -6,8 -26,3",
    "d": "-11,-26 -6,8 -26,3",
    "rotate": 70
  },
  {
    "id": "custom_1786979651336",
    "name": "Custom POLYGON (7)",
    "type": "polygon" as const,
    "fill": "#811212",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "0,-15 15,15 -15,15",
    "d": "M -15 -15 L 15 15",
    "rotate": 0
  },
  {
    "id": "custom_1786980038964",
    "name": "Duplicate of Custom POLYGON (7)",
    "type": "polygon" as const,
    "fill": "#4e0909",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "-9,10 11,18 -24,17",
    "d": "-9,10 11,18 -24,17",
    "rotate": 0
  },
  {
    "id": "custom_1786980109541",
    "name": "Duplicate of Duplicate of Custom POLYGON (7)",
    "type": "polygon" as const,
    "fill": "#a0771c",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "-30,-2 2,-5 -24,17",
    "d": "-30,-2 2,-5 -24,17",
    "rotate": 0
  },
  {
    "id": "custom_1786980127871",
    "name": "Duplicate of Duplicate of Duplicate of Custom POLYGON (7)",
    "type": "polygon" as const,
    "fill": "#a0771c",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "-30,-2 2,-5 -24,17",
    "d": "-30,-2 2,-5 -24,17",
    "rotate": 0
  },
  {
    "id": "custom_1786980243010",
    "name": "Duplicate of Back Leg Talon 1",
    "type": "polygon" as const,
    "fill": "#a8a8a8",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "125,264 102,276 120,256",
    "d": "125,264 102,276 120,256",
    "rotate": 0
  },
  {
    "id": "custom_1786980264091",
    "name": "Duplicate of Duplicate of Back Leg Talon 1",
    "type": "polygon" as const,
    "fill": "#a8a8a8",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "125,264 102,276 120,256",
    "d": "125,264 102,276 120,256",
    "rotate": 0
  },
  {
    "id": "custom_1786980270419",
    "name": "Duplicate of Duplicate of Duplicate of Back Leg Talon 1",
    "type": "polygon" as const,
    "fill": "#b0b0b0",
    "x": 150,
    "y": 150,
    "width": 40,
    "height": 30,
    "rx": 0,
    "ry": 0,
    "points": "125,264 102,276 120,256",
    "d": "125,264 102,276 120,256",
    "rotate": 0
  }
];

const DEFAULT_DRAGON_GEOMETRIES: Record<string, string> = {
  "backWing_membrane1": "M 120 110 Q 180 -40 320 -70 Q 250 10 210 70 Q 160 50 120 110 Z",
  "backWing_membrane2": "M 320 -70 Q 270 20 230 85 Q 180 80 120 110 Q 200 10 320 -70 Z",
  "backWing_membrane3": "M 230 85 Q 180 40 120 110 Q 170 80 230 85 Z",
  "backWing_strut1": "M 120 110 Q 220 -20 320 -70",
  "backWing_strut2": "M 120 110 Q 185 10 230 85",
  "backWing_claw": "320,-70 334,-84 324,-58",
  "frontWing_membrane1": "M 110 115 Q 10 -40 -80 -60 Q 0 15 50 80 Q 80 60 110 115 Z",
  "frontWing_membrane2": "M -80 -60 Q -10 35 30 100 Q 70 85 130 125 Z",
  "frontWing_membrane3": "M 30 100 Q 65 60 130 125 Q 75 95 30 100 Z",
  "frontWing_strut1": "M 110 115 Q 20 10 -80 -60",
  "frontWing_strut2": "M 110 115 Q 50 30 30 100",
  "frontWing_claw": "-70,-50 -85,-65 -74,-38",
  "tail_seg1": "M 160 150 Q 220 160 255 190 L 240 215 Q 215 190 165 175 Z",
  "tail_seg2": "M 255 190 Q 285 225 265 260 L 245 255 Q 260 235 240 215 Z",
  "tail_seg3": "M 265 260 Q 240 280 205 270 L 210 255 Q 235 262 245 255 Z",
  "tail_shadow": "M 245 255 Q 235 262 205 270 Q 220 285 245 255 Z",
  "tail_barb1": "205,270 170,290 192,260",
  "tail_barb2": "205,270 182,252 196,263",
  "tail_barb3": "205,270 188,285 198,272",
  "tail_spine1": "230,170 242,158 238,175",
  "tail_spine2": "275,215 290,208 280,225",
  "tail_spine3": "255,262 268,272 250,268",
  "spine1": "35,42 22,22 42,35",
  "spine2": "55,58 45,38 62,52",
  "spine3": "80,78 72,58 88,72",
  "spine4": "105,98 111,90 110,95",
  "spine5": "135,118 122,100 138,114",
  "spine6": "165,138 152,120 168,134",
  "spine7": "195,152 190,136 203,144",
  "backLeg_thigh": "M 150 145 C 205 160 210 205 185 215 C 145 205 140 180 150 145 Z",
  "backLeg_calf": "M 185 215 L 165 255 L 140 248 L 170 208 Z",
  "backLeg_foot": "M 165 255 L 125 264 L 128 252 L 158 246 Z",
  "backLeg_claw1": "125,264 102,276 120,256",
  "backLeg_claw2": "128,266 108,280 125,258",
  "backLeg_claw3": "132,268 114,284 130,260",
  "torso_base": "M 50 110 C 115 65 200 100 185 180 C 145 210 70 195 50 110 Z",
  "torso_plate1": "M 150 135 C 195 150 185 195 140 185 Z",
  "torso_plate2": "M 136 99 C 193 125 195 220 131 195 C 141 150 161 121 133 98 Z",
  "torso_chest1": "M 58 122 C 92 150 135 145 144 132 Q 130 170 66 152 Z",
  "torso_chest2": "M 64 132 C 72 165 130 152 136 139 Q 122 174 63 155 Z",
  "torso_chest3": "M 66 153 C 98 165 125 158 135 148 Q 115 178 79 165 Z",
  "torso_chest4": "M 70 157 C 95 173 120 164 128 154 Q 110 182 92 177 Z",
  "torso_chest5": "M 76 163 C 102 176 116 170 122 160 Q 108 185 92 178 Z",
  "frontLeg_thigh": "M 145 150 C 195 165 198 210 175 220 C 135 210 132 185 145 150 Z",
  "frontLeg_calf": "M 175 220 L 155 260 L 130 252 L 160 212 Z",
  "frontLeg_foot": "M 155 260 L 115 270 L 118 258 L 148 252 Z",
  "frontLeg_claw1": "115,270 92,284 110,262",
  "frontLeg_claw2": "118,272 98,288 114,264",
  "frontLeg_claw3": "122,274 104,292 118,266",
  "frontArm_bicep": "M 95 120 L 60 155 L 45 145 L 82 112 Z",
  "frontArm_forearm": "M 60 155 L 30 148 L 28 135 L 52 142 Z",
  "frontArm_claw1": "30,148 10,160 24,142",
  "frontArm_claw2": "32,150 14,164 26,144",
  "neck_base1": "M 70 125 Q 35 90 30 55 Q 15 30 52 18 Q 80 38 86 102 Z",
  "neck_base2": "M 35 90 Q 30 55 15 30 Q 30 35 49 61 Z",
  "neck_plate1": "M 28 50 C 44 42 60 48 68 56 C 54 62 38 58 28 50 Z",
  "neck_plate2": "M 32 64 C 48 56 64 62 72 70 C 58 76 42 72 32 64 Z",
  "neck_plate3": "M 36 78 C 52 70 68 76 76 84 C 62 90 46 86 36 78 Z",
  "mouth_cavity": "M 32 20 L -23 10 L -16 28 L 8 40 L 32 30 Z",
  "skull_base": "M 48 20 L -24 5 L 8 -4 L 62 8 Z",
  "mouth_webbing": "M 28 20 Q 20 28 8 36 Q 22 38 28 20 Z",
  "snout_base": "-24,5 -7,2 6,-3 -17,0",
  "lower_jaw": "M 42 27 L -27 14 L 13 41 Z",
  "upper_fang1": "-16,7 -19,15 -10,8",
  "upper_fang2": "-10,8 -14,16 -4,9",
  "upper_fang3": "-4,9 -8,17 1,11",
  "upper_fang4": "2,10 0,18 7,12",
  "upper_fang5": "8,11 6,19 13,13",
  "upper_fang6": "14,12 12,20 19,14",
  "lower_fang1": "-20,20 -13,13 -15,21",
  "lower_fang2": "-12,22 -7,14 -7,24",
  "lower_fang3": "-4,24 1,16 1,26",
  "lower_fang4": "3,26 8,18 9,29",
  "horn1": "M 42 6 L 64 -12 L 54 -14 L 82 -32 L 58 -18 L 66 -16 Z",
  "horn2": "M 37 2 L 59 -16 L 49 -18 L 77 -36 L 53 -22 L 61 -20 Z",
  "spine_head1": "42,8 55,-4 58,10",
  "spine_head2": "30,18 12,14 26,26",
  "spine_head3": "38,16 22,8 34,22",
  "eye_pupil": "28,-1 30,4 28,9 26,4",
  "eye_brow": "21,-3 42,1 37,4 16,2",
  "frontClaw_arm": "M 85 115 L 50 148 L 30 140 Q 60 110 85 115 Z",
  "frontClaw_claw1": "30,140 15,150 27,136",
  "frontClaw_claw2": "33,143 19,154 30,139",
  "frontClaw_claw3": "36,146 23,157 33,142",
  "custom_1786873091485": "0,-15 15,15 -8,16",
  "custom_1786873263651": "-10,-17 7,15 -15,16",
  "custom_1786873460613": "-11,-26 -2,4 -26,7",
  "custom_1786978504240": "M 47 -39 L 72 -24",
  "custom_1786978835140": "M -15 -15 L -41 25",
  "custom_1786978881829": "M -15 -15 L 20 -17",
  "custom_1786979572697": "-8,-26 -6,3 -26,-2",
  "custom_1786979651336": "-9,10 11,18 -24,17",
  "custom_1786980002439": "-14,-12 7,15 -15,16",
  "custom_1786980030730": "0,-15 2,26 -8,16",
  "custom_1786980038964": "-30,-2 2,-5 -24,17",
  "custom_1786980109541": "-34,-2 2,-5 -24,17",
  "custom_1786980127871": "-30,-2 -3,-4 -24,17",
  "custom_1786980243010": "125,264 102,276 120,256",
  "custom_1786980264091": "125,264 102,276 120,256",
  "custom_1786980270419": "125,264 102,276 120,256"
};

const DEFAULT_LAYER_ORDER = [
  "custom_1786978550424",
  "backWing_membrane1",
  "backWing_membrane2",
  "backWing_membrane3",
  "backWing_strut1",
  "backWing_strut2",
  "backWing_joint",
  "backWing_claw",
  "frontWing_membrane1",
  "frontWing_membrane2",
  "frontWing_membrane3",
  "frontWing_strut1",
  "frontWing_strut2",
  "frontWing_joint",
  "frontWing_claw",
  "tail_seg1",
  "tail_seg2",
  "tail_seg3",
  "tail_shadow",
  "tail_barb1",
  "tail_barb2",
  "tail_barb3",
  "tail_spine1",
  "tail_spine2",
  "tail_spine3",
  "spine1",
  "spine2",
  "spine3",
  "spine4",
  "spine5",
  "spine6",
  "spine7",
  "backLeg_thigh",
  "backLeg_knee",
  "backLeg_calf",
  "backLeg_ankle",
  "backLeg_foot",
  "backLeg_claw1",
  "custom_1786980243010",
  "custom_1786980264091",
  "custom_1786980270419",
  "backLeg_claw2",
  "backLeg_claw3",
  "torso_base",
  "torso_plate1",
  "torso_plate2",
  "torso_chest1",
  "torso_chest2",
  "torso_chest3",
  "torso_chest4",
  "torso_chest5",
  "frontLeg_thigh",
  "custom_1786980038964",
  "custom_1786980109541",
  "custom_1786980127871",
  "frontLeg_knee",
  "frontLeg_calf",
  "frontLeg_ankle",
  "frontLeg_foot",
  "frontLeg_claw1",
  "frontLeg_claw2",
  "frontLeg_claw3",
  "frontArm_shoulder",
  "frontArm_bicep",
  "frontArm_forearm",
  "frontArm_wrist",
  "frontArm_claw1",
  "frontArm_claw2",
  "neck_base1",
  "neck_base2",
  "neck_plate1",
  "neck_plate2",
  "neck_plate3",
  "mouth_cavity",
  "skull_base",
  "mouth_webbing",
  "snout_base",
  "snout_nostril",
  "lower_jaw",
  "upper_fang1",
  "upper_fang2",
  "upper_fang3",
  "upper_fang4",
  "upper_fang5",
  "upper_fang6",
  "lower_fang1",
  "lower_fang2",
  "lower_fang3",
  "lower_fang4",
  "horn1",
  "horn2",
  "spine_head1",
  "spine_head2",
  "spine_head3",
  "eye_base",
  "eye_pupil",
  "eye_specular",
  "eye_brow",
  "frontClaw_arm",
  "frontClaw_claw1",
  "frontArm_elbow",
  "frontClaw_claw2",
  "frontClaw_claw3",
  "custom_1786873091485",
  "custom_1786873460613",
  "custom_1786979572697",
  "custom_1786873263651",
  "custom_1786978881829",
  "custom_1786979651336"
];

function loadSavedConfig() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.dragonOffsets && parsed.customShapes && parsed.dragonGeometries && parsed.layerOrder) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading config from localStorage:", e);
  }
  return null;
}

type BattleResultBoardProps = {
  variant: "success" | "failed";
  title: string;
  description: string;
  villageHp: number;
  bossRemainingHp: number;
  bossMaximumHp: number;
  verifiedQuests: number;
  canRemoveRoom: boolean;
  onDownloadContribution: () => void;
  onOpenLeaderboard?: () => void;
  onViewBattle: () => void;
  onRemoveRoom: () => void;
};

function BattleResultBoard({
  variant,
  title,
  description,
  canRemoveRoom,
  onDownloadContribution,
  onViewBattle,
  onRemoveRoom,
}: BattleResultBoardProps) {
  const isSuccess = variant === "success";
  const ResultIcon = isSuccess ? ShieldCheck : ShieldX;
  const BadgeIcon = isSuccess ? ShieldCheck : TriangleAlert;

  return (
    <div className={`battle-result-board is-${variant}`} data-result-variant={variant}>
      <div className="battle-result-accent-rail" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className="battle-result-header">
        <div className="battle-result-emblem" aria-hidden="true">
          <ResultIcon strokeWidth={2} />
          {isSuccess ? <Sparkles className="battle-result-emblem-detail" /> : <TriangleAlert className="battle-result-emblem-detail" />}
        </div>
        <div className="battle-result-badge">
          <BadgeIcon size={17} strokeWidth={2.25} aria-hidden="true" />
          <span>{isSuccess ? "Project completed" : "Project incomplete"}</span>
        </div>
        <h2 id="endgame-title" className="battle-result-title">{title}</h2>
        <p className="battle-result-description">{description}</p>
      </header>

      <div className="battle-result-main-actions" aria-label="Result actions">
        <button type="button" className="battle-result-action is-primary" onClick={onDownloadContribution}>
          <FileDown size={20} strokeWidth={2} aria-hidden="true" />
          Download personal contribution
        </button>
        <button type="button" className="battle-result-action is-battle" onClick={onViewBattle}>
          <Gamepad2 size={20} strokeWidth={2} aria-hidden="true" />
          View Battle Canvas
        </button>
      </div>

      {canRemoveRoom && (
        <div className="battle-result-danger-zone">
          <button type="button" className="battle-result-delete" onClick={onRemoveRoom}>
            <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
            Remove from my account
          </button>
        </div>
      )}
    </div>
  );
}

type QuestCardHoverItemProps = {
  task: QuestTask;
  palette: { bg: string; border: string; pin: string };
  isClaimingQuest: boolean;
  onClaim: (task: QuestTask) => void;
  onAttack: (task: QuestTask) => void;
  onDetails: (task: QuestTask) => void;
};

function QuestCardHoverItem({
  task,
  palette,
  isClaimingQuest,
  onClaim,
  onAttack,
  onDetails,
}: QuestCardHoverItemProps) {
  const [hovered, setHovered] = useState(false);
  const isCompleted = Boolean(task.isCompleted || task.status === "completed" || task.status === "verified");
  const isInReview = Boolean(task.status === "review" || task.status === "submitted" || task.status === "awaiting_creator");

  return (
    <div
      className="quest-card-item"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onDetails(task)}
      style={{
        opacity: isCompleted ? 0.45 : 1,
        background: hovered ? palette.bg : undefined,
      }}
    >
      {/* Top Header Row: Task Name & Assignee */}
      <div style={{ paddingRight: "70px" }}>
        <h4
          style={{
            margin: 0,
            fontSize: "0.98rem",
            fontWeight: 900,
            lineHeight: "1.25",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {task.title}
        </h4>

        {/* Owner Name Under */}
        <div
          className="quest-card-owner"
          style={{
            fontSize: "0.76rem",
            fontWeight: 700,
            color: task.isOpen ? "#dc2626" : undefined,
            marginTop: "3px",
          }}
        >
          {task.isOpen ? "Unassigned" : `By: ${task.assigneeName}`} · Due: {task.dueDate || "No date"}
        </div>
      </div>

      {/* Bottom Right Corner Status Badge */}
      <span
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          fontSize: "0.66rem",
          fontWeight: 900,
          color: isInReview ? "#b45309" : (isCompleted ? "#16a34a" : (task.isOpen ? "#0369a1" : "#dc2626")),
          background: isInReview ? "#fef3c7" : (isCompleted ? "#dcfce7" : (task.isOpen ? "#e0f2fe" : "#fee2e2")),
          border: `1px solid ${isInReview ? "#f59e0b" : (isCompleted ? "#22c55e" : (task.isOpen ? "#0284c7" : "#ef4444"))}`,
          padding: "1.5px 6px",
          borderRadius: "4px",
          letterSpacing: "0.02em",
          pointerEvents: "none",
          textTransform: "capitalize",
        }}
      >
        {isInReview ? "In Review" : (isCompleted ? "Completed" : (task.isOpen ? "Open" : "In Progress"))}
      </span>
    </div>
  );
}

export function BattleScene({
  projectId,
  currentPhase,
  tasksLocked = true,
  openTaskId = null,
  onClearOpenTaskId,
  activeBattleAction = null,
  onClearActiveBattleAction,
}: BattleSceneProps) {
  const state = useQuery(api.battle.getState, { projectId });
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Modal display toggles
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showAttackChoiceModal, setShowAttackChoiceModal] = useState(false);
  const [showGoblinModal, setShowGoblinModal] = useState(false);
  const [showBossModal, setShowBossModal] = useState(false);
  const [showMyTasksModal, setShowMyTasksModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [showAdjustElementsModal, setShowAdjustElementsModal] = useState(false);
  const [testBossDefeatedPreview, setTestBossDefeatedPreview] = useState(false);
  const [dummyReviewTaskDone, setDummyReviewTaskDone] = useState(false);
  const [isDummyTaskSubmitted, setIsDummyTaskSubmitted] = useState(false);
  const [selectedReviewTask, setSelectedReviewTask] = useState<any | null>(null);

  // Testing Dummy Attack configuration & modal
  const [isDummyTestingActive, setIsDummyTestingActive] = useState(false);
  const [dummyPlayerCount, setDummyPlayerCount] = useState(6);
  const [dummyElementFilter, setDummyElementFilter] = useState<"mixed" | "fire" | "ice" | "lightning" | "arcane">("mixed");
  const [showDummyTestModal, setShowDummyTestModal] = useState(false);

  // Draggable toolbar & progress bar offsets
  const [toolbarOffset, setToolbarOffset] = useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const [pvzBarPos, setPvzBarPos] = useState({ x: 0, y: 0 });
  const [isDraggingPvzBar, setIsDraggingPvzBar] = useState(false);
  const pvzBarDragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  // Draggable Adjust Elements Modal offset
  const [adjustModalPos, setAdjustModalPos] = useState({ x: 0, y: 0 });
  const [isDraggingAdjustModal, setIsDraggingAdjustModal] = useState(false);
  const adjustModalDragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  // Leaderboard data query
  const leaderboardData = useQuery(api.battle.getLeaderboard, { projectId });

  // Workspace data query for tasks & user profiles
  const workspace = useQuery(api.tasks.getWorkspace, { projectId });
  const isSoloProject = workspace?.project?.targetMemberCount === 1 || (workspace?.members?.length ?? 0) <= 1;

  // Goblin Flow state & mutations
  const postDailyEvidence = useMutation((api as any).daily.postDailyEvidence);
  const [goblinText, setGoblinText] = useState("");
  const [goblinImageInput, setGoblinImageInput] = useState("");
  const [goblinImageUrls, setGoblinImageUrls] = useState<string[]>([]);
  const [isSlaying, setIsSlaying] = useState(false);
  const [goblinError, setGoblinError] = useState<string | null>(null);

  // Boss Flow state & mutations
  const generateUploadUrl = useMutation(api.evidence.generateUploadUrl);
  const addEvidence = useMutation(api.evidence.add);
  const chooseReviewer = useMutation(api.tasks.chooseReviewer);
  const submitForReview = useMutation(api.evidence.submitForReview);
  const removeProjectFromMine = useMutation(api.projects.removeFromMine);
  const claimTaskMutation = useMutation(api.tasks.claimTask);
  const createTaskMutation = useMutation(api.tasks.createTask);
  const editQuestTaskMutation = useMutation(api.tasks.editQuestTask);

  // Quest Board States
  const [showQuestBoardModal, setShowQuestBoardModal] = useState(false);
  const [questBoardTab, setQuestBoardTab] = useState<"all" | "mine" | "reviews" | "daily_proof">("all");
  const [selectedQuestTask, setSelectedQuestTask] = useState<QuestTask | null>(null);

  useEffect(() => {
    if (openTaskId && workspace?.tasks) {
      const task = workspace.tasks.find((t) => t._id === openTaskId);
      if (task) {
        setSelectedTaskId(task._id);
        setShowBossModal(true);
      }
      onClearOpenTaskId?.();
    }
  }, [openTaskId, workspace, onClearOpenTaskId]);

  useEffect(() => {
    if (activeBattleAction === "my_tasks") {
      setShowMyTasksModal(true);
      onClearActiveBattleAction?.();
    } else if (activeBattleAction === "peer_review") {
      setShowPeerReviewModal(true);
      onClearActiveBattleAction?.();
    }
  }, [activeBattleAction, onClearActiveBattleAction]);

  // Drag movement handlers for bottom toolbar, top progress bar, and adjust elements modal
  useEffect(() => {
    if (!isDraggingToolbar && !isDraggingPvzBar && !isDraggingAdjustModal) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      if (isDraggingToolbar) {
        const dx = clientX - toolbarDragStartRef.current.mouseX;
        const dy = clientY - toolbarDragStartRef.current.mouseY;
        setToolbarOffset({
          x: toolbarDragStartRef.current.startX + dx,
          y: toolbarDragStartRef.current.startY - dy,
        });
      }

      if (isDraggingPvzBar) {
        const dx = clientX - pvzBarDragStartRef.current.mouseX;
        const dy = clientY - pvzBarDragStartRef.current.mouseY;
        setPvzBarPos({
          x: pvzBarDragStartRef.current.startX + dx,
          y: pvzBarDragStartRef.current.startY + dy,
        });
      }

      if (isDraggingAdjustModal) {
        const dx = clientX - adjustModalDragStartRef.current.mouseX;
        const dy = clientY - adjustModalDragStartRef.current.mouseY;
        setAdjustModalPos({
          x: adjustModalDragStartRef.current.startX + dx,
          y: adjustModalDragStartRef.current.startY + dy,
        });
      }
    };

    const handleEnd = () => {
      setIsDraggingToolbar(false);
      setIsDraggingPvzBar(false);
      setIsDraggingAdjustModal(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDraggingToolbar, isDraggingPvzBar, isDraggingAdjustModal]);
  const [showCreateQuestModal, setShowCreateQuestModal] = useState(false);
  const [isClaimingQuest, setIsClaimingQuest] = useState(false);
  const [claimQuestError, setClaimQuestError] = useState<string | null>(null);

  // Task Editing (Owner Only)
  const [editingTask, setEditingTask] = useState<QuestTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignee, setEditAssignee] = useState<string>("");
  const [editDamage, setEditDamage] = useState<number>(50);
  const [editIsOpen, setEditIsOpen] = useState(false);
  const [isSavingEditTask, setIsSavingEditTask] = useState(false);
  const [editTaskError, setEditTaskError] = useState<string | null>(null);

  // Daily Feed query for Daily Proof Tab
  const dailyPosts = useQuery((api as any).daily.listForProject, { projectId });

  // Reviews Mutation & State
  const submitReviewMutation = useMutation(api.evidence.submitReview);
  const decideCompletionMutation = useMutation(api.evidence.decideCompletion);
  const [reviewingTaskId, setReviewingTaskId] = useState<Id<"tasks"> | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [newQuestPhaseId, setNewQuestPhaseId] = useState<string>("");
  const [newQuestDueDate, setNewQuestDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);
  const [newQuestWeight, setNewQuestWeight] = useState<number>(3);
  const [newQuestAssignee, setNewQuestAssignee] = useState<string>("");
  const [isCreatingQuest, setIsCreatingQuest] = useState(false);
  const [createQuestError, setCreateQuestError] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
  const [evidenceType, setEvidenceType] = useState<"note" | "link" | "image" | "pdf">("note");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bossError, setBossError] = useState<string | null>(null);

  // Admin Security Password Gate ("taolamadmin")
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => sessionStorage.getItem("taolamadmin_auth") === "true");
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [adminPanelWidth, setAdminPanelWidth] = useState(540);
  const [adminTab, setAdminTab] = useState<"cheats" | "layers" | "dragon" | "sizing">("cheats");
  const [showLayerManagerModal, setShowLayerManagerModal] = useState(false);

  // Gameplay Testing Cheats (Show attack VFX, kill goblin, 50% village HP, kill dragon, test overdue)
  const [testVillageHpOverride, setTestVillageHpOverride] = useState<number | null>(null);
  const [testDragonHpOverride, setTestDragonHpOverride] = useState<number | null>(null);
  const [testDeadGoblins, setTestDeadGoblins] = useState<Record<string, boolean>>({});
  const [testActiveSpell, setTestActiveSpell] = useState<"lightning" | "fire" | "ice" | "all" | null>(null);
  const [testOverdueOverride, setTestOverdueOverride] = useState<boolean | null>(null);

  // Boss = Tasks & Village Scaling Mechanics Testing
  const [testExtraTasksCount, setTestExtraTasksCount] = useState<number>(0);
  const [testSimulatedOnTimeDamage, setTestSimulatedOnTimeDamage] = useState<number>(0);
  const [testSimulatedMissedDamage, setTestSimulatedMissedDamage] = useState<number>(0);
  const [testExtraPlayerCount, setTestExtraPlayerCount] = useState<number>(0);

  // Tuned Default Transforms matching user's custom canvas layout across all screens
  const DEFAULT_LAYER_TRANSFORMS: Record<string, { x: number; y: number; scale: number; visible: boolean }> = {
    sky: { x: 0, y: 0, scale: 1.05, visible: true },
    terrain: { x: 0, y: -4, scale: 1, visible: true },
    village: { x: 0, y: 0, scale: 1, visible: true },
    goblins: { x: 50, y: 0, scale: 1, visible: true },
    players: { x: 73, y: 44, scale: 0.95, visible: true },
    dragon: { x: -22, y: -33, scale: 1.05, visible: true },
    fx: { x: 0, y: 0, scale: 1.15, visible: true },
  };

  const DEFAULT_PVZ_BAR_OFFSET = { x: 10, y: 0, width: 482, scale: 1.05, visible: true };

  const DEFAULT_TERRAIN_OFFSETS = {
    mountain: { x: 2, y: 203, scale: 1 },
    island: { x: 0, y: 89, scale: 1 },
    green: { x: 0, y: 86, scale: 1 },
    cloud: { x: 64, y: 150, scale: 0.95 },
  };

  // Canvas Layer Transforms (All 10 layers customizable in Layout Admin)
  const [layerTransforms, setLayerTransforms] = useState<Record<string, { x: number; y: number; scale: number; visible: boolean }>>(() => {
    try {
      const saved = localStorage.getItem("layer_transforms_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.players && (parsed.players.x !== 0 || parsed.players.y !== 0)) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_LAYER_TRANSFORMS;
  });

  const [pvzBarOffset, setPvzBarOffset] = useState<{ x: number; y: number; width: number; scale: number; visible: boolean }>(() => {
    try {
      const saved = localStorage.getItem("pvz_bar_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.width === 482 || parsed.width > 400) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_PVZ_BAR_OFFSET;
  });

  useEffect(() => {
    localStorage.setItem("layer_transforms_config", JSON.stringify(layerTransforms));
  }, [layerTransforms]);

  useEffect(() => {
    localStorage.setItem("pvz_bar_config", JSON.stringify(pvzBarOffset));
  }, [pvzBarOffset]);

  const [terrainOffsets, setTerrainOffsets] = useState<{
    mountain: { x: number; y: number; scale: number };
    island: { x: number; y: number; scale: number };
    green: { x: number; y: number; scale: number };
    cloud: { x: number; y: number; scale: number };
  }>(() => {
    try {
      const saved = localStorage.getItem("terrain_elements_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mountain && parsed.mountain.y !== 130 && parsed.island?.y !== 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_TERRAIN_OFFSETS;
  });

  useEffect(() => {
    localStorage.setItem("terrain_elements_config", JSON.stringify(terrainOffsets));
  }, [terrainOffsets]);

  // Personal room removal & end-game states
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [deleteRoomError, setDeleteRoomError] = useState<string | null>(null);
  const [viewBattleSceneOverride, setViewBattleSceneOverride] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  // Dragon Death Debug Controls (live pose tweaking on bottom-left screen)
  const [deathDebugOpen, setDeathDebugOpen] = useState(true);
  const [deathDebugForceDefeated, setDeathDebugForceDefeated] = useState(false);
  const [deathRotation, setDeathRotation] = useState(-60);
  const [deathPivotX, setDeathPivotX] = useState(85);
  const [deathPivotY, setDeathPivotY] = useState(180);
  const [deathOffsetX, setDeathOffsetX] = useState(0);
  const [deathOffsetY, setDeathOffsetY] = useState(0);
  const [deathStopWings, setDeathStopWings] = useState(true);
  const [deathGlow, setDeathGlow] = useState(false);

  // Dragon Layout Vector Editor Admin States (All individual shapes, moveable panels, pausable animation)
  const savedConfig = useMemo(() => loadSavedConfig(), []);

  const [dragonOffsets, setDragonOffsets] = useState<Record<string, { x: number; y: number; rotate: number; scale?: number }>>(() => {
    return savedConfig?.dragonOffsets || DEFAULT_DRAGON_OFFSETS;
  });

  const [dragonFills, setDragonFills] = useState<Record<string, string>>(() => {
    return savedConfig?.dragonFills || DEFAULT_DRAGON_FILLS;
  });

  const [deletedShapes, setDeletedShapes] = useState<Record<string, boolean>>(() => {
    return savedConfig?.deletedShapes || DEFAULT_DELETED_SHAPES;
  });

  const [customShapes, setCustomShapes] = useState<any[]>(() => {
    return savedConfig?.customShapes || DEFAULT_CUSTOM_SHAPES;
  });

  const [dragonGeometries, setDragonGeometries] = useState<Record<string, string>>(() => {
    return savedConfig?.dragonGeometries || DEFAULT_DRAGON_GEOMETRIES;
  });

  const [layerOrder, setLayerOrder] = useState<string[]>(() => {
    return savedConfig?.layerOrder || DEFAULT_LAYER_ORDER;
  });

  // Undo/Redo history states
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history stack on load
  useEffect(() => {
    if (history.length === 0) {
      const initialSnapshot = {
        dragonOffsets: JSON.parse(JSON.stringify(dragonOffsets)),
        dragonFills: JSON.parse(JSON.stringify(dragonFills)),
        deletedShapes: JSON.parse(JSON.stringify(deletedShapes)),
        customShapes: JSON.parse(JSON.stringify(customShapes)),
        dragonGeometries: JSON.parse(JSON.stringify(dragonGeometries)),
        layerOrder: JSON.parse(JSON.stringify(layerOrder)),
      };
      setHistory([initialSnapshot]);
      setHistoryIndex(0);
    }
  }, []);

  function pushHistoryState(
    offsets = dragonOffsets,
    fills = dragonFills,
    deleted = deletedShapes,
    customs = customShapes,
    geoms = dragonGeometries,
    order = layerOrder
  ) {
    const snapshot = {
      dragonOffsets: JSON.parse(JSON.stringify(offsets)),
      dragonFills: JSON.parse(JSON.stringify(fills)),
      deletedShapes: JSON.parse(JSON.stringify(deleted)),
      customShapes: JSON.parse(JSON.stringify(customs)),
      dragonGeometries: JSON.parse(JSON.stringify(geoms)),
      layerOrder: JSON.parse(JSON.stringify(order)),
    };
    
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  }

  function handleUndo() {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const snapshot = history[newIdx];
      
      setDragonOffsets(snapshot.dragonOffsets);
      setDragonFills(snapshot.dragonFills);
      setDeletedShapes(snapshot.deletedShapes);
      setCustomShapes(snapshot.customShapes);
      setDragonGeometries(snapshot.dragonGeometries);
      setLayerOrder(snapshot.layerOrder);
      setHistoryIndex(newIdx);
    }
  }

  function handleRedo() {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const snapshot = history[newIdx];
      
      setDragonOffsets(snapshot.dragonOffsets);
      setDragonFills(snapshot.dragonFills);
      setDeletedShapes(snapshot.deletedShapes);
      setCustomShapes(snapshot.customShapes);
      setDragonGeometries(snapshot.dragonGeometries);
      setLayerOrder(snapshot.layerOrder);
      setHistoryIndex(newIdx);
    }
  }

  function handleDuplicateShape(targetId: string) {
    const id = `custom_${Date.now()}`;
    const isCustom = targetId.startsWith("custom_");
    const origShape = DRAGON_ORIGINAL_SHAPES.find(s => s.id === targetId);
    const custShape = customShapes.find(s => s.id === targetId);
    
    if (!origShape && !custShape) return;
    
    const baseType = isCustom ? custShape!.type : origShape!.type;
    const baseFill = dragonFills[targetId] || (isCustom ? custShape!.fill : origShape!.defaultFill);
    const baseGeom = dragonGeometries[targetId] || (isCustom ? (custShape!.d || custShape!.points) : (origShape!.d || origShape!.points)) || "";
    const targetOffset = dragonOffsets[targetId] || { x: 0, y: 0, rotate: 0, scale: 1 };
    
    const dupShape = {
      id,
      name: `Duplicate of ${isCustom ? custShape!.name : origShape!.name}`,
      type: baseType,
      fill: baseFill,
      x: isCustom ? custShape!.x : 150,
      y: isCustom ? custShape!.y : 150,
      width: isCustom ? (custShape!.width ?? 40) : (origShape!.width ?? 40),
      height: isCustom ? (custShape!.height ?? 30) : (origShape!.height ?? 30),
      rx: isCustom ? (custShape!.rx ?? 0) : (origShape!.rx ?? 0),
      ry: isCustom ? (custShape!.ry ?? 0) : (origShape!.ry ?? 0),
      points: baseGeom,
      d: baseGeom,
      rotate: targetOffset.rotate,
    };
    
    const nextOffsets = {
      ...dragonOffsets,
      [id]: {
        x: targetOffset.x + 25,
        y: targetOffset.y + 25,
        rotate: targetOffset.rotate,
        scale: targetOffset.scale ?? 1,
      }
    };
    
    const nextCustoms = [...customShapes, dupShape];
    const nextGeoms = { ...dragonGeometries, [id]: baseGeom };
    
    const nextOrder = [...layerOrder];
    const targetIdx = nextOrder.indexOf(targetId);
    if (targetIdx !== -1) {
      nextOrder.splice(targetIdx + 1, 0, id);
    } else {
      nextOrder.unshift(id);
    }
    
    setDragonOffsets(nextOffsets);
    setCustomShapes(nextCustoms);
    setDragonGeometries(nextGeoms);
    setLayerOrder(nextOrder);
    setSelectedDragonPart(id);
    
    pushHistoryState(nextOffsets, dragonFills, deletedShapes, nextCustoms, nextGeoms, nextOrder);
  }

  const [selectedDragonPart, setSelectedDragonPart] = useState<string | null>(null);
  const [showDragonEditor, setShowDragonEditor] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Interactive Cutscene Tutorial State (Hidden per user request)
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Sound & Web Push Notification System State
  const [showSoundSettingsModal, setShowSoundSettingsModal] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(() => gameAudio.getMuted());
  const [audioVolume, setAudioVolume] = useState(() => Math.round(gameAudio.getVolume() * 100));
  const [spellVolume, setSpellVolume] = useState(() => Math.round(gameAudio.getSpellVolume() * 100));
  const [bgmVolume, setBgmVolume] = useState(() => Math.round(gameAudio.getBgmVolume() * 100));
  const [isLofiBgmPlaying, setIsLofiBgmPlaying] = useState(() => gameAudio.isBgmActive());
  const [hasPushGranted, setHasPushGranted] = useState(() => areNotificationsEnabled());
  const [showGoblinAttackAlert, setShowGoblinAttackAlert] = useState(false);
  const [taskDeadlineAlertTask, setTaskDeadlineAlertTask] = useState<QuestTask | null>(null);

  // Display Experience Mode (Tool Mode vs Game Mode)
  const [displayMode, setDisplayMode] = useState<"game" | "tool">(() => {
    if (typeof window === "undefined") return "game";
    const projectSpecific = localStorage.getItem(`project_display_mode_${projectId}`);
    if (projectSpecific === "tool" || projectSpecific === "game") return projectSpecific;
    const globalSetting = localStorage.getItem("project_display_mode");
    if (globalSetting === "tool" || globalSetting === "game") return globalSetting;
    return "game";
  });

  const toggleDisplayMode = () => {
    const nextMode = displayMode === "game" ? "tool" : "game";
    setDisplayMode(nextMode);
    if (typeof window !== "undefined") {
      localStorage.setItem(`project_display_mode_${projectId}`, nextMode);
      localStorage.setItem("project_display_mode", nextMode);
    }
  };

  // Spawner states
  const [spawnerType, setSpawnerType] = useState<"circle" | "ellipse" | "rect" | "polygon" | "path">("circle");
  const [spawnerColor, setSpawnerColor] = useState("#b91c1c");

  // Moveable Panel coords
  const [panelPos, setPanelPos] = useState({ x: 80, y: 80 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Moveable Dragon & Village HP Bar Positions & Sizes
  const [dragonHpBarPos, setDragonHpBarPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dragonHpBarPos) return parsed.dragonHpBarPos;
      }
    } catch {}
    return { x: -14, y: 46 };
  });

  const [dragonHpBarWidth, setDragonHpBarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dragonHpBarWidth) return parsed.dragonHpBarWidth;
      }
    } catch {}
    return 243;
  });

  const [dragonHpBarHeight, setDragonHpBarHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dragonHpBarHeight) return parsed.dragonHpBarHeight;
      }
    } catch {}
    return 17;
  });

  const [dragonHpBarScale, setDragonHpBarScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dragonHpBarScale) return parsed.dragonHpBarScale;
      }
    } catch {}
    return 1.1;
  });

  const [villageHpBarPos, setVillageHpBarPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.villageHpBarPos) return parsed.villageHpBarPos;
      }
    } catch {}
    return { x: -63, y: 8 };
  });

  const [villageHpBarWidth, setVillageHpBarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.villageHpBarWidth) return parsed.villageHpBarWidth;
      }
    } catch {}
    return 140;
  });

  const [villageHpBarHeight, setVillageHpBarHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.villageHpBarHeight) return parsed.villageHpBarHeight;
      }
    } catch {}
    return 14;
  });

  const [villageHpBarScale, setVillageHpBarScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.villageHpBarScale) return parsed.villageHpBarScale;
      }
    } catch {}
    return 1.15;
  });

  const [testGoblinTargetIndex, setTestGoblinTargetIndex] = useState<number | null>(null);

  // Direct Shape Drag and Drop
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const dragShapeStart = useRef({ mouseX: 0, mouseY: 0, shapeX: 0, shapeY: 0 });

  // Vertex Node Dragging
  const [draggingNode, setDraggingNode] = useState<{ shapeId: string; xIdx: number; yIdx: number } | null>(null);
  const dragNodeStart = useRef({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });

  // Sync state to localStorage
  useEffect(() => {
    const config = {
      dragonOffsets,
      dragonFills,
      deletedShapes,
      customShapes,
      dragonGeometries,
      layerOrder,
      dragonHpBarPos,
      dragonHpBarWidth,
      dragonHpBarHeight,
      dragonHpBarScale,
      villageHpBarPos,
      villageHpBarWidth,
      villageHpBarHeight,
      villageHpBarScale,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  }, [
    dragonOffsets,
    dragonFills,
    deletedShapes,
    customShapes,
    dragonGeometries,
    layerOrder,
    dragonHpBarPos,
    dragonHpBarWidth,
    dragonHpBarHeight,
    dragonHpBarScale,
    villageHpBarPos,
    villageHpBarWidth,
    villageHpBarHeight,
    villageHpBarScale,
  ]);

  // Scroll selected layer stack row into view automatically
  useEffect(() => {
    if (selectedDragonPart) {
      const el = document.getElementById(`layer-row-${selectedDragonPart}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedDragonPart]);

  function handlePanelDragStart(e: React.MouseEvent) {
    setIsDraggingPanel(true);
    dragStartOffset.current = {
      x: e.clientX - panelPos.x,
      y: e.clientY - panelPos.y,
    };
  }

  function handleStartDragShape(shapeId: string, clientX: number, clientY: number) {
    const currentOffset = dragonOffsets[shapeId] || { x: 0, y: 0, rotate: 0, scale: 1 };
    setDraggingShapeId(shapeId);
    dragShapeStart.current = {
      mouseX: clientX,
      mouseY: clientY,
      shapeX: currentOffset.x,
      shapeY: currentOffset.y,
    };
  }

  function handleStartDragNode(shapeId: string, xIdx: number, yIdx: number, startX: number, startY: number, mouseX: number, mouseY: number) {
    setDraggingNode({ shapeId, xIdx, yIdx });
    dragNodeStart.current = {
      mouseX,
      mouseY,
      nodeX: startX,
      nodeY: startY,
    };
  }

  function handleMoveLayerUp(key: string) {
    const idx = layerOrder.indexOf(key);
    if (idx !== -1 && idx < layerOrder.length - 1) {
      const newOrder = [...layerOrder];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[idx + 1];
      newOrder[idx + 1] = temp;
      setLayerOrder(newOrder);
      pushHistoryState(dragonOffsets, dragonFills, deletedShapes, customShapes, dragonGeometries, newOrder);
    }
  }

  function handleMoveLayerDown(key: string) {
    const idx = layerOrder.indexOf(key);
    if (idx > 0) {
      const newOrder = [...layerOrder];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[idx - 1];
      newOrder[idx - 1] = temp;
      setLayerOrder(newOrder);
      pushHistoryState(dragonOffsets, dragonFills, deletedShapes, customShapes, dragonGeometries, newOrder);
    }
  }

  function handleSetLayerIndex(key: string, targetIdx: number) {
    const currentIdx = layerOrder.indexOf(key);
    if (currentIdx === -1) return;
    const validatedIdx = Math.max(0, Math.min(layerOrder.length - 1, targetIdx));
    const newOrder = [...layerOrder];
    const [item] = newOrder.splice(currentIdx, 1);
    newOrder.splice(validatedIdx, 0, item);
    setLayerOrder(newOrder);
    pushHistoryState(dragonOffsets, dragonFills, deletedShapes, customShapes, dragonGeometries, newOrder);
  }

  // Effect to drag Panel, drag individual shapes, and drag nodes
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isDraggingPanel) {
        setPanelPos({
          x: e.clientX - dragStartOffset.current.x,
          y: e.clientY - dragStartOffset.current.y,
        });
      }

      if (draggingShapeId) {
        const dx = e.clientX - dragShapeStart.current.mouseX;
        const dy = e.clientY - dragShapeStart.current.mouseY;
        
        const svgEl = document.querySelector(".layer-8-dragon svg");
        let scaleFactor = 1.5;
        if (svgEl) {
          const rect = svgEl.getBoundingClientRect();
          scaleFactor = (1000 / rect.width) / 0.68;
        }

        setDragonOffsets((prev) => {
          const prevVal = prev[draggingShapeId] || { x: 0, y: 0, rotate: 0, scale: 1 };
          return {
            ...prev,
            [draggingShapeId]: {
              ...prevVal,
              x: Math.round(dragShapeStart.current.shapeX + dx * scaleFactor),
              y: Math.round(dragShapeStart.current.shapeY + dy * scaleFactor),
            },
          };
        });
      }

      if (draggingNode) {
        const dx = e.clientX - dragNodeStart.current.mouseX;
        const dy = e.clientY - dragNodeStart.current.mouseY;

        const svgEl = document.querySelector(".layer-8-dragon svg");
        let scaleFactor = 1.5;
        if (svgEl) {
          const rect = svgEl.getBoundingClientRect();
          scaleFactor = (1000 / rect.width) / 0.68;
        }

        setDragonGeometries((prev) => {
          let currentGeom = prev[draggingNode.shapeId];
          if (!currentGeom) {
            const shapeObj = DRAGON_ORIGINAL_SHAPES.find(s => s.id === draggingNode.shapeId)
              || customShapes.find(s => s.id === draggingNode.shapeId);
            currentGeom = shapeObj?.d || shapeObj?.points || "";
          }

          const { tokens } = parseCoordinates(currentGeom);
          if (tokens.length > draggingNode.yIdx) {
            const newX = Math.round(dragNodeStart.current.nodeX + dx * scaleFactor);
            const newY = Math.round(dragNodeStart.current.nodeY + dy * scaleFactor);
            tokens[draggingNode.xIdx] = String(newX);
            tokens[draggingNode.yIdx] = String(newY);
          }

          return {
            ...prev,
            [draggingNode.shapeId]: tokens.join(""),
          };
        });
      }
    }

    function handleMouseUp() {
      if (draggingShapeId || draggingNode) {
        pushHistoryState();
      }
      setIsDraggingPanel(false);
      setDraggingShapeId(null);
      setDraggingNode(null);
    }

    if (isDraggingPanel || draggingShapeId || draggingNode) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPanel, draggingShapeId, draggingNode, customShapes]);

  function handleAddCustomShape() {
    const id = `custom_${Date.now()}`;
    const newShape = {
      id,
      name: `Custom ${spawnerType.toUpperCase()} (${customShapes.length + 1})`,
      type: spawnerType,
      fill: spawnerColor,
      x: 150,
      y: 150,
      width: 40,
      height: 30,
      rx: spawnerType === "circle" || spawnerType === "ellipse" || spawnerType === "rect" ? 15 : 0,
      ry: spawnerType === "ellipse" ? 10 : 0,
      points: "0,-15 15,15 -15,15",
      d: "M -15 -15 L 15 15",
      rotate: 0,
    };
    
    const nextOffsets = {
      ...dragonOffsets,
      [id]: { x: 0, y: 0, rotate: 0, scale: 1 }
    };
    const nextCustoms = [...customShapes, newShape];
    const nextGeoms = {
      ...dragonGeometries,
      [id]: spawnerType === "polygon" ? "0,-15 15,15 -15,15" : (spawnerType === "path" ? "M -15 -15 L 15 15" : "")
    };
    const nextOrder = [id, ...layerOrder];

    setDragonOffsets(nextOffsets);
    setCustomShapes(nextCustoms);
    setDragonGeometries(nextGeoms);
    setLayerOrder(nextOrder);
    setSelectedDragonPart(id);

    pushHistoryState(nextOffsets, dragonFills, deletedShapes, nextCustoms, nextGeoms, nextOrder);
  }

  // Derive eligible reviewers (teammates who are not the current user)
  const eligibleReviewers = useMemo(() => {
    if (!workspace || !workspace.currentProfileId) return [];
    return workspace.members.filter((m) => m.profileId !== workspace.currentProfileId);
  }, [workspace]);

  // Derive tasks available for the current user to submit evidence for
  const myAssignableTasks = useMemo(() => {
    if (!workspace || !workspace.currentProfileId) return [];
    return workspace.tasks.filter(
      (t) =>
        t.primaryOwnerProfileId === workspace.currentProfileId &&
        ["todo", "in_progress", "changes_requested"].includes(t.status)
    );
  }, [workspace]);

  // All tasks assigned to the current user (active, in review, and completed)
  const myAllTasks = useMemo(() => {
    if (!workspace || !workspace.currentProfileId) return [];
    return workspace.tasks
      .filter((t) => t.primaryOwnerProfileId === workspace.currentProfileId)
      .sort((a, b) => {
        const aCompleted = a.status === "completed" || a.status === "verified";
        const bCompleted = b.status === "completed" || b.status === "verified";
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        return 0;
      });
  }, [workspace]);

  // Goblin verification counters
  const goblinWordCount = goblinText.trim().length > 0 ? goblinText.trim().split(/\s+/).filter(Boolean).length : 0;
  const goblinImageCount = goblinImageUrls.length;
  const isGoblinValid = goblinWordCount >= 10 || goblinImageCount >= 2;

  function handleAddGoblinImage() {
    const trimmed = goblinImageInput.trim();
    if (!trimmed) return;
    setGoblinImageUrls((current) => [...current, trimmed]);
    setGoblinImageInput("");
  }

  function handleRemoveGoblinImage(index: number) {
    setGoblinImageUrls((current) => current.filter((_, i) => i !== index));
  }

  async function handleGoblinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goblinText && goblinImageUrls.length === 0) return;

    setGoblinError(null);
    setIsSlaying(true);

    try {
      await postDailyEvidence({
        projectId,
        text: goblinText,
        imageUrls: goblinImageUrls,
      });

      const memberIndex = state?.members.findIndex((m) => m.profileId === state.currentProfileId) ?? 0;
      const currentMember = state?.members[Math.max(0, memberIndex)];
      const mageInfo = getMageTheme(currentMember?.spellType, currentMember?.profileId, Math.max(0, memberIndex));
      const targetCoords = getGoblinCoordinates(Math.max(0, memberIndex));

      // Optimistically mark this player's goblin as dead immediately
      if (state?.currentProfileId) {
        setTestDeadGoblins((prev) => ({ ...prev, [state.currentProfileId]: true }));
      }

      setLocalAttack({
        id: `goblin_atk_${Date.now()}`,
        attackerName: currentMember?.displayName || "Adventurer",
        damage: 100,
        spellType: mageInfo.type,
        target: "goblin",
        targetX: targetCoords.x,
        targetY: targetCoords.y,
      });
      gameAudio.playTing();
      gameAudio.playHeroicMelody();
      setGoblinText("");
      setGoblinImageInput("");
      setGoblinImageUrls([]);
      setShowGoblinModal(false);
    } catch (err) {
      setGoblinError(getErrorMessage(err, "Failed to slay goblin."));
    } finally {
      setIsSlaying(false);
    }
  }

  async function handleBossSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTaskId) return;

    setBossError(null);
    setIsSubmittingTask(true);
    setUploadProgress(0);

    const currentTask = workspace?.tasks.find((t) => t._id === selectedTaskId);
    if (!currentTask) {
      setBossError("Selected task not found.");
      setIsSubmittingTask(false);
      return;
    }

    try {
      // 1. Choose reviewer if not already assigned (only required if group has 2 or more members)
      if (!isSoloProject && eligibleReviewers.length > 0 && !currentTask.reviewerProfileId) {
        if (!selectedReviewerId) {
          throw new Error("You must choose a teammate to review your task.");
        }
        await chooseReviewer({
          taskId: selectedTaskId,
          reviewerProfileId: selectedReviewerId as Id<"userProfiles">,
        });
      }

      // 2. Upload file if applicable
      let storageId: Id<"_storage"> | undefined;
      if (evidenceType === "image" || evidenceType === "pdf") {
        if (!evidenceFile) {
          throw new Error("Select a file to upload.");
        }
        // Validation check
        if (evidenceType === "image") {
          if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]).has(evidenceFile.type)) {
            throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
          }
          if (evidenceFile.size > 5 * 1024 * 1024) {
            throw new Error("Images must be 5 MB or smaller.");
          }
        }
        if (evidenceType === "pdf") {
          if (evidenceFile.type !== "application/pdf") {
            throw new Error("Choose a PDF file.");
          }
          if (evidenceFile.size > 10 * 1024 * 1024) {
            throw new Error("PDF files must be 10 MB or smaller.");
          }
        }

        const uploadUrl = await generateUploadUrl({ taskId: selectedTaskId });
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": evidenceFile.type },
          body: evidenceFile,
        });

        if (!res.ok) throw new Error("Failed to upload evidence file.");
        const json = await res.json();
        storageId = json.storageId;
      }

      // 3. Submit evidence record
      const fileName = evidenceFile?.name;
      const contentType = evidenceFile?.type;
      const fileSize = evidenceFile?.size;

      await addEvidence({
        taskId: selectedTaskId,
        type: evidenceType,
        note: evidenceNote.trim() || undefined,
        url: evidenceUrl.trim() || undefined,
        storageId,
        fileName,
        contentType,
        fileSize,
      });

      // 4. Submit for review
      await submitForReview({ taskId: selectedTaskId });

      const memberIndex = state?.members.findIndex((m) => m.profileId === state.currentProfileId) ?? 0;
      const currentMember = state?.members[Math.max(0, memberIndex)];
      const mageInfo = getMageTheme(currentMember?.spellType, currentMember?.profileId, Math.max(0, memberIndex));

      setLocalAttack({
        id: `boss_atk_${Date.now()}`,
        attackerName: currentMember?.displayName || "Adventurer",
        damage: currentTask.damage || 50,
        spellType: mageInfo.type,
        target: "dragon",
        targetX: 750,
        targetY: 175,
      });

      setShowBossModal(false);
      setSelectedTaskId(null);
      setEvidenceNote("");
      setEvidenceUrl("");
      setEvidenceFile(null);
      setSelectedReviewerId("");
      setUploadProgress(0);
    } catch (err) {
      setBossError(getErrorMessage(err, "Failed to submit task proof."));
    } finally {
      setIsSubmittingTask(false);
    }
  }

  function generateContributionPdf() {
    if (!state || !workspace) return;
    const memberIndex = state.members.findIndex((m) => m.profileId === state.currentProfileId);
    const currentMember = state.members[Math.max(0, memberIndex)];
    const mageInfo = getMageTheme(currentMember?.spellType, currentMember?.profileId, Math.max(0, memberIndex));

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background (#4ca0fe Sky Blue)
    doc.setFillColor(76, 160, 254);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("PROJECT CONTRIBUTION & PROOF OF WORK", 14, 18);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Official Dossier | Generated on ${new Date().toLocaleDateString()}`, 14, 26);
    doc.text(`Project: ${state.project.title}`, 14, 33);

    // Outcome Badge
    const effectiveVillageHp = testVillageHpOverride !== null ? testVillageHpOverride : state.villageHpPercent;
    const isSuccess = effectiveVillageHp >= 50;
    doc.setFillColor(isSuccess ? 29 : 220, isSuccess ? 216 : 38, isSuccess ? 81 : 38);
    doc.roundedRect(pageWidth - 65, 10, 52, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(isSuccess ? "VILLAGE DEFENDED" : "VILLAGE FALLEN", pageWidth - 61, 19);
    doc.setFontSize(8);
    doc.text(`Village HP: ${effectiveVillageHp}%`, pageWidth - 61, 26);

    // Adventurer Profile Section
    let yPos = 52;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ADVENTURER PROFILE", 14, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Name: ${currentMember?.displayName ?? "Adventurer"}`, 14, yPos);
    doc.text(`Class: ${mageInfo.name}`, 110, yPos);
    yPos += 5.5;
    doc.text(`Damage Dealt to Boss: ${currentMember?.damageDealt ?? 0} HP`, 14, yPos);
    doc.text(`Daily Goblin Slayed Today: ${currentMember?.hasSubmittedToday ? "Yes (Defeated)" : "Pending"}`, 110, yPos);
    yPos += 10;

    // Completed Quests / Tasks Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ASSIGNED & VERIFIED QUESTS", 14, yPos);
    yPos += 6;

    const myTasks = workspace.tasks.filter(
      (t) => (t.primaryOwnerProfileId === state.currentProfileId || t.collaboratorProfileIds?.includes(state.currentProfileId))
    );

    if (myTasks.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("No quest tasks assigned to this adventurer.", 14, yPos);
      yPos += 8;
    } else {
      myTasks.forEach((task, idx) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. [${task.status.toUpperCase()}] ${task.title}`, 14, yPos);
        yPos += 4.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Damage: ${task.damage ?? 50} HP | Required: ${task.required ? "Yes" : "Optional"} | Due: ${task.dueDate ?? "None"}`, 18, yPos);
        yPos += 4.5;
        if (task.description) {
          const splitDesc = doc.splitTextToSize(task.description, pageWidth - 36);
          doc.text(splitDesc, 18, yPos);
          yPos += splitDesc.length * 4;
        }
        yPos += 2;
      });
    }

    yPos += 6;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Daily Evidence Logs Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("COMBAT ACTIVITY & DAMAGE LOG", 14, yPos);
    yPos += 6;

    const myEvents = state.events.filter((e) => e.attackerProfileId === state.currentProfileId);
    if (myEvents.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("No verified combat events registered yet.", 14, yPos);
      yPos += 8;
    } else {
      myEvents.forEach((ev) => {
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const timeStr = new Date(ev.createdAt).toLocaleString();
        doc.text(`• ${timeStr} — Cast ${ev.spellType ?? "spell"} on "${ev.taskTitle}" (-${ev.damage} HP)`, 14, yPos);
        yPos += 4.5;
      });
    }

    // Communication & Daily Evidence Log Section (Team Chat)
    yPos += 6;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("COMMUNICATION & DAILY EVIDENCE LOG (TEAM CHAT)", 14, yPos);
    yPos += 6;

    if (!dailyPosts || dailyPosts.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("No daily chat messages or daily evidence recorded for this project yet.", 14, yPos);
      yPos += 8;
    } else {
      const sortedPosts = [...dailyPosts].sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
      sortedPosts.forEach((post: any) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        const isMyPost = post.authorProfileId === state.currentProfileId;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(isMyPost ? 22 : 71, isMyPost ? 101 : 85, isMyPost ? 52 : 105);
        const timeStr = new Date(post.createdAt || Date.now()).toLocaleString();
        doc.text(`${post.authorName || "Team Member"} (${timeStr})${isMyPost ? " [You]" : ""}:`, 14, yPos);
        yPos += 4.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        if (post.content || post.text) {
          const contentStr = String(post.content || post.text || "");
          const splitContent = doc.splitTextToSize(contentStr, pageWidth - 32);
          doc.text(splitContent, 18, yPos);
          yPos += splitContent.length * 4;
        }
        if (post.imageUrls && post.imageUrls.length > 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`[Attached ${post.imageUrls.length} evidence image(s)]`, 18, yPos);
          yPos += 4;
        }
        yPos += 2;
      });
    }

    // Digital Security Verification Footer
    if (yPos > 255) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }
    doc.setDrawColor(76, 160, 254);
    doc.setLineWidth(0.4);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Digital Verification Hash: ${state.project._id}-${state.currentProfileId}-${Date.now().toString(36)}`, 14, yPos);
    doc.text("MayLamDi project contribution report", 14, yPos + 3.5);

    doc.save(`${state.project.title.replace(/\s+/g, "_")}_Contribution_Dossier.pdf`);
  }

  async function handleRemoveRoom() {
    if (!state) return;
    setIsDeletingRoom(true);
    setDeleteRoomError(null);
    try {
      await removeProjectFromMine({ projectId });
      setShowDeleteRoomModal(false);
    } catch (err) {
      setDeleteRoomError(getErrorMessage(err, "Failed to remove the project from your account."));
    } finally {
      setIsDeletingRoom(false);
    }
  }

  const initialised = useRef(false);
  const latestSeenEventId = useRef<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const [localAttack, setLocalAttack] = useState<{
    id: string;
    attackerName: string;
    damage: number;
    spellType?: string;
    target?: "goblin" | "dragon";
    targetX?: number;
    targetY?: number;
  } | null>(null);

  useEffect(() => {
    if (localAttack) {
      const timer = window.setTimeout(() => setLocalAttack(null), 60000);
      return () => window.clearTimeout(timer);
    }
  }, [localAttack]);

  useEffect(() => {
    if (!state) return;
    const newest = state.events.at(-1)?._id ?? null;
    if (!initialised.current) {
      initialised.current = true;
      latestSeenEventId.current = newest;
      return;
    }
    if (newest && newest !== latestSeenEventId.current) {
      latestSeenEventId.current = newest;
      setActiveEventId(newest);
      const timer = window.setTimeout(() => setActiveEventId(null), 60000);
      return () => window.clearTimeout(timer);
    }
  }, [state]);

  const activeEvent = useMemo(
    () => state?.events.find((event) => event._id === activeEventId) ?? null,
    [state?.events, activeEventId],
  );

  const combinedActiveEvent = useMemo(() => {
    if (testActiveSpell) {
      if (testGoblinTargetIndex !== null && state?.members?.[testGoblinTargetIndex]) {
        const coords = getGoblinCoordinates(testGoblinTargetIndex);
        return {
          id: "test-goblin-spell-" + testActiveSpell + "-" + (state?.events?.length ?? 0),
          attackerName: "Layout Admin",
          damage: 999,
          spellType: testActiveSpell,
          target: "goblin" as const,
          targetX: coords.x,
          targetY: coords.y,
        };
      }
      return {
        id: "test-spell-" + testActiveSpell + "-" + (state?.events?.length ?? 0),
        attackerName: "Layout Admin",
        damage: 999,
        spellType: testActiveSpell,
        target: "dragon" as const,
        targetX: 750,
        targetY: 175,
      };
    }
    if (localAttack) return localAttack;
    if (activeEvent) {
      return {
        id: activeEvent._id,
        attackerName: activeEvent.attackerName,
        damage: activeEvent.damage,
        spellType: activeEvent.spellType,
        target: "dragon" as const,
        targetX: 750,
        targetY: 175,
      };
    }
    return null;
  }, [testActiveSpell, testGoblinTargetIndex, localAttack, activeEvent, state?.events?.length, state?.members]);

  const goblins = useMemo(() => {
    if (!state) return [];
    return state.members.map((member) => {
      const isDefeated = (testDeadGoblins[member.profileId] ?? false) || member.hasSubmittedToday;
      return {
        id: member.profileId,
        memberId: member.profileId,
        memberName: member.displayName,
        goblinState: isDefeated ? ("ghost" as const) : ("active" as const),
        isDefeated,
      };
    });
  }, [state, testDeadGoblins]);

  const players = useMemo(() => {
    if (isDummyTestingActive) {
      const count = Math.max(1, Math.min(25, dummyPlayerCount));
      const list = [];
      const elementalPool =
        dummyElementFilter === "mixed"
          ? ["fire", "ice", "lightning"]
          : [dummyElementFilter === "arcane" ? "lightning" : dummyElementFilter];

      for (let i = 0; i < count; i++) {
        const elem = elementalPool[i % elementalPool.length];
        list.push({
          profileId: `dummy_hero_${i + 1}`,
          displayName: `Hero ${i + 1}`,
          characterFill: undefined,
          characterOutline: undefined,
          spellType: elem,
          isActiveToday: true,
          isAttacking: true,
        });
      }
      return list;
    }

    if (!state?.members) return [];

    // Identify which members have submitted any task or evidence
    const submittedMemberIds = new Set<string>();
    if (isDummyTaskSubmitted && state.currentProfileId) {
      submittedMemberIds.add(state.currentProfileId);
    }
    workspace?.tasks?.forEach((task) => {
      const t = task as any;
      if (
        task.primaryOwnerProfileId &&
        (task.status === "submitted" ||
          task.status === "review" ||
          task.status === "awaiting_creator" ||
          task.status === "verified" ||
          task.status === "completed" ||
          Boolean(t.evidenceUrl) ||
          Boolean(t.proofSummary) ||
          Boolean(task.completedAt))
      ) {
        submittedMemberIds.add(task.primaryOwnerProfileId);
      }
    });

    return state.members.map((member) => {
      const hasSubmitted =
        Boolean(member.hasSubmittedToday) || submittedMemberIds.has(member.profileId);
      return {
        profileId: member.profileId,
        displayName: member.displayName,
        characterFill: member.characterFill,
        characterOutline: member.characterOutline,
        spellType: member.spellType,
        isActiveToday: member.hasSubmittedToday,
        isAttacking: hasSubmitted,
      };
    });
  }, [
    state?.members,
    state?.currentProfileId,
    isDummyTestingActive,
    dummyPlayerCount,
    dummyElementFilter,
    isDummyTaskSubmitted,
    workspace?.tasks,
  ]);

  // All Project Tasks for In-Canvas Quest Board (Active first, Completed sent to end)
  const questTasks: QuestTask[] = useMemo(() => {
    if (!workspace?.tasks) return [];
    return workspace.tasks
      .map((t) => {
        const assignee = workspace.members.find((m) => m?.profileId === t.primaryOwnerProfileId);
        const isOpen = Boolean(t.isOpenForClaiming || !t.primaryOwnerProfileId);
        const isCompleted = t.status === "verified" || t.status === "completed";
        return {
          ...t,
          assigneeName: isOpen ? "No one" : (assignee?.displayName ?? "No one"),
          isMine: t.primaryOwnerProfileId === state?.currentProfileId,
          isOpen,
          isCompleted,
        };
      })
      .sort((a, b) => {
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        return 0;
      });
  }, [workspace?.tasks, workspace?.members, state?.currentProfileId]);

  const userIncompleteTasksCount = useMemo(() => {
    return questTasks.filter((t) => t.isMine && !t.isCompleted).length;
  }, [questTasks]);

  // Active attackers throwing elemental projectiles at the dragon from staff tip
  const activeAttackers: ActiveAttacker[] = useMemo(() => {
    const attackers: ActiveAttacker[] = [];
    const totalCount = players.length;
    const playerTransform = {
      x: layerTransforms.players?.x || 0,
      y: layerTransforms.players?.y || 0,
      scale: layerTransforms.players?.scale || 1,
    };

    players.forEach((player, idx) => {
      // Only heroes who have submitted work (or during dummy test mode) cast projectiles
      if (!player.isAttacking) return;
      const coords = getPlayerStaffTip(idx, totalCount, true, playerTransform);
      const mage = getMageTheme(player.spellType, player.profileId, idx);
      attackers.push({
        profileId: player.profileId,
        displayName: player.displayName,
        spellType: mage.type,
        startX: coords.x,
        startY: coords.y,
      });
    });

    return attackers;
  }, [players, layerTransforms.players]);

  // Auto-prompt for Browser Push Notifications if not decided yet
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      const timer = setTimeout(() => {
        requestWebPushPermission().then((granted) => setHasPushGranted(granted));
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Periodic Web Push Notification Engine (One and done per session, no spam)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("rpg_notif_session_checked")) return;
    sessionStorage.setItem("rpg_notif_session_checked", "true");

    const projectName = workspace?.project?.title || state?.project?.title || "Realm Quest";
    const todayStr = new Date().toDateString();

    // 1. Goblin Daily Reminder (At most once per day, only if notifications enabled)
    const lastGoblinDate = localStorage.getItem("rpg_last_goblin_date");
    const currentMember = state?.members?.find((m) => m.profileId === state?.currentProfileId);
    const hasSubmittedToday = Boolean(currentMember?.hasSubmittedToday);

    if (!hasSubmittedToday && lastGoblinDate !== todayStr && areNotificationsEnabled()) {
      localStorage.setItem("rpg_last_goblin_date", todayStr);
      sendWebNotification(
        `${projectName}: VILLAGE IS UNDER ATTACK!`,
        "Slay the goblin horde now to defend the village!",
        "fanfare"
      );
    }

    // 2. Task Deadline Reminder (Incomplete tasks due within 24 hours, at most once per day)
    const lastDeadlineDate = localStorage.getItem("rpg_last_deadline_date");
    if (lastDeadlineDate !== todayStr && areNotificationsEnabled()) {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const nowMs = Date.now();
      const userPendingTasks = questTasks.filter((t) => t.isMine && !t.isCompleted && t.dueDate);
      const nearDeadlineTask = userPendingTasks.find((t) => {
        const dueMs = new Date(`${t.dueDate}T23:59:59Z`).getTime();
        const diff = dueMs - nowMs;
        return diff > 0 && diff <= ONE_DAY_MS;
      });

      if (nearDeadlineTask) {
        localStorage.setItem("rpg_last_deadline_date", todayStr);
        sendWebNotification(
          `${projectName}: BOSS DEADLINE DUE SOON!`,
          `Task "${nearDeadlineTask.title}" deadline due soon. Submit proof to strike the boss!`,
          "roar"
        );
      }
    }
  }, [workspace?.project?.title, state?.project?.title, state?.members, state?.currentProfileId, questTasks]);

  // Attack Elemental Sound Effects Trigger (Synchronized looping while visual is active)
  useEffect(() => {
    const spell = testActiveSpell || combinedActiveEvent?.spellType;
    if (spell) {
      gameAudio.startSpellLoop(spell);
    } else {
      gameAudio.stopSpellLoop();
    }
    return () => {
      gameAudio.stopSpellLoop();
    };
  }, [testActiveSpell, combinedActiveEvent]);

  // Pending Quests requiring peer review by current user or final creator approval
  const pendingReviews = useMemo(() => {
    if (!workspace?.tasks) return [];
    return workspace.tasks
      .filter((t) => {
        // A user cannot review their own task:
        if (t.primaryOwnerProfileId === state?.currentProfileId) return false;

        const isReviewer = t.reviewerProfileId === state?.currentProfileId;
        const isCreator = workspace?.project?.creatorProfileId === state?.currentProfileId;
        if (isReviewer && (t.status === "review" || t.status === "submitted" || t.status === "awaiting_creator")) return true;
        if (isCreator && t.status === "awaiting_creator") return true;
        return false;
      })
      .map((t) => {
        const assignee = workspace.members.find((m) => m?.profileId === t.primaryOwnerProfileId);
        const isCreatorApproval = t.status === "awaiting_creator";
        return {
          ...t,
          assigneeName: assignee?.displayName ?? "Teammate",
          isCreatorApproval,
        };
      });
  }, [workspace?.tasks, workspace?.members, workspace?.project?.creatorProfileId, state?.currentProfileId]);

  async function handleReviewDecision(taskId: Id<"tasks">, decision: "approved" | "changes_requested", isCreatorApproval: boolean) {
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      if (isCreatorApproval) {
        await decideCompletionMutation({
          taskId,
          decision: decision === "approved" ? "approve" : "reject",
          comment: reviewComment.trim() || undefined,
        });
      } else {
        await submitReviewMutation({
          taskId,
          status: decision,
          comment: reviewComment.trim() || (decision === "approved" ? "Approved by peer reviewer." : "Changes requested."),
        });
      }
      gameAudio.playTing();
      setReviewingTaskId(null);
      setReviewComment("");
    } catch (err) {
      setReviewError(getErrorMessage(err, "Failed to submit review decision."));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleClaimQuest(task: QuestTask) {
    setIsClaimingQuest(true);
    setClaimQuestError(null);
    try {
      await claimTaskMutation({ taskId: task._id });
      gameAudio.playTing();
      setSelectedQuestTask(null);
    } catch (err) {
      setClaimQuestError(getErrorMessage(err, "Failed to claim quest."));
    } finally {
      setIsClaimingQuest(false);
    }
  }

  async function handleCreateQuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isRoomOwner = workspace?.project?.creatorProfileId === state?.currentProfileId;
    if (!isRoomOwner) {
      setCreateQuestError("Only the room owner can create new tasks.");
      return;
    }
    if (!newQuestTitle.trim()) {
      setCreateQuestError("Please provide a task title.");
      return;
    }
    const defaultPhase = workspace?.phases?.[0];
    const targetPhaseId = (newQuestPhaseId ? newQuestPhaseId : defaultPhase?._id) as Id<"phases">;
    if (!targetPhaseId) {
      setCreateQuestError("A project phase is required.");
      return;
    }
    setIsCreatingQuest(true);
    setCreateQuestError(null);
    try {
      const nowStr = new Date().toISOString().split("T")[0];
      const fallbackProfileId = (state?.currentProfileId || workspace?.members?.[0]?.profileId) as Id<"userProfiles">;
      const assignedId = (newQuestAssignee ? newQuestAssignee : fallbackProfileId) as Id<"userProfiles">;
      const isOpen = !newQuestAssignee;

      const projStart = workspace?.project?.startDate || nowStr;
      const projDeadline = workspace?.project?.deadline || new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0];

      let safeStartDate = nowStr;
      if (safeStartDate < projStart) safeStartDate = projStart;
      if (safeStartDate > projDeadline) safeStartDate = projDeadline;

      let safeDueDate = newQuestDueDate || nowStr;
      if (safeDueDate < safeStartDate) safeDueDate = safeStartDate;
      if (safeDueDate > projDeadline) safeDueDate = projDeadline;

      await createTaskMutation({
        projectId,
        phaseId: targetPhaseId,
        title: newQuestTitle.trim(),
        description: newQuestDesc.trim() || "Complete tasks to defend the village.",
        primaryOwnerProfileId: assignedId,
        collaboratorProfileIds: [],
        weight: newQuestWeight || 3,
        required: true,
        startDate: safeStartDate,
        dueDate: safeDueDate,
        requiresReview: true,
        isOpenForClaiming: isOpen,
        assignmentState: isOpen ? "open" : "assigned",
      });

      gameAudio.playTing();
      setShowCreateQuestModal(false);
      setNewQuestTitle("");
      setNewQuestDesc("");
    } catch (err) {
      setCreateQuestError(getErrorMessage(err, "Failed to create task."));
    } finally {
      setIsCreatingQuest(false);
    }
  }

  function handleStartEditTask(task: QuestTask) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditDueDate(task.dueDate || "");
    setEditAssignee(task.isOpenForClaiming ? "" : (task.primaryOwnerProfileId || ""));
    setEditDamage(task.damage || 50);
    setEditIsOpen(Boolean(task.isOpenForClaiming));
    setEditTaskError(null);
  }

  async function handleSaveEditTask() {
    if (!editingTask) return;
    if (!editTitle.trim()) {
      setEditTaskError("Task title cannot be empty.");
      return;
    }
    setIsSavingEditTask(true);
    setEditTaskError(null);
    try {
      await editQuestTaskMutation({
        taskId: editingTask._id,
        title: editTitle.trim(),
        description: editDesc.trim(),
        dueDate: editDueDate || undefined,
        primaryOwnerProfileId: editIsOpen ? undefined : (editAssignee ? (editAssignee as Id<"userProfiles">) : undefined),
        damage: editDamage,
        isOpenForClaiming: editIsOpen,
      });
      gameAudio.playTing();
      setSelectedQuestTask((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle.trim(),
              description: editDesc.trim(),
              dueDate: editDueDate,
              damage: editDamage,
              isOpen: editIsOpen,
              isOpenForClaiming: editIsOpen,
              primaryOwnerProfileId: editIsOpen
                ? prev.primaryOwnerProfileId
                : editAssignee
                  ? (editAssignee as Id<"userProfiles">)
                  : prev.primaryOwnerProfileId,
              assigneeName: editIsOpen
                ? "Unassigned"
                : workspace?.members.find((m) => m?.profileId === editAssignee)?.displayName || prev.assigneeName,
            }
          : null,
      );
      setEditingTask(null);
    } catch (err) {
      setEditTaskError(getErrorMessage(err, "Failed to update task."));
    } finally {
      setIsSavingEditTask(false);
    }
  }

  const startStr = workspace?.project?.startDate || (state?.project?.launchedAt ? new Date(state.project.launchedAt).toISOString().split("T")[0] : "");
  const deadlineStr = workspace?.project?.deadline || state?.project?.deadline || "";

  const { totalDays, daysPassed, daysRemaining, progressPercent } = useMemo(() => {
    if (!deadlineStr) return { totalDays: 0, daysPassed: 0, daysRemaining: 0, progressPercent: 0 };
    const end = new Date(`${deadlineStr}T23:59:59Z`).getTime();
    let start = startStr ? new Date(`${startStr}T00:00:00Z`).getTime() : 0;
    if (!start || isNaN(start)) {
      start = end - (14 * 24 * 60 * 60 * 1000);
    }
    const now = Date.now();
    const totalMs = Math.max(1000 * 60 * 60 * 24, end - start);
    const passedMs = Math.max(0, Math.min(totalMs, now - start));
    const tDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
    const pDays = Math.max(0, Math.min(tDays, Math.floor(passedMs / (1000 * 60 * 60 * 24))));
    const rDays = Math.max(0, tDays - pDays);
    const pct = Math.min(100, Math.max(0, (passedMs / totalMs) * 100));
    return { totalDays: tDays, daysPassed: pDays, daysRemaining: rDays, progressPercent: pct };
  }, [startStr, deadlineStr]);

  const milestoneCheckpoints = useMemo(() => {
    if (!workspace?.milestones || !startStr || !deadlineStr) return [];
    const start = new Date(`${startStr}T00:00:00Z`).getTime();
    const end = new Date(`${deadlineStr}T23:59:59Z`).getTime();
    const totalMs = Math.max(1, end - start);
    return workspace.milestones.map((m) => {
      const mTime = new Date(`${m.dueDate}T23:59:59Z`).getTime();
      const pct = Math.max(0, Math.min(100, ((mTime - start) / totalMs) * 100));
      return {
        id: m._id,
        title: m.title,
        dueDate: m.dueDate,
        status: m.status,
        percent: pct,
      };
    });
  }, [workspace?.milestones, startStr, deadlineStr]);

  const funnyBossName = useMemo(() => getFunnyName(BOSS_FUNNY_NAMES, state?.project._id || "boss"), [state?.project._id]);
  const funnyVillageName = useMemo(() => getFunnyName(VILLAGE_FUNNY_NAMES, state?.project._id || "village"), [state?.project._id]);

  if (state === undefined) {
    return <section className="battle-loading" aria-busy="true">Preparing the battle scene…</section>;
  }

  const TASK_HP_UNIT = 50;
  const effectiveTaskCount = Math.max(1, (workspace?.tasks?.length ?? 1) + testExtraTasksCount);
  const computedMaxBossHp = Math.max(50, state.maximumHp + (testExtraTasksCount * TASK_HP_UNIT));

  // Compute total and completed tasks including dummy testing triggers
  const baseCompletedTasks = questTasks.filter(t => t.isCompleted || t.status === "completed" || t.status === "verified").length;
  const dummyBonus = (isDummyTaskSubmitted ? 1 : 0) + (dummyReviewTaskDone ? 1 : 0);
  const totalTasksCount = Math.max(1, questTasks.length);
  const completedTasksCount = Math.min(totalTasksCount, baseCompletedTasks + dummyBonus);
  const progressPercentage = Math.round((completedTasksCount / totalTasksCount) * 100);

  const baseRemainingHp = state.remainingHp + (testExtraTasksCount * TASK_HP_UNIT) - testSimulatedOnTimeDamage;
  const taskProgressHpPercent = Math.max(0, 100 - progressPercentage);
  const serverHpPercent = computedMaxBossHp === 0
    ? 100
    : Math.round((Math.max(0, Math.min(computedMaxBossHp, baseRemainingHp)) / computedMaxBossHp) * 100);

  // Collaborative End-Game Screen: Game only ends after all tasks are completed and Dragon is defeated
  const allTasksCompleted = totalTasksCount > 0 && completedTasksCount >= totalTasksCount;
  const hpPercent = testDragonHpOverride !== null
    ? testDragonHpOverride
    : allTasksCompleted
      ? 0
      : (isDummyTaskSubmitted || dummyReviewTaskDone)
        ? taskProgressHpPercent
        : Math.min(taskProgressHpPercent, serverHpPercent);
  const rawRemainingHp = Math.round((hpPercent / 100) * computedMaxBossHp);
  const defeated = (computedMaxBossHp > 0 && (rawRemainingHp === 0 || hpPercent === 0));
  const effectiveIsDefeated = deathDebugForceDefeated || defeated || allTasksCompleted || testBossDefeatedPreview;

  // Village Max HP scales with team size: 100 + (10 * number of players)
  const teamMemberCount = Math.max(1, (state.members?.length ?? 1) + testExtraPlayerCount);
  const villageMaxHp = 100 + (10 * teamMemberCount);
  const baseVillageCurrentHp = Math.max(0, Math.round((state.villageHpPercent / 100) * villageMaxHp) - testSimulatedMissedDamage);
  const computedVillageHpPercent = Math.max(0, Math.min(100, Math.round((baseVillageCurrentHp / villageMaxHp) * 100)));

  const effectiveVillageHp = testVillageHpOverride !== null ? testVillageHpOverride : computedVillageHpPercent;
  const optionalMetrics = state as typeof state & OptionalBattleMetrics;

  const damageClearedFraction = (100 - hpPercent) / 100;
  const dragonX = 580 + damageClearedFraction * 60;

  // Collaborative End-Game Screen: Canvas stays on screen first when boss defeated.
  // End Screen board is only shown when user clicks "End Screen" or on overdue override.
  const shouldShowEndScreen = (showEndScreen || testOverdueOverride === true) && (effectiveIsDefeated || testOverdueOverride === true) && !viewBattleSceneOverride;
  if (shouldShowEndScreen) {
    const isVillageDefended = effectiveVillageHp >= 50;
    const resultVariant = isVillageDefended ? "success" : "failed";
    const resultTitle = isVillageDefended
      ? "Project completed"
      : "YOU FAILED TO PROTECT THE VILLAGE!";
    const resultDescription = isVillageDefended
      ? `All project tasks have been successfully completed and the boss defeated! Your team earned verifiable proof of contribution.`
      : `The deadline has expired before sufficient task quests were completed. ${funnyBossName} and the goblin horde overwhelmed the defenses.`;
    const verifiedQuestCount = completedTasksCount;

    return (
      <section className="battle-page battle-result-page" aria-labelledby="endgame-title">
        <SVGDefs />
        <BattleResultBoard
          variant={resultVariant}
          title={resultTitle}
          description={resultDescription}
          villageHp={effectiveVillageHp}
          bossRemainingHp={rawRemainingHp}
          bossMaximumHp={state.maximumHp}
          verifiedQuests={verifiedQuestCount}
          canRemoveRoom={Boolean(workspace)}
          onDownloadContribution={generateContributionPdf}
          onViewBattle={() => {
            setShowEndScreen(false);
            setViewBattleSceneOverride(true);
            setTestBossDefeatedPreview(false);
          }}
          onRemoveRoom={() => setShowDeleteRoomModal(true)}
        />

        {/* Modals on End-Game screen */}
        {showLeaderboardModal && (
          <div className="rpg-modal-overlay" onClick={() => setShowLeaderboardModal(false)}>
            <div className="rpg-parchment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rpg-modal-header">
                <h2>Hall of Fame & Combat Log</h2>
                <button type="button" className="rpg-btn-close" onClick={() => setShowLeaderboardModal(false)}>✕</button>
              </div>
              <div className="rpg-modal-body">
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="leaderboard-table-container">
                    <table className="rpg-leaderboard-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Adventurer</th>
                          <th>Role</th>
                          <th>Damage Dealt</th>
                          <th>Goblin Slayed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(leaderboardData ?? state.members).map((m: any, idx: number) => {
                          const currentMember = state.members.find(sm => sm.profileId === (m.profileId || m.userId));
                          const mage = getMageTheme(currentMember?.spellType, currentMember?.profileId, idx);
                          return (
                            <tr key={m.profileId || m.userId || idx}>
                              <td>{idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : `#${idx + 1}`}</td>
                              <td><strong>{m.displayName || m.userName}</strong></td>
                              <td><span style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.1)" }}>{mage.name}</span></td>
                              <td><strong>{m.damageDealt ?? 0} HP</strong></td>
                              <td>{m.hasSubmittedToday ? "Defeated" : "Pending"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="combat-log-box" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px", maxHeight: "200px", overflowY: "auto" }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#facc15" }}>Verified Combat Activity Log</h4>
                    {state.events.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>No combat attacks registered.</p>
                    ) : (
                      <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", display: "grid", gap: "6px" }}>
                        {[...state.events].reverse().map((ev) => (
                          <li key={ev._id}>
                            <strong>{ev.attackerName} dealt {ev.damage} damage</strong>
                            <span style={{ color: "#94a3b8", display: "block", fontSize: "0.72rem" }}>Verified “{ev.taskTitle}” by {ev.reviewerName}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account-only room removal confirmation modal */}
        {showDeleteRoomModal && (
          <div className="rpg-modal-overlay" onClick={() => setShowDeleteRoomModal(false)}>
            <div className="rpg-parchment-modal" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
              <div className="rpg-modal-header">
                <h2>Remove from my account?</h2>
                <button type="button" className="rpg-btn-close" onClick={() => setShowDeleteRoomModal(false)}>✕</button>
              </div>
              <div className="rpg-modal-body">
                <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#e2e8f0" }}>
                  This removes <strong>{state.project.title}</strong> only from your account. Your teammates keep the room, tasks, milestones, evidence, and combat history.
                </p>
                {deleteRoomError && (
                  <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "8px 0 0 0" }}>{deleteRoomError}</p>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowDeleteRoomModal(false)} style={{ padding: "8px 14px", borderRadius: "6px", background: "#334155", color: "#fff", border: "none", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingRoom}
                    onClick={handleRemoveRoom}
                    style={{ padding: "8px 16px", borderRadius: "6px", background: "#b91c1c", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" }}
                  >
                    {isDeletingRoom ? "Removing…" : "Remove from my account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`battle-page ${activeEvent ? "has-new-attack" : ""} ${effectiveIsDefeated ? "is-defeated" : ""}`} aria-label="Project Battle Scene">
      <SVGDefs />

      {/* Main 10-Layer Geometric SVG Landscape Scene */}
      {displayMode === "game" ? (
        <div className={`landscape-scene-container ${showTutorial ? "has-tutorial-active" : ""}`} style={{ position: "relative", overflow: "hidden" }} aria-label="Interactive project encounter scene">
        {/* Mode Toggle Button: Canvas Top-Left */}
        <button
          type="button"
          onClick={toggleDisplayMode}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 30,
            background: "var(--mld-primary, #fff73f)",
            border: "2.5px solid #101517",
            borderRadius: "10px",
            padding: "8px 14px",
            fontWeight: 800,
            fontSize: "0.82rem",
            boxShadow: "3px 3px 0 #101517",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#101517",
            userSelect: "none",
          }}
          title="Switch to Tool Mode (Plain progress bar & clean dashboard)"
          aria-label="Switch to Tool Mode"
        >
          <BarChart2 size={16} />
          <span>Tool Mode</span>
        </button>

        {/* Layer 10: Task Progress Bar (TOP, centered text, fixed in place, responsive width) */}
        <div
          className="pvz-deadline-progress-container project-task-progress-container"
          style={{
            position: "absolute",
            top: "14px",
            left: "50%",
            transform: `translateX(-50%) scale(${pvzBarOffset.scale})`,
            zIndex: 25,
            width: `${pvzBarOffset.width}px`,
            background: isDarkMode ? "#0b181c" : "#fffded",
            border: isDarkMode ? "2.5px solid rgba(255, 253, 236, 0.3)" : "3px solid #101517",
            boxShadow: isDarkMode ? "4px 4px 0 #000000" : "4px 4px 0 rgba(16, 21, 23, 0.72)",
            borderRadius: "14px",
            padding: "8px 14px 10px 14px",
            display: pvzBarOffset.visible ? "flex" : "none",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            userSelect: "none",
            pointerEvents: "auto",
            cursor: "default",
          }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Project task completion progress"
        >
          {/* Top Info Header - CENTERED TEXT */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              fontSize: "0.74rem",
              fontWeight: 900,
              fontFamily: "var(--font-heading), sans-serif",
              letterSpacing: "0.02em",
              color: isDarkMode ? "#fffdec" : "#101517",
              gap: "8px",
            }}
          >
            <span>
              DAY {daysPassed}/{totalDays || 13} · {completedTasksCount}/{totalTasksCount} TASKS COMPLETED ({progressPercentage}%)
            </span>
            {daysRemaining <= 0 && (
              <span style={{ color: "#d97706", fontWeight: 700, fontSize: "0.68rem" }}>
                (Target passed · No penalty)
              </span>
            )}
          </div>

          {/* Progress Bar Track */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "20px",
              background: isDarkMode ? "#17232a" : "#e2e8f0",
              border: isDarkMode ? "1.5px solid rgba(255, 253, 236, 0.25)" : "2px solid #101517",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Smooth Emerald Task Progress Fill */}
            <div
              style={{
                width: `${progressPercentage}%`,
                height: "100%",
                background: "linear-gradient(90deg, #15803d, #22c55e)",
                borderRadius: "6px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Floating Mob-Style Boss HP Bar (Positioned in middle of dragon) */}
        <div
          className="boss-hp-container"
          style={{
            position: "absolute",
            left: `calc(${Math.min(92, Math.max(8, (dragonX / 10) + 7))}% + ${dragonHpBarPos.x}px)`,
            top: `calc(195px + ${dragonHpBarPos.y}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 35,
            transform: `scale(${dragonHpBarScale * 0.95})`,
            transformOrigin: "center center",
            pointerEvents: "none",
          }}
        >
          {/* Flat Boss Health Bar with HP % INSIDE (No Name Float, Scaled Down) */}
          <div
            className="boss-hp-mob-style"
            role="progressbar"
            aria-label="Boss health"
            aria-valuemin={0}
            aria-valuemax={computedMaxBossHp}
            aria-valuenow={rawRemainingHp}
            style={{
              width: `${Math.min(125, dragonHpBarWidth)}px`,
              height: `${Math.min(14, dragonHpBarHeight)}px`,
              position: "relative",
              background: "#1e293b",
              borderRadius: "3px",
              border: "none",
              outline: "none",
              boxShadow: "none",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="boss-hp-mob-fill"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${hpPercent}%`,
                height: "100%",
                background: hpPercent > 50 ? "#ef4444" : hpPercent > 25 ? "#f97316" : "#dc2626",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
            <span
              style={{
                position: "relative",
                zIndex: 2,
                fontSize: "0.58rem",
                fontWeight: 800,
                color: "#ffffff",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {rawRemainingHp} / {computedMaxBossHp} HP ({hpPercent}%)
            </span>
          </div>
        </div>

        {/* Layer 0, 1, 2: Sky & Parallax Clouds (Night Sky with Moon & Stars in Dark Mode) */}
        <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, transform: `translate(${layerTransforms.sky?.x || 0}px, ${layerTransforms.sky?.y || 0}px) scale(${layerTransforms.sky?.scale || 1})`, display: layerTransforms.sky?.visible !== false ? "block" : "none" }}>
          <LandscapeSky cloudOffset={terrainOffsets.cloud} isNight={isDarkMode} />
        </div>

        {/* Subjects Group (Terrain, Players, Dragon): A tiny bit dimmer at night */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            filter: isDarkMode ? "brightness(0.92) contrast(1.02)" : "none",
            transition: "filter 0.5s ease",
          }}
        >
          {/* Layer 3, 4: Top-Down 3/4 Perspective Grassland (Road pavement removed) */}
          <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 4, transform: `translate(${layerTransforms.terrain?.x || 0}px, ${layerTransforms.terrain?.y || 0}px) scale(${layerTransforms.terrain?.scale || 1})`, display: layerTransforms.terrain?.visible !== false ? "block" : "none" }}>
            <LandscapeTerrain
              mountainOffset={terrainOffsets.mountain}
              islandOffset={terrainOffsets.island}
              greenOffset={terrainOffsets.green}
              isNight={isDarkMode}
            />
          </div>

          {/* Layer 7: Party Members (Scaled Up and Positioned in Open Meadow) */}
          <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 7, transform: `translate(${layerTransforms.players?.x || 0}px, ${layerTransforms.players?.y || 0}px) scale(${layerTransforms.players?.scale || 1})`, display: layerTransforms.players?.visible !== false ? "block" : "none" }}>
            <LandscapePlayers members={players} />
          </div>

          {/* Layer 8: Dragon Boss (Scaled Up by 1.2) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: adminAuthenticated && showDragonEditor ? "auto" : "none",
              zIndex: 8,
              transform: `translate(${layerTransforms.dragon?.x || 0}px, ${layerTransforms.dragon?.y || 0}px) scale(${(layerTransforms.dragon?.scale || 1) * 1.2})`,
              display: layerTransforms.dragon?.visible !== false ? "block" : "none",
            }}
          >
            <LandscapeDragon
              bossHpPercent={hpPercent}
              isDefeated={effectiveIsDefeated}
              deathRotation={deathRotation}
              deathPivotX={deathPivotX}
              deathPivotY={deathPivotY}
              deathOffsetX={deathOffsetX}
              deathOffsetY={deathOffsetY}
              deathStopWings={deathStopWings}
              deathGlow={deathGlow}
              offsets={dragonOffsets as any}
              onSelectPart={adminAuthenticated && showDragonEditor ? (setSelectedDragonPart as any) : undefined}
              selectedPart={adminAuthenticated && showDragonEditor ? (selectedDragonPart as any) : null}
              animationsEnabled={animationsEnabled}
              customShapes={customShapes}
              fills={dragonFills}
              deletedShapes={deletedShapes}
              onStartDragShape={adminAuthenticated && showDragonEditor ? handleStartDragShape : undefined}
              geometries={dragonGeometries}
              onStartDragNode={adminAuthenticated && showDragonEditor ? handleStartDragNode : undefined}
              layerOrder={layerOrder}
            />
          </div>
        </div>

        {/* Layer 9: Combat Exchange & Elemental VFX */}
        <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 25, transform: `translate(${layerTransforms.fx?.x || 0}px, ${layerTransforms.fx?.y || 0}px) scale(${layerTransforms.fx?.scale || 1})`, display: layerTransforms.fx?.visible !== false ? "block" : "none" }}>
          <LandscapeFX
            activeEvent={combinedActiveEvent}
            isVictory={effectiveIsDefeated}
            activeAttackers={activeAttackers}
            dragonTarget={{
              x: Math.round(500 + (dragonX + 45 - 500) * (layerTransforms.dragon?.scale || 1) * 1.2 + (layerTransforms.dragon?.x || 0)),
              y: Math.round(200 + (225 - 200) * (layerTransforms.dragon?.scale || 1) * 1.2 + (layerTransforms.dragon?.y || 0)),
            }}
          />
        </div>

        {/* Floating Sound Button (Canvas Bottom-Right Corner) */}
        <button
          type="button"
          className="rpg-btn-icon"
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            zIndex: 30,
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: isDarkMode ? "#171a1e" : "#fffded",
            border: isDarkMode ? "2px solid rgba(255,253,236,0.3)" : "2.5px solid #101517",
            boxShadow: isDarkMode ? "3px 3px 0 #000000" : "3px 3px 0 #101517",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: isDarkMode ? "#fffdec" : "#101517",
          }}
          onClick={() => setShowSoundSettingsModal(true)}
          title={isAudioMuted ? "Sound: Muted" : (isLofiBgmPlaying ? "Music: On" : "Sound & Music")}
          aria-label="Sound and music settings"
        >
          {isAudioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Dragon Layout Admin Button (Only if authenticated or open) */}
        {(showDragonEditor || adminAuthenticated) && (
          <button
            type="button"
            className="rpg-btn-leaderboard rpg-btn-layout-admin"
            style={{
              position: "absolute",
              bottom: "16px",
              right: "68px",
              zIndex: 30,
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: isDarkMode ? "#171a1e" : "#fffded",
              border: isDarkMode ? "2px solid rgba(255,253,236,0.3)" : "2.5px solid #101517",
              boxShadow: isDarkMode ? "3px 3px 0 #000000" : "3px 3px 0 #101517",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: isDarkMode ? "#fffdec" : "#101517",
            }}
            onClick={() => {
              if (!adminAuthenticated) {
                setShowAdminPasswordModal(true);
              } else {
                setShowDragonEditor((prev) => !prev);
                if (!selectedDragonPart) {
                  setSelectedDragonPart("headNeck");
                }
              }
            }}
            title="Dragon Layout Admin"
            aria-label="Dragon Layout Admin"
          >
            <Shield size={20} />
          </button>
        )}

        {/* Boss Defeated UI Banner with "End Screen" button leading to project complete screen */}
        {effectiveIsDefeated && (
          <div
            className="rpg-defeated-banner"
            style={{
              position: "absolute",
              top: "76px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 36,
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "10px 20px",
              background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 253, 237, 0.95)",
              border: isDarkMode ? "2.5px solid #22c55e" : "2.5px solid #15803d",
              borderRadius: "14px",
              boxShadow: isDarkMode ? "0 4px 20px rgba(34, 197, 94, 0.3)" : "4px 4px 0 rgba(16, 21, 23, 0.8)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={20} color="#22c55e" />
              <span style={{ fontWeight: 800, fontSize: "0.9rem", color: isDarkMode ? "#fffdec" : "#101517" }}>
                Boss Defeated!
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowEndScreen(true);
                setViewBattleSceneOverride(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#22c55e",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.85rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(34, 197, 94, 0.4)",
                transition: "all 0.15s ease",
              }}
            >
              <span>End Screen</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}

        {/* Dragon Death Pose Live Debug Control Board (Bottom-Left Screen) */}
        <div
          className="rpg-death-debug-board"
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            zIndex: 40,
            pointerEvents: "auto",
          }}
        >
          {!deathDebugOpen ? (
            <button
              type="button"
              onClick={() => setDeathDebugOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "12px",
                background: isDarkMode ? "#171a1e" : "#fffded",
                border: isDarkMode ? "2px solid rgba(255,253,236,0.3)" : "2.5px solid #101517",
                boxShadow: isDarkMode ? "3px 3px 0 #000000" : "3px 3px 0 #101517",
                color: isDarkMode ? "#fffdec" : "#101517",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
              title="Open Dragon Death Debug Controls"
            >
              <Sliders size={16} />
              <span>Death Debug</span>
            </button>
          ) : (
            <div
              style={{
                width: "270px",
                maxHeight: "440px",
                overflowY: "auto",
                background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 253, 237, 0.97)",
                border: isDarkMode ? "2px solid rgba(255,253,236,0.3)" : "2.5px solid #101517",
                borderRadius: "14px",
                boxShadow: isDarkMode ? "4px 4px 0 #000000" : "4px 4px 0 #101517",
                padding: "12px 14px",
                color: isDarkMode ? "#fffdec" : "#101517",
                fontSize: "0.75rem",
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: isDarkMode ? "1px solid rgba(255,253,236,0.15)" : "1px solid #e2e8f0", paddingBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800 }}>
                  <Sliders size={14} />
                  <span>Dragon Death Controls</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeathDebugOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    padding: "2px 6px",
                  }}
                  title="Minimize"
                >
                  &ndash;
                </button>
              </div>

              {/* Force Defeated Button */}
              <div style={{ marginBottom: "10px" }}>
                <button
                  type="button"
                  onClick={() => setDeathDebugForceDefeated((prev) => !prev)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: isDarkMode ? "1.5px solid rgba(255,253,236,0.3)" : "1.5px solid #101517",
                    background: deathDebugForceDefeated ? (isDarkMode ? "#065f46" : "#bbf7d0") : (isDarkMode ? "#1e293b" : "#f1f5f9"),
                    color: deathDebugForceDefeated ? (isDarkMode ? "#34d399" : "#166534") : (isDarkMode ? "#e2e8f0" : "#334155"),
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.74rem",
                  }}
                >
                  {deathDebugForceDefeated ? "Defeated Mode: ACTIVE (Click to toggle)" : "Test Defeat Mode: OFF (Click to test)"}
                </button>
              </div>

              {/* Rotation Slider */}
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "2px" }}>
                  <span>Rotation:</span>
                  <span style={{ fontFamily: "monospace" }}>{deathRotation}&deg;</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={deathRotation}
                  onChange={(e) => setDeathRotation(Number(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", height: "4px" }}
                />
              </div>

              {/* Pivot X Slider */}
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "2px" }}>
                  <span>Pivot X:</span>
                  <span style={{ fontFamily: "monospace" }}>{deathPivotX}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={deathPivotX}
                  onChange={(e) => setDeathPivotX(Number(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", height: "4px" }}
                />
              </div>

              {/* Pivot Y Slider */}
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "2px" }}>
                  <span>Pivot Y:</span>
                  <span style={{ fontFamily: "monospace" }}>{deathPivotY}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={250}
                  step={1}
                  value={deathPivotY}
                  onChange={(e) => setDeathPivotY(Number(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", height: "4px" }}
                />
              </div>

              {/* Offset X Slider */}
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "2px" }}>
                  <span>Offset X:</span>
                  <span style={{ fontFamily: "monospace" }}>{deathOffsetX}px</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={deathOffsetX}
                  onChange={(e) => setDeathOffsetX(Number(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", height: "4px" }}
                />
              </div>

              {/* Offset Y Slider */}
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "2px" }}>
                  <span>Offset Y:</span>
                  <span style={{ fontFamily: "monospace" }}>{deathOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={deathOffsetY}
                  onChange={(e) => setDeathOffsetY(Number(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", height: "4px" }}
                />
              </div>

              {/* Stop Wings Flapping Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ cursor: "pointer", fontWeight: 700 }}>Stop Wings:</label>
                <input
                  type="checkbox"
                  checked={deathStopWings}
                  onChange={(e) => setDeathStopWings(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
              </div>

              {/* Death Glow Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <label style={{ cursor: "pointer", fontWeight: 700 }}>Dragon Glow:</label>
                <input
                  type="checkbox"
                  checked={deathGlow}
                  onChange={(e) => setDeathGlow(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setDeathRotation(-60);
                  setDeathPivotX(85);
                  setDeathPivotY(180);
                  setDeathOffsetX(0);
                  setDeathOffsetY(0);
                  setDeathStopWings(true);
                  setDeathGlow(false);
                }}
                style={{
                  width: "100%",
                  padding: "5px",
                  borderRadius: "6px",
                  border: isDarkMode ? "1px solid rgba(255,253,236,0.3)" : "1px solid #cbd5e1",
                  background: isDarkMode ? "#1e293b" : "#f8fafc",
                  color: isDarkMode ? "#94a3b8" : "#475569",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reset to Defaults
              </button>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div
          className="tool-mode-dashboard-container"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "24px 20px",
            display: "grid",
            gap: "20px",
            boxSizing: "border-box",
          }}
        >
          {/* Header Card */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--color-surface, #ffffff)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "14px",
              padding: "16px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              {/* Game Mode Switcher on Top-Left */}
              <button
                type="button"
                className="secondary-button"
                onClick={toggleDisplayMode}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
                title="Switch to Game Mode"
                aria-label="Switch to Game Mode"
              >
                <Gamepad2 size={16} />
                Game Mode
              </button>

              {effectiveIsDefeated && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEndScreen(true);
                    setViewBattleSceneOverride(false);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    borderRadius: "8px",
                    background: "#22c55e",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(34, 197, 94, 0.4)",
                  }}
                  title="View End Screen"
                >
                  <Trophy size={16} />
                  <span>End Screen</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              )}

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text, #101517)" }}>
                    {workspace?.project?.title || state?.project?.title || "Project Workspace"}
                  </h1>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    Tool Mode
                  </span>
                </div>
                <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Team progress and tasks
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                className="quiet-button"
                onClick={() => setShowSoundSettingsModal(true)}
                style={{ padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "8px" }}
                title="Sound Settings"
              >
                <Volume2 size={16} />
                <span>Audio</span>
              </button>
            </div>
          </div>

          {/* Plain Progress Bar Card */}
          <div
            style={{
              background: "var(--color-surface, #ffffff)",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "14px",
              padding: "18px 22px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              display: "grid",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>Overall Status</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text, #101517)" }}>
                  Team progress: <span style={{ color: "#16a34a" }}>{progressPercentage}%</span>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "0.82rem", color: "#475569" }}>
                <div><strong>{completedTasksCount}</strong> of <strong>{totalTasksCount}</strong> tasks completed</div>
                <div>Deadline: <strong>{deadlineStr || "Not set"}</strong> (Day {daysPassed} of {totalDays || 14} · {daysRemaining > 0 ? `${daysRemaining} days left` : "Target passed"})</div>
              </div>
            </div>

            {/* Plain Progress Bar Track */}
            <div style={{ width: "100%", height: "12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #16a34a, #22c55e)",
                  borderRadius: "9999px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Team Roster & Contribution Dossier */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {/* Team Members */}
            <div style={{ background: "var(--color-surface, #ffffff)", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "grid", gap: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--color-text, #101517)" }}>
                Team Members ({players.length})
              </h3>
              <div style={{ display: "grid", gap: "10px" }}>
                {players.map((p) => (
                  <div key={p.profileId} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0284c7", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "0.85rem" }}>
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--color-text, #101517)" }}>{p.displayName}</div>
                      <div style={{ fontSize: "0.72rem", color: p.isActiveToday ? "#15803d" : "#94a3b8", fontWeight: 600 }}>
                        {p.isActiveToday ? "● Active today" : "○ Idle"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contribution Dossier */}
            <div style={{ background: "var(--color-surface, #ffffff)", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "grid", gap: "12px", alignContent: "start" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--color-text, #101517)" }}>
                Contribution Dossier
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                Verifiable PDF report with contribution breakdown and review history.
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={generateContributionPdf}
                style={{ padding: "10px 14px", minHeight: "unset", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              >
                <FileDown size={16} />
                Download PDF Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADJUST ELEMENTS MODAL (Dragon, HP Bar, Players)
         ========================================================================= */}
      {showAdjustElementsModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowAdjustElementsModal(false)}>
          <div
            className="rpg-modern-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "540px",
              width: "95vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              background: "#fffded",
              border: "3px solid #101517",
              boxShadow: "6px 6px 0 #101517",
              borderRadius: "16px",
              padding: "20px",
              gap: "14px",
              transform: `translate(${adjustModalPos.x}px, ${adjustModalPos.y}px)`,
              transition: isDraggingAdjustModal ? "none" : "transform 0.1s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: isDraggingAdjustModal ? "grabbing" : "grab",
                userSelect: "none",
              }}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).tagName === "BUTTON") return;
                setIsDraggingAdjustModal(true);
                adjustModalDragStartRef.current = {
                  mouseX: e.clientX,
                  mouseY: e.clientY,
                  startX: adjustModalPos.x,
                  startY: adjustModalPos.y,
                };
              }}
              onTouchStart={(e) => {
                if ((e.target as HTMLElement).tagName === "BUTTON") return;
                setIsDraggingAdjustModal(true);
                adjustModalDragStartRef.current = {
                  mouseX: e.touches[0].clientX,
                  mouseY: e.touches[0].clientY,
                  startX: adjustModalPos.x,
                  startY: adjustModalPos.y,
                };
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <GripHorizontal size={20} style={{ color: "#64748b" }} />
                <Sliders size={20} />
                <h3 className="rpg-modern-title" style={{ fontSize: "1.25rem", margin: 0 }}>
                  Adjust Elements
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustElementsModal(false)}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "2px solid #101517",
                  borderRadius: "8px",
                  width: "30px",
                  height: "30px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "0.82rem", color: "#475569" }}>
              Fine-tune the layout position, scale, and size of the dragon, dragon health bar, and party heroes. Changes persist automatically.
            </p>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "4px" }}>
              {/* 1. Dragon Health Bar */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="Heart" /> Dragon Health Bar
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {dragonHpBarPos.x}px
                    </label>
                    <input
                      type="range"
                      min="-250"
                      max="250"
                      value={dragonHpBarPos.x}
                      onChange={(e) => setDragonHpBarPos((prev) => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                      style={{ width: "100%", accentColor: "#ef4444" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {dragonHpBarPos.y}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={dragonHpBarPos.y}
                      onChange={(e) => setDragonHpBarPos((prev) => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                      style={{ width: "100%", accentColor: "#ef4444" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Width: {dragonHpBarWidth}px
                    </label>
                    <input
                      type="range"
                      min="80"
                      max="260"
                      value={dragonHpBarWidth}
                      onChange={(e) => setDragonHpBarWidth(parseInt(e.target.value) || 125)}
                      style={{ width: "100%", accentColor: "#ef4444" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {dragonHpBarScale.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={dragonHpBarScale}
                      onChange={(e) => setDragonHpBarScale(parseFloat(e.target.value) || 1)}
                      style={{ width: "100%", accentColor: "#ef4444" }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dragon Boss */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="Flame" /> Dragon Boss Element
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {layerTransforms.dragon?.x || 0}px
                    </label>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={layerTransforms.dragon?.x || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setLayerTransforms((prev) => ({ ...prev, dragon: { ...prev.dragon, x: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#dc2626" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {layerTransforms.dragon?.y || 0}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={layerTransforms.dragon?.y || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setLayerTransforms((prev) => ({ ...prev, dragon: { ...prev.dragon, y: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#dc2626" }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {((layerTransforms.dragon?.scale || 1)).toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.2"
                      step="0.05"
                      value={layerTransforms.dragon?.scale || 1}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setLayerTransforms((prev) => ({ ...prev, dragon: { ...prev.dragon, scale: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#dc2626" }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Player Party */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="WandSparkles" /> Player Party Heroes
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {layerTransforms.players?.x || 0}px
                    </label>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={layerTransforms.players?.x || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setLayerTransforms((prev) => ({ ...prev, players: { ...prev.players, x: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#2563eb" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {layerTransforms.players?.y || 0}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={layerTransforms.players?.y || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setLayerTransforms((prev) => ({ ...prev, players: { ...prev.players, y: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#2563eb" }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {((layerTransforms.players?.scale || 1)).toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.2"
                      step="0.05"
                      value={layerTransforms.players?.scale || 1}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setLayerTransforms((prev) => ({ ...prev, players: { ...prev.players, scale: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#2563eb" }}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Green Part (Grass Plateau) */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="Sprout" /> Green Part (Grass Plateau)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {terrainOffsets.green.x}px
                    </label>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={terrainOffsets.green.x}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, green: { ...prev.green, x: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#16a34a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {terrainOffsets.green.y}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={terrainOffsets.green.y}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, green: { ...prev.green, y: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#16a34a" }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {terrainOffsets.green.scale.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={terrainOffsets.green.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setTerrainOffsets((prev) => ({ ...prev, green: { ...prev.green, scale: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#16a34a" }}
                    />
                  </div>
                </div>
              </div>

              {/* 5. Floating Island (Rock Base) */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="Mountain" /> Floating Island (Rock Base)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {terrainOffsets.island.x}px
                    </label>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={terrainOffsets.island.x}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, island: { ...prev.island, x: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#78350f" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {terrainOffsets.island.y}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={terrainOffsets.island.y}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, island: { ...prev.island, y: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#78350f" }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {terrainOffsets.island.scale.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={terrainOffsets.island.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setTerrainOffsets((prev) => ({ ...prev, island: { ...prev.island, scale: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#78350f" }}
                    />
                  </div>
                </div>
              </div>

              {/* 6. Mountains Behind */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="Mountain" /> Mountains Behind
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {terrainOffsets.mountain.x}px
                    </label>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={terrainOffsets.mountain.x}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, mountain: { ...prev.mountain, x: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#64748b" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {terrainOffsets.mountain.y}px
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="250"
                      value={terrainOffsets.mountain.y}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, mountain: { ...prev.mountain, y: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#64748b" }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {terrainOffsets.mountain.scale.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={terrainOffsets.mountain.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setTerrainOffsets((prev) => ({ ...prev, mountain: { ...prev.mountain, scale: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#64748b" }}
                    />
                  </div>
                </div>
              </div>

              {/* 7. Clouds */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="Cloud" /> Clouds
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {terrainOffsets.cloud.x}px
                    </label>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={terrainOffsets.cloud.x}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, cloud: { ...prev.cloud, x: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#38bdf8" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {terrainOffsets.cloud.y}px
                    </label>
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      value={terrainOffsets.cloud.y}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTerrainOffsets((prev) => ({ ...prev, cloud: { ...prev.cloud, y: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#38bdf8" }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {terrainOffsets.cloud.scale.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={terrainOffsets.cloud.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setTerrainOffsets((prev) => ({ ...prev, cloud: { ...prev.cloud, scale: val } }));
                      }}
                      style={{ width: "100%", accentColor: "#38bdf8" }}
                    />
                  </div>
                </div>
              </div>

              {/* 8. Task Progress Bar */}
              <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: 900, color: "#101517" }}>
                  <UiIcon name="Target" /> Task Progress Bar
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Horizontal X: {pvzBarOffset.x}px
                    </label>
                    <input
                      type="range"
                      min="-350"
                      max="350"
                      value={pvzBarOffset.x}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPvzBarOffset((prev) => ({ ...prev, x: val }));
                      }}
                      style={{ width: "100%", accentColor: "#16a34a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Vertical Y: {pvzBarOffset.y}px
                    </label>
                    <input
                      type="range"
                      min="-150"
                      max="300"
                      value={pvzBarOffset.y}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPvzBarOffset((prev) => ({ ...prev, y: val }));
                      }}
                      style={{ width: "100%", accentColor: "#16a34a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Width: {pvzBarOffset.width}px
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="850"
                      value={pvzBarOffset.width}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 380;
                        setPvzBarOffset((prev) => ({ ...prev, width: val }));
                      }}
                      style={{ width: "100%", accentColor: "#16a34a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 800, marginBottom: "4px" }}>
                      Scale: {pvzBarOffset.scale.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={pvzBarOffset.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setPvzBarOffset((prev) => ({ ...prev, scale: val }));
                      }}
                      style={{ width: "100%", accentColor: "#16a34a" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "2px solid #101517" }}>
              <button
                type="button"
                className="rpg-modern-btn is-secondary"
                onClick={() => {
                  setDragonHpBarPos({ x: 0, y: 0 });
                  setDragonHpBarWidth(125);
                  setDragonHpBarScale(1);
                  setLayerTransforms((prev) => ({
                    ...prev,
                    dragon: { x: 0, y: 0, scale: 1, visible: true },
                    players: { x: 0, y: 0, scale: 1, visible: true },
                  }));
                  setTerrainOffsets({
                    mountain: { x: 0, y: 130, scale: 1 },
                    island: { x: 0, y: 0, scale: 1 },
                    green: { x: 0, y: 0, scale: 1 },
                    cloud: { x: 0, y: 0, scale: 1 },
                  });
                  setPvzBarOffset({
                    x: 0,
                    y: 0,
                    width: 380,
                    scale: 1.05,
                    visible: true,
                  });
                  setPvzBarPos({ x: 0, y: 0 });
                  setAdjustModalPos({ x: 0, y: 0 });
                }}
                style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                className="rpg-modern-btn is-primary"
                onClick={() => setShowAdjustElementsModal(false)}
                style={{ fontSize: "0.78rem", padding: "6px 18px" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TESTING ATTACK & DUMMY PLAYERS GENERATOR MODAL
         ========================================================================= */}
      {showDummyTestModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowDummyTestModal(false)}>
          <div
            className="rpg-modern-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "500px",
              width: "95vw",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              background: "#fffded",
              border: "3px solid #101517",
              boxShadow: "6px 6px 0 #101517",
              borderRadius: "16px",
              padding: "20px",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Gamepad2 size={22} style={{ color: "#e11d48" }} />
                <h3 className="rpg-modern-title" style={{ fontSize: "1.25rem", margin: 0 }}>
                  Testing Attack & Dummy Heroes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDummyTestModal(false)}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "2px solid #101517",
                  borderRadius: "8px",
                  width: "30px",
                  height: "30px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "0.82rem", color: "#475569", lineHeight: 1.45 }}>
              Use this debugging tool to test island plateau capacity, hero layout auto-scaling, staff tilting, and elemental projectile animations. In normal game mode, only heroes who have submitted tasks cast projectiles.
            </p>

            {/* Toggle Testing Mode */}
            <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.88rem", fontWeight: 900, color: "#101517" }}>
                  Dummy Heroes Attack Simulation
                </span>
                <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                  {isDummyTestingActive ? "Active — Spawning dummy test heroes" : "Off — Showing real project members"}
                </span>
              </div>
              <button
                type="button"
                className={`rpg-modern-btn ${isDummyTestingActive ? "is-boss" : "is-primary"}`}
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => {
                  const next = !isDummyTestingActive;
                  setIsDummyTestingActive(next);
                  if (next) {
                    gameAudio.playProjectileSound(dummyElementFilter === "mixed" ? "fire" : dummyElementFilter);
                    gameAudio.playDragonRoar();
                  }
                }}
              >
                {isDummyTestingActive ? "Turn Off Simulation" : "Activate Simulation"}
              </button>
            </div>

            {/* Dummy Heroes Count (1 to 25) */}
            <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517", display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 900, color: "#101517" }}>
                  Dummy Heroes Count (Island Capacity)
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#e11d48" }}>
                  {dummyPlayerCount} Heroes
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={dummyPlayerCount}
                onChange={(e) => setDummyPlayerCount(parseInt(e.target.value, 10) || 1)}
                style={{ width: "100%", accentColor: "#e11d48" }}
              />
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Heroes dynamically auto-grid and auto-scale to stay strictly on the floating island plateau.
              </span>
            </div>

            {/* Elemental Setting */}
            <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 900, color: "#101517" }}>
                Elemental Projectile Type
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                {(["mixed", "fire", "ice", "lightning", "arcane"] as const).map((elem) => (
                  <button
                    key={elem}
                    type="button"
                    className={`rpg-modern-btn ${dummyElementFilter === elem ? "is-primary" : "is-secondary"}`}
                    style={{
                      padding: "6px 2px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      textTransform: "capitalize",
                      background: dummyElementFilter === elem ? "#0284c7" : undefined,
                      color: dummyElementFilter === elem ? "#ffffff" : undefined,
                    }}
                    onClick={() => {
                      setDummyElementFilter(elem);
                      gameAudio.playProjectileSound(elem === "mixed" ? "fire" : elem);
                    }}
                  >
                    {elem}
                  </button>
                ))}
              </div>
            </div>

            {/* Single User Submit Task Simulation */}
            <div style={{ background: "#ffffff", border: "2px solid #101517", borderRadius: "10px", padding: "12px", boxShadow: "2px 2px 0 #101517", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 900, color: "#101517" }}>
                  Current User Task Submit Test
                </span>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  {isDummyTaskSubmitted ? "Simulating submitted task (tilt + attack active)" : "Normal idle state (staff upright)"}
                </span>
              </div>
              <button
                type="button"
                className={`rpg-modern-btn ${isDummyTaskSubmitted ? "is-boss" : "is-secondary"}`}
                style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                onClick={() => {
                  const next = !isDummyTaskSubmitted;
                  setIsDummyTaskSubmitted(next);
                }}
              >
                {isDummyTaskSubmitted ? "Undo Task Submit" : "Simulate Task Submit"}
              </button>
            </div>

            <button
              type="button"
              className="rpg-modern-btn is-primary"
              style={{ marginTop: "4px" }}
              onClick={() => setShowDummyTestModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MY TASKS MODAL (Clean website design, shows all tasks, 40% transparent for completed)
         ========================================================================= */}
      {showMyTasksModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowMyTasksModal(false)}>
          <div
            className="rpg-modern-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "680px",
              width: "95vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              background: "var(--color-surface, #ffffff)",
              border: "1px solid var(--color-border, #e2e8f0)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              borderRadius: "16px",
              padding: "22px 24px",
            }}
          >
            {/* Header: Title "My Tasks" + count badges, and clean close button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text, #101517)" }}>
                  My Tasks
                </h3>
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "999px",
                    padding: "2px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {myAllTasks.length} {myAllTasks.length === 1 ? "task" : "tasks"}
                </span>
                {myAllTasks.filter((t) => t.status === "completed" || t.status === "verified").length > 0 && (
                  <span
                    style={{
                      background: "#dcfce7",
                      color: "#15803d",
                      border: "1px solid #86efac",
                      borderRadius: "999px",
                      padding: "2px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    <UiIcon name="Check" /> {myAllTasks.filter((t) => t.status === "completed" || t.status === "verified").length} completed
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMyTasksModal(false)}
                style={{
                  background: "transparent",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  transition: "all 0.15s ease",
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Body: Task list with status handling */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "4px 2px" }}>
              {myAllTasks.length === 0 ? (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    margin: "12px 0",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text, #101517)" }}>
                    No tasks assigned to you yet
                  </p>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem" }}>
                    Tasks assigned to you will appear here with live completion and review statuses.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {myAllTasks.map((task) => {
                    const isCompleted = task.status === "completed" || task.status === "verified";
                    const isPendingReview = task.status === "review" || task.status === "submitted" || task.status === "awaiting_creator";
                    const creator = workspace?.members.find((m) => m?.profileId === task.createdByProfileId);
                    const creatorName = creator?.displayName || "Creator";

                    return (
                      <div
                        key={task._id}
                        style={{
                          border: "1px solid var(--color-border, #e2e8f0)",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          background: isCompleted ? "#f8fafc" : "var(--color-surface, #ffffff)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "14px",
                          opacity: isCompleted ? 0.4 : 1,
                          transition: "opacity 0.2s ease, border-color 0.2s ease",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            {isCompleted && (
                              <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                            )}
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: "0.92rem",
                                color: isCompleted ? "#64748b" : "var(--color-text, #101517)",
                                textDecoration: isCompleted ? "line-through" : "none",
                              }}
                            >
                              {task.title}
                            </span>
                            {isCompleted ? (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "2px 10px",
                                  borderRadius: "9999px",
                                  background: "#dcfce7",
                                  color: "#15803d",
                                  border: "1.5px solid #86efac",
                                  letterSpacing: "0.02em",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <UiIcon name="Check" /> COMPLETE
                              </span>
                            ) : isPendingReview ? (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "2px 10px",
                                  borderRadius: "9999px",
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  border: "1.5px solid #fde68a",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                IN REVIEW
                              </span>
                            ) : task.status === "in_progress" ? (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "2px 10px",
                                  borderRadius: "9999px",
                                  background: "color-mix(in srgb, #4ca0fe 16%, #ffffff)",
                                  color: "#095cad",
                                  border: "1.5px solid #4ca0fe",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                IN PROGRESS
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 900,
                                  padding: "2px 10px",
                                  borderRadius: "9999px",
                                  background: "color-mix(in srgb, var(--mld-xp, #fd39e4) 14%, #ffffff)",
                                  color: "#b80f9f",
                                  border: "1.5px solid #fd39e4",
                                  letterSpacing: "0.03em",
                                }}
                              >
                                TO DO
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>
                              {task.description}
                            </p>
                          )}

                          <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "0.75rem", color: "#64748b" }}>
                            <span>Due: <strong style={{ color: task.dueDate ? "#334155" : "#94a3b8" }}>{task.dueDate || "No deadline"}</strong></span>
                            <span>Created by: <strong>{creatorName}</strong></span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                          {!isCompleted && !isPendingReview && (
                            <button
                              type="button"
                              className="primary-button"
                              style={{ padding: "6px 14px", minHeight: "unset", fontSize: "0.8rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                              onClick={() => {
                                setSelectedTaskId(task._id);
                                if (task.reviewerProfileId) {
                                  setSelectedReviewerId(task.reviewerProfileId);
                                }
                                setShowBossModal(true);
                                setShowMyTasksModal(false);
                              }}
                            >
                              Submit Proof
                            </button>
                          )}
                          {isPendingReview && (
                            <span style={{ fontSize: "0.76rem", color: "#b45309", fontWeight: 700, background: "#fef3c7", padding: "4px 10px", borderRadius: "6px", border: "1px solid #fde68a" }}>
                              Awaiting peer review
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PEER REVIEW MODAL (Clean format, pending review tasks on user)
         ========================================================================= */}
      {showPeerReviewModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowPeerReviewModal(false)}>
          <div
            className="rpg-modern-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "680px",
              width: "95vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              background: "var(--color-surface, #ffffff)",
              border: "1px solid var(--color-border, #e2e8f0)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              borderRadius: "16px",
              padding: "22px 24px",
              color: "var(--color-text, #101517)",
            }}
          >
            {/* Header: Title "Peer Review" + badge, and clean close button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text, #101517)" }}>
                  Peer Review
                </h3>
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "999px",
                    padding: "2px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {pendingReviews.length} {pendingReviews.length === 1 ? "Pending" : "Pending"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPeerReviewModal(false);
                  setSelectedReviewTask(null);
                }}
                style={{
                  background: "transparent",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  transition: "all 0.15s ease",
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable list of pending review tasks */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "4px 2px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingReviews.length === 0 ? (
                <div
                  style={{
                    background: "var(--mld-surface-02, #f8fafc)",
                    border: "1px dashed var(--color-border, #cbd5e1)",
                    borderRadius: "12px",
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "var(--color-muted, #64748b)",
                    margin: "12px 0",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text, #101517)" }}>
                    No pending reviews
                  </p>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem" }}>
                    All submitted tasks assigned to you have been reviewed.
                  </p>
                </div>
              ) : (
                pendingReviews.map((task) => {
                  const isBeingReviewed = reviewingTaskId === task._id;
                  return (
                    <div
                      key={task._id}
                      style={{
                        background: "var(--mld-surface-02, #ffffff)",
                        border: "1px solid var(--color-border, #e2e8f0)",
                        borderRadius: "12px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--color-text, #101517)" }}>
                            {task.title}
                          </h4>
                          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted, #64748b)", marginTop: "3px" }}>
                            Submitted by: {task.assigneeName} · Due: {task.dueDate || "No deadline"}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: task.isCreatorApproval ? "#fed7aa" : "#bae6fd",
                            color: task.isCreatorApproval ? "#c2410c" : "#0369a1",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.isCreatorApproval ? "Creator Final Approval" : "Peer Review Required"}
                        </span>
                      </div>

                      {task.description && (
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-muted, #475569)", lineHeight: 1.4 }}>
                          {task.description}
                        </p>
                      )}

                      <PeerReviewEvidencePreview taskId={task._id} />

                      {!isBeingReviewed ? (
                        <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                          <button
                            className="primary-button"
                            type="button"
                            style={{ padding: "6px 14px", minHeight: "unset", fontSize: "0.8rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => {
                              setReviewingTaskId(task._id);
                              setReviewComment("");
                              setReviewError(null);
                            }}
                          >
                            Review Proof & Decide
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid var(--color-border, #e2e8f0)" }}>
                          {reviewError && (
                            <div style={{ padding: "6px 10px", background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "6px", color: "#b91c1c", fontSize: "0.78rem", fontWeight: 700 }}>
                              {reviewError}
                            </div>
                          )}
                          <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--color-text, #101517)" }}>
                            Reviewer Feedback & Notes:
                          </label>
                          <textarea
                            className="rpg-modern-textarea"
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Add notes for your peer (required if requesting changes)..."
                            style={{
                              background: "var(--color-surface, #ffffff)",
                              border: "1px solid var(--color-border, #cbd5e1)",
                              color: "var(--color-text, #101517)",
                              borderRadius: "8px",
                              padding: "8px 10px",
                            }}
                          />
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              className="primary-button"
                              type="button"
                              disabled={isSubmittingReview}
                              style={{ padding: "6px 14px", minHeight: "unset", fontSize: "0.8rem", background: "#22c55e", color: "#ffffff", border: "1px solid #16a34a", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                              onClick={() => handleReviewDecision(task._id, "approved", Boolean(task.isCreatorApproval))}
                            >
                              {isSubmittingReview ? "Submitting..." : "Approve & Deal Boss Damage"}
                            </button>
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={isSubmittingReview}
                              style={{ padding: "6px 12px", minHeight: "unset", fontSize: "0.8rem", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                              onClick={() => handleReviewDecision(task._id, "changes_requested", Boolean(task.isCreatorApproval))}
                            >
                              Request Changes
                            </button>
                            <button
                              className="quiet-button"
                              type="button"
                              disabled={isSubmittingReview}
                              style={{ padding: "6px 12px", minHeight: "unset", fontSize: "0.8rem", borderRadius: "8px", cursor: "pointer" }}
                              onClick={() => {
                                setReviewingTaskId(null);
                                setReviewError(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BOSS ATTACK QUEST PINNED BOARD MODAL (Modern Neo-Brutalist)
         ========================================================================= */}
      {showBossModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowBossModal(false)}>
          <div className="rpg-modern-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="rpg-modern-title"><UiIcon name="Flame" /> Attack The Dragon</h3>
              <button
                type="button"
                onClick={() => setShowBossModal(false)}
                style={{ background: "#ef4444", color: "#fff", border: "2px solid #101517", borderRadius: "8px", width: "28px", height: "28px", display: "grid", placeItems: "center", cursor: "pointer", fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            {bossError && (
              <div style={{ padding: "8px 12px", background: "#fee2e2", border: "2px solid #ef4444", borderRadius: "8px", color: "#b91c1c", fontSize: "0.82rem", fontWeight: 800 }}>
                {bossError}
              </div>
            )}

            {myAssignableTasks.length === 0 ? (
              <div style={{ background: "#f8fafc", border: "2px dashed #94a3b8", borderRadius: "12px", padding: "20px", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontWeight: 800, color: "#101517", fontSize: "0.95rem" }}>You do not have any active quests assigned!</p>
                <p style={{ margin: "6px 0 14px 0", fontSize: "0.82rem" }}>Claim an open quest from the in-game Quest Board or create a new task to attack the dragon.</p>
                <button
                  className="rpg-modern-btn is-primary"
                  type="button"
                  onClick={() => {
                    setShowBossModal(false);
                    setShowCreateQuestModal(true);
                  }}
                >
                  + Create New Quest
                </button>
              </div>
            ) : !selectedTaskId ? (
              <>
                <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9 }}>
                  Select one of your assigned quests below to submit proof and deal combat damage to the dragon.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxHeight: "240px", overflowY: "auto", padding: "2px" }}>
                  {myAssignableTasks.map((task) => {
                    const creatorName = workspace?.members.find((m) => m?.profileId === task.createdByProfileId)?.displayName ?? "Creator";
                    return (
                      <div
                        key={task._id}
                        style={{
                          background: "#ffffff",
                          border: "2px solid #101517",
                          borderRadius: "10px",
                          padding: "10px",
                          cursor: "pointer",
                          boxShadow: "3px 3px 0 #101517",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "8px",
                          transition: "transform 0.15s ease",
                        }}
                        onClick={() => {
                          setSelectedTaskId(task._id);
                          if (task.reviewerProfileId) {
                            setSelectedReviewerId(task.reviewerProfileId);
                          }
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                      >
                        <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 900, color: "#101517" }}>{task.title}</h4>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                          <span><UiIcon name="CalendarDays" /> {task.dueDate}</span>
                          <span><UiIcon name="User" /> {creatorName}</span>
                        </div>
                        <button
                          className="rpg-modern-btn is-boss"
                          type="button"
                          style={{ padding: "4px 8px", fontSize: "0.72rem", width: "100%" }}
                        >
                          Select Quest
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <form onSubmit={handleBossSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(() => {
                  const task = workspace?.tasks?.find((t) => t._id === selectedTaskId) || myAssignableTasks.find((t) => t._id === selectedTaskId);
                  if (!task) return null;
                  const creatorName = workspace?.members.find((m) => m?.profileId === task.createdByProfileId)?.displayName ?? "Creator";
                  return (
                    <div style={{ background: "#bae6fd", border: "2px solid #101517", borderRadius: "10px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div>
                        <span style={{ fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", color: "#0369a1" }}>Selected Task</span>
                        <h4 style={{ margin: "2px 0 0 0", fontSize: "0.95rem", fontWeight: 900, color: "#101517" }}>{task.title}</h4>
                        {task.description && (
                          <p style={{ margin: "4px 0 6px 0", fontSize: "0.82rem", color: "#0c4a6e", lineHeight: 1.35 }}>
                            {task.description}
                          </p>
                        )}
                        <span style={{ fontSize: "0.74rem", color: "#075985", fontWeight: 700 }}><UiIcon name="CalendarDays" /> Due {task.dueDate || "No deadline"} | Assigned by {creatorName}</span>
                      </div>
                      <button
                        className="rpg-modern-btn is-secondary"
                        type="button"
                        style={{ padding: "4px 10px", fontSize: "0.74rem", flexShrink: 0 }}
                        onClick={() => {
                          setSelectedTaskId(null);
                          setShowBossModal(false);
                          setShowMyTasksModal(true);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  );
                })()}

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "6px" }}>
                    Select Evidence Type
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(["note", "link", "image", "pdf"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`rpg-modern-btn ${evidenceType === tab ? "is-primary" : "is-secondary"}`}
                        style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                        onClick={() => {
                          setEvidenceType(tab);
                          setEvidenceFile(null);
                        }}
                      >
                        {tab === "note" ? <><UiIcon name="FileText" /> Short Note</> : tab === "link" ? <><UiIcon name="Link" /> External Link</> : tab === "image" ? <><UiIcon name="Image" /> Image File</> : <><UiIcon name="FileText" /> PDF File</>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {evidenceType === "note" && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                        Progress Note
                      </label>
                      <textarea
                        className="rpg-modern-textarea"
                        rows={3}
                        value={evidenceNote}
                        onChange={(e) => setEvidenceNote(e.target.value)}
                        placeholder="Write a short summary of the completed work..."
                        required
                      />
                    </div>
                  )}

                  {evidenceType === "link" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                          Link URL
                        </label>
                        <input
                          type="url"
                          className="rpg-modern-input"
                          value={evidenceUrl}
                          onChange={(e) => setEvidenceUrl(e.target.value)}
                          placeholder="https://github.com/..."
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                          Optional Progress Note
                        </label>
                        <textarea
                          className="rpg-modern-textarea"
                          rows={2}
                          value={evidenceNote}
                          onChange={(e) => setEvidenceNote(e.target.value)}
                          placeholder="Add extra context about the link..."
                        />
                      </div>
                    </div>
                  )}

                  {(evidenceType === "image" || evidenceType === "pdf") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                          Upload {evidenceType === "image" ? "Image File (Max 5MB)" : "PDF File (Max 10MB)"}
                        </label>
                        <input
                          type="file"
                          className="rpg-modern-input"
                          accept={evidenceType === "image" ? "image/*" : "application/pdf"}
                          onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                          required
                        />
                      </div>
                      {uploadProgress > 0 && (
                        <div style={{ background: "#e2e8f0", border: "1.5px solid #101517", height: "12px", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ background: "#22c55e", height: "100%", width: `${uploadProgress}%`, transition: "width 0.2s ease" }} />
                        </div>
                      )}
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                          Optional Note
                        </label>
                        <textarea
                          className="rpg-modern-textarea"
                          rows={2}
                          value={evidenceNote}
                          onChange={(e) => setEvidenceNote(e.target.value)}
                          placeholder="Describe the uploaded file..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {(() => {
                  if (isSoloProject || eligibleReviewers.length === 0) return null;
                  const task = myAssignableTasks.find((t) => t._id === selectedTaskId);
                  if (task && !task.reviewerProfileId) {
                    return (
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                          Select Teammate to Review Your Quest
                        </label>
                        <select
                          className="rpg-modern-select"
                          value={selectedReviewerId}
                          onChange={(e) => setSelectedReviewerId(e.target.value)}
                          required
                        >
                          <option value="">-- Select Reviewer --</option>
                          {eligibleReviewers.map((m) => (
                            <option key={m.profileId} value={m.profileId}>
                              {m.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}

                <button
                  className="rpg-modern-btn is-boss"
                  type="submit"
                  disabled={isSubmittingTask}
                  style={{ marginTop: "4px" }}
                >
                  {isSubmittingTask
                    ? "Submitting Evidence..."
                    : isSoloProject
                      ? <><UiIcon name="Zap" /> Submit Proof & Complete Task!</>
                      : <><UiIcon name="Swords" /> Submit Proof for Peer Review!</>}
                </button>

                <button
                  className="rpg-modern-btn is-secondary"
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(null);
                    setEvidenceNote("");
                    setEvidenceUrl("");
                    setEvidenceFile(null);
                    setSelectedReviewerId("");
                    setShowBossModal(false);
                    setShowMyTasksModal(true);
                  }}
                >
                  Back to My Tasks
                </button>
              </form>
            )}

            <button className="rpg-modern-btn is-secondary" type="button" onClick={() => setShowBossModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULL IN-CANVAS QUEST BOARD OVERLAY PANEL
         ========================================================================= */}
      {showQuestBoardModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowQuestBoardModal(false)}>
          <div
            className="rpg-modern-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "720px", width: "95vw", height: "600px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}
          >
            {/* Header */}
            <div className="rpg-modal-divider" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 className="rpg-modern-title" style={{ fontSize: "1.28rem" }}>
                  Tasks & Quests
                </h3>
                <span
                  style={{
                    background: "#fff73f",
                    color: "#101517",
                    border: "1.5px solid #101517",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "0.74rem",
                    fontWeight: 900,
                  }}
                >
                  {questTasks.length} {questTasks.length === 1 ? "Quest" : "Quests"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  className="rpg-modern-btn is-primary"
                  type="button"
                  style={{ padding: "6px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                  onClick={() => {
                    const isRoomOwner = workspace?.project?.creatorProfileId === state?.currentProfileId;
                    if (!isRoomOwner) {
                      setCreateQuestError("Only the room owner can create new tasks.");
                    } else {
                      setCreateQuestError(null);
                    }
                    setShowCreateQuestModal(true);
                  }}
                >
                  + New Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestBoardModal(false)}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "2px solid #101517",
                    borderRadius: "8px",
                    width: "30px",
                    height: "30px",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Navigation Tabs (All Tasks, My Tasks, Reviews, Daily Proof) */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "10px 0 6px 0", flexShrink: 0 }}>
              {[
                { id: "all", label: `All Tasks (${questTasks.length})` },
                { id: "mine", label: `My Tasks (${questTasks.filter((t) => t.isMine).length})` },
                { id: "reviews", label: `Reviews (${pendingReviews.length})` },
                { id: "daily_proof", label: `Daily Proof (${dailyPosts?.length ?? 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`rpg-modern-btn ${questBoardTab === tab.id ? "is-primary" : "is-secondary"}`}
                  style={{ padding: "5px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                  onClick={() => setQuestBoardTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body: Scrollable, UI height stays stable */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "4px 2px" }}>
              {/* TAB 1 & 2: ALL TASKS / MY TASKS */}
              {(questBoardTab === "all" || questBoardTab === "mine") && (
                <div>
                  {(() => {
                    const filtered = questTasks.filter((t) => {
                      if (questBoardTab === "mine") return t.isMine;
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div
                          style={{
                            background: "rgba(16,21,23,0.04)",
                            border: "2px dashed #94a3b8",
                            borderRadius: "12px",
                            padding: "32px 16px",
                            textAlign: "center",
                            color: "#64748b",
                            margin: "12px 0",
                          }}
                        >
                          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "#101517" }}>
                            {questBoardTab === "mine" ? "No tasks assigned to you yet!" : "No tasks found!"}
                          </p>
                          <p style={{ margin: "6px 0 14px 0", fontSize: "0.82rem" }}>
                            {questBoardTab === "mine" ? "Claim an open task or create a new task to help defeat the dragon." : "Create a new task to coordinate team tasks and defend the realm."}
                          </p>
                          <button
                            className="rpg-modern-btn is-primary"
                            type="button"
                            onClick={() => {
                              const isRoomOwner = workspace?.project?.creatorProfileId === state?.currentProfileId;
                              if (!isRoomOwner) {
                                setCreateQuestError("Only the room owner can create new tasks.");
                              } else {
                                setCreateQuestError(null);
                              }
                              setShowCreateQuestModal(true);
                            }}
                          >
                            + New Task
                          </button>
                        </div>
                      );
                    }

                    const NOTE_PALETTES = [
                      { bg: "#fef08a", border: "#ca8a04", pin: "#ef4444" },
                      { bg: "#bae6fd", border: "#0284c7", pin: "#f97316" },
                      { bg: "#fbcfe8", border: "#db2777", pin: "#8b5cf6" },
                      { bg: "#bbf7d0", border: "#16a34a", pin: "#ef4444" },
                      { bg: "#fed7aa", border: "#ea580c", pin: "#0ea5e9" },
                    ];

                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: "12px",
                          paddingBottom: "8px",
                        }}
                      >
                        {filtered.map((task, idx) => {
                          const palette = NOTE_PALETTES[idx % NOTE_PALETTES.length];
                          return (
                            <QuestCardHoverItem
                              key={task._id}
                              task={task}
                              palette={palette}
                              isClaimingQuest={isClaimingQuest}
                              onClaim={handleClaimQuest}
                              onAttack={(t) => {
                                setShowQuestBoardModal(false);
                                setSelectedTaskId(t._id);
                                setShowBossModal(true);
                              }}
                              onDetails={(t) => setSelectedQuestTask(t)}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: REVIEWS */}
              {questBoardTab === "reviews" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "8px" }}>
                  {pendingReviews.length === 0 ? (
                    <div
                      style={{
                        background: "rgba(16,21,23,0.04)",
                        border: "2px dashed #94a3b8",
                        borderRadius: "12px",
                        padding: "36px 16px",
                        textAlign: "center",
                        color: "#64748b",
                        margin: "12px 0",
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "#101517" }}>
                        No pending reviews!
                      </p>
                      <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem" }}>
                        You have reviewed all submitted quests assigned to you.
                      </p>
                    </div>
                  ) : (
                    pendingReviews.map((task) => {
                      const isBeingReviewed = reviewingTaskId === task._id;
                      return (
                        <div
                          key={task._id}
                          style={{
                            background: "#ffffff",
                            border: "2px solid #101517",
                            borderRadius: "10px",
                            padding: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#101517" }}>
                                {task.title}
                              </h4>
                              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginTop: "2px" }}>
                                Submitted by: {task.assigneeName} · Due: {task.dueDate || "No deadline"}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                background: task.isCreatorApproval ? "#fed7aa" : "#bae6fd",
                                color: task.isCreatorApproval ? "#c2410c" : "#0369a1",
                                border: `1.5px solid ${task.isCreatorApproval ? "#ea580c" : "#0284c7"}`,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {task.isCreatorApproval ? "Creator Final Approval" : "Peer Review Required"}
                            </span>
                          </div>

                          {task.description && (
                            <p style={{ margin: 0, fontSize: "0.82rem", color: "#334155", lineHeight: "1.4" }}>
                              {task.description}
                            </p>
                          )}

                          {!isBeingReviewed ? (
                            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                              <button
                                className="rpg-modern-btn is-primary"
                                type="button"
                                style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                                onClick={() => {
                                  setReviewingTaskId(task._id);
                                  setReviewComment("");
                                  setReviewError(null);
                                }}
                              >
                                Review Submission
                              </button>
                              <button
                                className="rpg-modern-btn is-secondary"
                                type="button"
                                style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                                onClick={() => setSelectedQuestTask(task)}
                              >
                                View Full Details
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", paddingTop: "8px", borderTop: "1.5px solid #101517" }}>
                              {reviewError && (
                                <div style={{ padding: "6px 10px", background: "#fee2e2", border: "1.5px solid #ef4444", borderRadius: "6px", color: "#b91c1c", fontSize: "0.78rem", fontWeight: 800 }}>
                                  {reviewError}
                                </div>
                              )}
                              <label style={{ fontSize: "0.76rem", fontWeight: 800 }}>
                                Reviewer Feedback & Notes:
                              </label>
                              <textarea
                                className="rpg-modern-textarea"
                                rows={2}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Add notes for your peer (required if requesting changes)..."
                              />
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="rpg-modern-btn is-boss"
                                  type="button"
                                  disabled={isSubmittingReview}
                                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                                  onClick={() => handleReviewDecision(task._id, "approved", Boolean(task.isCreatorApproval))}
                                >
                                  {isSubmittingReview ? "Submitting..." : "Approve & Slay Dragon"}
                                </button>
                                <button
                                  className="rpg-modern-btn is-secondary"
                                  type="button"
                                  disabled={isSubmittingReview}
                                  style={{ padding: "6px 12px", fontSize: "0.78rem", background: "#fee2e2", color: "#991b1b" }}
                                  onClick={() => handleReviewDecision(task._id, "changes_requested", Boolean(task.isCreatorApproval))}
                                >
                                  Request Changes
                                </button>
                                <button
                                  className="rpg-modern-btn is-secondary"
                                  type="button"
                                  disabled={isSubmittingReview}
                                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                                  onClick={() => {
                                    setReviewingTaskId(null);
                                    setReviewError(null);
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 4: DAILY PROOF (Forum Chat Feed) */}
              {questBoardTab === "daily_proof" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1.5px solid #101517", borderRadius: "8px", padding: "8px 12px", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>
                      Messages and daily updates are included in the project’s contribution PDF.
                    </span>
                    <button
                      className="rpg-modern-btn is-primary"
                      type="button"
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      onClick={() => {
                        setShowQuestBoardModal(false);
                        setShowGoblinModal(true);
                      }}
                    >
                      + Slay Daily Goblin
                    </button>
                  </div>

                  {!dailyPosts || dailyPosts.length === 0 ? (
                    <div
                      style={{
                        background: "rgba(16,21,23,0.04)",
                        border: "2px dashed #94a3b8",
                        borderRadius: "12px",
                        padding: "36px 16px",
                        textAlign: "center",
                        color: "#64748b",
                        margin: "8px 0",
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "#101517" }}>
                        No daily proofs submitted today yet!
                      </p>
                      <p style={{ margin: "6px 0 14px 0", fontSize: "0.82rem" }}>
                        Messages and daily updates are included in the project’s contribution PDF.
                      </p>
                      <button
                        className="rpg-modern-btn is-primary"
                        type="button"
                        onClick={() => {
                          setShowQuestBoardModal(false);
                          setShowGoblinModal(true);
                        }}
                      >
                        + Post Daily Goblin Proof
                      </button>
                    </div>
                  ) : (
                    dailyPosts.map((post: any) => (
                      <div
                        key={post._id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          padding: "12px",
                          background: "#ffffff",
                          border: "2px solid #101517",
                          borderRadius: "10px",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: post.authorFill || "#FFF73F",
                            border: `2px solid ${post.authorOutline || "#101517"}`,
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900,
                            fontSize: "0.88rem",
                            color: "#101517",
                            flexShrink: 0,
                          }}
                        >
                          {(post.authorName || "H").charAt(0).toUpperCase()}
                        </div>

                        {/* Post Body */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 900, fontSize: "0.92rem", color: "#101517" }}>
                                {post.authorName}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  background: post.isValid ? "#dcfce7" : "#fee2e2",
                                  color: post.isValid ? "#15803d" : "#b91c1c",
                                  border: `1px solid ${post.isValid ? "#22c55e" : "#ef4444"}`,
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {post.isValid ? "Goblin Slayed" : "Check-in"}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>
                              {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},{" "}
                              {new Date(post.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>

                          <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#1e293b", lineHeight: "1.45", wordBreak: "break-word" }}>
                            {post.text}
                          </p>

                          {post.imageUrls && post.imageUrls.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                              {post.imageUrls.map((url: string, i: number) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "block" }}
                                >
                                  <img
                                    src={url}
                                    alt={`Proof attachment ${i + 1}`}
                                    style={{
                                      width: "110px",
                                      height: "75px",
                                      objectFit: "cover",
                                      borderRadius: "6px",
                                      border: "1.5px solid #101517",
                                      display: "block",
                                    }}
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Minimal Subtext */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #101517", paddingTop: "8px", flexShrink: 0 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.75 }}>
                Click on any task to view quest details and submit proof.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IN-CANVAS QUEST DETAILS MODAL (Condensed & Informative with Owner Edit Mode)
         ========================================================================= */}
      {selectedQuestTask && (
        <div
          className="rpg-modal-backdrop"
          onClick={() => {
            setSelectedQuestTask(null);
            setEditingTask(null);
          }}
        >
          <div
            className="rpg-modern-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "490px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    background: "#fff73f",
                    color: "#101517",
                    border: "1.5px solid #101517",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    marginBottom: "6px",
                  }}
                >
                  {editingTask ? "Edit Quest (Owner Only)" : "Quest Details"}
                </span>
                {!editingTask && (
                  <h3 className="rpg-modern-title" style={{ fontSize: "1.15rem" }}>
                    {selectedQuestTask.title}
                  </h3>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {!editingTask && workspace?.project?.creatorProfileId === state?.currentProfileId && (
                  <button
                    type="button"
                    onClick={() => handleStartEditTask(selectedQuestTask)}
                    className="rpg-modern-btn is-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.74rem", background: "#fef08a", color: "#854d0e" }}
                    title="Edit this quest (Owner Only)"
                  >
                    <UiIcon name="Pencil" /> Edit Task
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuestTask(null);
                    setEditingTask(null);
                  }}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "2px solid #101517",
                    borderRadius: "8px",
                    width: "28px",
                    height: "28px",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {claimQuestError && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#fee2e2",
                  border: "2px solid #ef4444",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                }}
              >
                {claimQuestError}
              </div>
            )}
            {editTaskError && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#fee2e2",
                  border: "2px solid #ef4444",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                }}
              >
                {editTaskError}
              </div>
            )}

            {editingTask ? (
              /* INLINE OWNER EDIT FORM */
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "3px" }}>
                    Task Title:
                  </label>
                  <input
                    type="text"
                    className="rpg-modern-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task title..."
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "3px" }}>
                    Description & Assignment Rubric:
                  </label>
                  <textarea
                    className="rpg-modern-textarea"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Task instructions and criteria..."
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, marginBottom: "2px" }}>
                      Due Date:
                    </label>
                    <input
                      type="date"
                      className="rpg-modern-input"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, marginBottom: "2px" }}>
                      Boss Damage (HP):
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      className="rpg-modern-input"
                      value={editDamage}
                      onChange={(e) => setEditDamage(parseInt(e.target.value, 10) || 50)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, marginBottom: "2px" }}>
                    Assignee Hero:
                  </label>
                  <select
                    className="rpg-modern-input"
                    value={editIsOpen ? "" : editAssignee}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setEditIsOpen(true);
                        setEditAssignee("");
                      } else {
                        setEditIsOpen(false);
                        setEditAssignee(e.target.value);
                      }
                    }}
                  >
                    <option value=""> Open for Claiming (Unassigned)</option>
                    {workspace?.members?.filter(Boolean).map((m: any) => (
                      <option key={m.profileId} value={m.profileId}>
                         {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className="rpg-modern-btn is-primary"
                    disabled={isSavingEditTask}
                    onClick={handleSaveEditTask}
                    style={{ flex: 1 }}
                  >
                    {isSavingEditTask ? "Saving..." : <>Save Changes <UiIcon name="Check" /></>}
                  </button>
                  <button
                    type="button"
                    className="rpg-modern-btn is-secondary"
                    disabled={isSavingEditTask}
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* REGULAR VIEW MODE */
              <>
                {/* Description */}
                <div
                  className="rpg-meta-box"
                  style={{
                    padding: "12px",
                    fontSize: "0.85rem",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedQuestTask.description || "No description provided for this quest."}
                </div>

                {/* Quest Metadata */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div className="rpg-meta-box">
                    <span className="rpg-meta-label" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase" }}>Due Date</span>
                    <span style={{ fontSize: "0.84rem", fontWeight: 800 }}>{selectedQuestTask.dueDate || "No deadline"}</span>
                  </div>
                  <div className="rpg-meta-box">
                    <span className="rpg-meta-label" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase" }}>Assigned Hero</span>
                    <span style={{ fontSize: "0.84rem", fontWeight: 800, color: selectedQuestTask.isOpen ? "#ef4444" : "inherit" }}>
                      {selectedQuestTask.assigneeName}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                  {selectedQuestTask.isOpen ? (
                    <button
                      className="rpg-modern-btn is-primary"
                      type="button"
                      disabled={isClaimingQuest}
                      onClick={() => handleClaimQuest(selectedQuestTask)}
                    >
                      {isClaimingQuest ? "Claiming Quest..." : "Claim This Quest"}
                    </button>
                  ) : questBoardTab === "mine" ? (
                    (() => {
                      const isInReview = Boolean(
                        selectedQuestTask.status === "review" ||
                        selectedQuestTask.status === "submitted" ||
                        selectedQuestTask.status === "awaiting_creator"
                      );
                      const isCompleted = Boolean(
                        selectedQuestTask.isCompleted ||
                        selectedQuestTask.status === "completed" ||
                        selectedQuestTask.status === "verified"
                      );

                      if (isInReview) {
                        return (
                          <div
                            style={{
                              background: "#fef3c7",
                              border: "2px solid #f59e0b",
                              borderRadius: "8px",
                              padding: "10px 14px",
                              color: "#92400e",
                              fontWeight: 800,
                              fontSize: "0.84rem",
                              textAlign: "center",
                            }}
                          >
                            <UiIcon name="Hourglass" /> In review. Waiting for your teammate’s decision.
                          </div>
                        );
                      }

                      if (isCompleted) {
                        return (
                          <div
                            style={{
                              background: "#dcfce7",
                              border: "2px solid #16a34a",
                              borderRadius: "8px",
                              padding: "10px 14px",
                              color: "#15803d",
                              fontWeight: 800,
                              fontSize: "0.84rem",
                              textAlign: "center",
                            }}
                          >
                            <UiIcon name="CheckCircle2" /> Completed and verified. Boss damage applied.
                          </div>
                        );
                      }

                      return (
                        <button
                          className="rpg-modern-btn is-boss"
                          type="button"
                          onClick={() => {
                            setSelectedTaskId(selectedQuestTask._id);
                            setSelectedQuestTask(null);
                            setShowQuestBoardModal(false);
                            setShowBossModal(true);
                          }}
                        >
                          Submit Proof & Attack Dragon ➜
                        </button>
                      );
                    })()
                  ) : (
                    <div style={{ textAlign: "center", fontSize: "0.78rem", fontWeight: 700, opacity: 0.8, padding: "4px" }}>
                      Currently assigned to {selectedQuestTask.assigneeName} · Status: {selectedQuestTask.status || "active"}
                    </div>
                  )}

                  <button
                    className="rpg-modern-btn is-secondary"
                    type="button"
                    onClick={() => {
                      setSelectedQuestTask(null);
                      setEditingTask(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          IN-CANVAS CREATE TASK MODAL
         ========================================================================= */}
      {showCreateQuestModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowCreateQuestModal(false)}>
          <div className="rpg-modern-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="rpg-modern-title">New Task</h3>
              <button
                type="button"
                onClick={() => setShowCreateQuestModal(false)}
                style={{ background: "#ef4444", color: "#fff", border: "2px solid #101517", borderRadius: "8px", width: "28px", height: "28px", display: "grid", placeItems: "center", cursor: "pointer", fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            {workspace?.project?.creatorProfileId !== state?.currentProfileId ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
                <div style={{ padding: "12px 14px", background: "#fee2e2", border: "2px solid #ef4444", borderRadius: "8px", color: "#b91c1c", fontSize: "0.88rem", fontWeight: 800 }}>
                  Only the room owner can create new tasks for the board.
                </div>
                <button
                  className="rpg-modern-btn is-secondary"
                  type="button"
                  onClick={() => setShowCreateQuestModal(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateQuestSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {createQuestError && (
                  <div style={{ padding: "8px 12px", background: "#fee2e2", border: "2px solid #ef4444", borderRadius: "8px", color: "#b91c1c", fontSize: "0.82rem", fontWeight: 800 }}>
                    {createQuestError}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    className="rpg-modern-input"
                    value={newQuestTitle}
                    onChange={(e) => setNewQuestTitle(e.target.value)}
                    placeholder="e.g., Build navigation header, Fix auth bug..."
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                    Description
                  </label>
                  <textarea
                    className="rpg-modern-textarea"
                    rows={3}
                    value={newQuestDesc}
                    onChange={(e) => setNewQuestDesc(e.target.value)}
                    placeholder="Provide details about what needs to be done..."
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                      Project Phase
                    </label>
                    <select
                      className="rpg-modern-select"
                      value={newQuestPhaseId}
                      onChange={(e) => setNewQuestPhaseId(e.target.value)}
                    >
                      {(workspace?.phases ?? []).map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="rpg-modern-input"
                      value={newQuestDueDate}
                      onChange={(e) => setNewQuestDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                      Assignee (Hero)
                    </label>
                    <select
                      className="rpg-modern-select"
                      value={newQuestAssignee}
                      onChange={(e) => setNewQuestAssignee(e.target.value)}
                    >
                      <option value="">-- Open for Anyone to Claim --</option>
                      {(workspace?.members ?? []).map((m) => (
                        <option key={m.profileId} value={m.profileId}>
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, marginBottom: "4px" }}>
                      Difficulty / Weight (1-5)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="rpg-modern-input"
                      value={newQuestWeight}
                      onChange={(e) => setNewQuestWeight(Number(e.target.value))}
                    />
                  </div>
                </div>

                <button
                  className="rpg-modern-btn is-primary"
                  type="submit"
                  disabled={isCreatingQuest}
                  style={{ marginTop: "6px", boxShadow: "none" }}
                >
                  {isCreatingQuest ? "Creating Task..." : "Create Task"}
                </button>

                <button className="rpg-modern-btn is-secondary" type="button" onClick={() => setShowCreateQuestModal(false)}>
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}





      {optionalMetrics.isVillageDestroyed ? (
        <section className="failure-panel" style={{ background: "#fef2f2", border: "2px solid #ef4444", padding: "1.5rem", borderRadius: "12px", margin: "1rem 0" }}>
          <p className="card-eyebrow" style={{ color: "#dc2626" }}>Project Failed</p>
          <h3 style={{ color: "#991b1b", margin: "0.2rem 0 0.5rem" }}>The Village Has Been Destroyed!</h3>
          <p style={{ color: "#7f1d1d", margin: 0 }}>Village HP dropped below the 50% failure threshold from missed daily goblin defenses and deadline penalties.</p>
        </section>
      ) : null}

      {defeated ? (
        <section className="victory-panel">
          <p className="card-eyebrow">Project complete</p>
          <h3>The dragon has been repelled!</h3>
          <p>Every required task has been verified. The village is safe. Export the report or archive the project from project settings.</p>
        </section>
      ) : null}

      {/* =========================================================================
          LAYOUT ADMIN VECTOR & GAMEPLAY TESTING PANEL (RESIZABLE & TABBED)
         ========================================================================= */}
      {showDragonEditor && (
        <div
          className="rpg-admin-panel"
          style={{
            left: `${panelPos.x}px`,
            top: `${panelPos.y}px`,
            width: `${adminPanelWidth}px`,
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            zIndex: 9000,
            background: "#0b1329",
            borderRadius: "10px",
            border: "1px solid #334155",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with drag handle and width resizer */}
          <div
            className="rpg-admin-header"
            onMouseDown={handlePanelDragStart}
            style={{ cursor: "move", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#f8fafc" }}>Layout Admin</span>
              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>({adminPanelWidth}px)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.62rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                Width:
                <input
                  type="range"
                  min="360"
                  max="860"
                  step="20"
                  style={{ width: "70px", accentColor: "#38bdf8" }}
                  value={adminPanelWidth}
                  onChange={(e) => setAdminPanelWidth(parseInt(e.target.value) || 540)}
                />
              </label>
              <button className="rpg-admin-close-btn" type="button" onClick={() => setShowDragonEditor(false)}>×</button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div style={{ display: "flex", gap: "4px", background: "#0f172a", padding: "6px 8px", borderBottom: "1px solid #334155" }}>
            <button
              type="button"
              onClick={() => setAdminTab("cheats")}
              style={{
                flex: 1,
                padding: "6px 4px",
                fontSize: "0.68rem",
                fontWeight: "bold",
                background: adminTab === "cheats" ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              Testing Cheats
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("layers")}
              style={{
                flex: 1,
                padding: "6px 4px",
                fontSize: "0.68rem",
                fontWeight: "bold",
                background: adminTab === "layers" ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              Canvas Layers
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("dragon")}
              style={{
                flex: 1,
                padding: "6px 4px",
                fontSize: "0.68rem",
                fontWeight: "bold",
                background: adminTab === "dragon" ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              Dragon Shapes
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("sizing")}
              style={{
                flex: 1,
                padding: "6px 4px",
                fontSize: "0.68rem",
                fontWeight: "bold",
                background: adminTab === "sizing" ? "#2563eb" : "#1e293b",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              UI Sizing
            </button>
          </div>
          
          <div className="rpg-admin-body" style={{ flex: 1, overflowY: "auto", padding: "10px", maxHeight: "calc(88vh - 120px)" }}>
            {/* 1. TESTING CHEATS TAB */}
            {adminTab === "cheats" && (
              <div style={{ display: "grid", gap: "10px" }}>
                {/* Attack VFX trigger */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                  <h5 style={{ margin: "0 0 8px 0", fontSize: "0.72rem", color: "#38bdf8", textTransform: "uppercase" }}>Combat Attack Effects (Debug All Monsters & Boss)</h5>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <button type="button" style={{ padding: "6px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestActiveSpell("lightning")}>
                      Lightning Spell
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#ea580c", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestActiveSpell("fire")}>
                      Fire Spell
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestActiveSpell("ice")}>
                      Ice Spell
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestActiveSpell("all")}>
                      <UiIcon name="Sparkles" /> All spells
                    </button>
                    <button type="button" style={{ gridColumn: "1 / span 2", padding: "6px", background: "#475569", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestActiveSpell(null)}>
                      Clear Attack FX
                    </button>
                  </div>
                </div>

                {/* Goblin Slaying */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                  <h5 style={{ margin: "0 0 8px 0", fontSize: "0.72rem", color: "#4ade80", textTransform: "uppercase" }}>Goblins Simulation</h5>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <button
                      type="button"
                      style={{ padding: "6px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => {
                        const map: Record<string, boolean> = {};
                        state.members.forEach(m => { map[m.profileId] = true; });
                        setTestDeadGoblins(map);
                      }}
                    >
                      Slay All Goblins
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#475569", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestDeadGoblins({})}>
                      Revive All Goblins
                    </button>
                  </div>
                </div>

                {/* Village Health */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                  <h5 style={{ margin: "0 0 8px 0", fontSize: "0.72rem", color: "#facc15", textTransform: "uppercase" }}>Village HP Override</h5>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                    <button type="button" style={{ padding: "6px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestVillageHpOverride(100)}>
                      100%
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#ca8a04", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestVillageHpOverride(50)}>
                      50%
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#ea580c", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestVillageHpOverride(20)}>
                      20%
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestVillageHpOverride(0)}>
                      0%
                    </button>
                  </div>
                </div>

                {/* Dragon Boss HP */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                  <h5 style={{ margin: "0 0 8px 0", fontSize: "0.72rem", color: "#f87171", textTransform: "uppercase" }}>Dragon Boss HP Override</h5>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                    <button type="button" style={{ padding: "6px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestDragonHpOverride(0)}>
                      Slay Boss (0 HP)
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#f97316", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestDragonHpOverride(Math.round(state.maximumHp * 0.5))}>
                      50% HP
                    </button>
                    <button type="button" style={{ padding: "6px", background: "#475569", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }} onClick={() => setTestDragonHpOverride(null)}>
                      Reset Full
                    </button>
                  </div>
                </div>

                {/* Task Mechanics & Two-Way Damage Simulation */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155", display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h5 style={{ margin: 0, fontSize: "0.72rem", color: "#38bdf8", textTransform: "uppercase" }}>
                      1. Boss HP = Tasks &amp; 2-Way Damage
                    </h5>
                    <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                      Boss: {rawRemainingHp}/{computedMaxBossHp} HP | Village: {effectiveVillageHp}% ({baseVillageCurrentHp}/{villageMaxHp} HP)
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <button
                      type="button"
                      style={{ padding: "6px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => {
                        setTestExtraTasksCount(p => p + 1);
                        gameAudio.playTing();
                      }}
                    >
                      +1 Task Created (+50 Boss HP)
                    </button>
                    <button
                      type="button"
                      style={{ padding: "6px", background: "#334155", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => setTestExtraTasksCount(p => Math.max(-5, p - 1))}
                    >
                      -1 Task Removed (-50 Boss HP)
                    </button>

                    <button
                      type="button"
                      style={{ padding: "6px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => {
                        setTestSimulatedOnTimeDamage(p => p + 50);
                        setLocalAttack({
                          id: `sim_ontime_${Date.now()}`,
                          attackerName: "Adventurer",
                          damage: 50,
                          spellType: "lightning",
                          target: "dragon",
                          targetX: 750,
                          targetY: 175,
                        });
                        gameAudio.playTing();
                      }}
                    >
                      Finish On-Time (-50 Boss HP)
                    </button>

                    <button
                      type="button"
                      style={{ padding: "6px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => {
                        setTestSimulatedMissedDamage(p => p + 50);
                        setShowGoblinAttackAlert(true);
                      }}
                    >
                      Miss Deadline (Deflect to Village!)
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px", borderTop: "1px solid #1e293b", paddingTop: "6px" }}>
                    <button
                      type="button"
                      style={{ flex: 1, padding: "5px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => setTestExtraPlayerCount(p => p + 1)}
                    >
                      +1 Player Joined (+10 Village Max HP)
                    </button>
                    <button
                      type="button"
                      style={{ padding: "5px 8px", background: "#475569", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => {
                        setTestExtraTasksCount(0);
                        setTestSimulatedOnTimeDamage(0);
                        setTestSimulatedMissedDamage(0);
                        setTestExtraPlayerCount(0);
                      }}
                    >
                      Reset Mechanics
                    </button>
                  </div>
                </div>

                {/* Deadline Simulation */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                  <h5 style={{ margin: "0 0 8px 0", fontSize: "0.72rem", color: "#a855f7", textTransform: "uppercase" }}>Deadline &amp; End Game Screen</h5>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <button
                      type="button"
                      style={{ padding: "6px", background: testOverdueOverride ? "#9333ea" : "#6b21a8", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => setTestOverdueOverride((prev) => !prev)}
                    >
                      {testOverdueOverride ? "Return to Battle" : "Trigger End Game"}
                    </button>
                    <button
                      type="button"
                      style={{ padding: "6px", background: "#475569", color: "#fff", border: "none", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => {
                        setTestVillageHpOverride(null);
                        setTestDragonHpOverride(null);
                        setTestDeadGoblins({});
                        setTestActiveSpell(null);
                        setTestOverdueOverride(null);
                        setTestExtraTasksCount(0);
                        setTestSimulatedOnTimeDamage(0);
                        setTestSimulatedMissedDamage(0);
                        setTestExtraPlayerCount(0);
                      }}
                    >
                      Reset All Cheats
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CANVAS LAYERS TAB */}
            {adminTab === "layers" && (
              <div style={{ display: "grid", gap: "8px" }}>
                <p style={{ margin: "0 0 6px 0", fontSize: "0.68rem", color: "#94a3b8" }}>
                  Adjust position, scaling, and visibility for every layer on the game canvas:
                </p>
                {[
                  { key: "sky", label: "Layer 0-2: Sky & Clouds" },
                  { key: "terrain", label: "Layer 3-4: Hills & Grass Meadow" },
                  { key: "village", label: "Layer 5: Village & Palisade" },
                  { key: "goblins", label: "Layer 6: Goblins Horde" },
                  { key: "players", label: "Layer 7: Party Mages" },
                  { key: "dragon", label: "Layer 8: Dragon Boss" },
                  { key: "fx", label: "Layer 9: Combat FX & Spells" },
                ].map(({ key, label }) => {
                  const transform = layerTransforms[key] || { x: 0, y: 0, scale: 1, visible: true };
                  return (
                    <div key={key} style={{ background: "#0f172a", padding: "8px 10px", borderRadius: "6px", border: "1px solid #334155", display: "grid", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "#f1f5f9" }}>{label}</span>
                        <label style={{ fontSize: "0.65rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={transform.visible !== false}
                            onChange={(e) => setLayerTransforms(prev => ({ ...prev, [key]: { ...prev[key], visible: e.target.checked } }))}
                          />
                          Visible
                        </label>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", alignItems: "center" }}>
                        <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                          X:
                          <input
                            type="number"
                            style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }}
                            value={transform.x}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setLayerTransforms(prev => ({ ...prev, [key]: { ...prev[key], x: val } }));
                            }}
                          />
                        </label>
                        <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                          Y:
                          <input
                            type="number"
                            style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }}
                            value={transform.y}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setLayerTransforms(prev => ({ ...prev, [key]: { ...prev[key], y: val } }));
                            }}
                          />
                        </label>
                        <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                          Scale ({transform.scale.toFixed(2)}x):
                          <input
                            type="range"
                            min="0.2"
                            max="3"
                            step="0.05"
                            value={transform.scale}
                            style={{ accentColor: "#38bdf8" }}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              setLayerTransforms(prev => ({ ...prev, [key]: { ...prev[key], scale: val } }));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. DRAGON SHAPES VECTOR TAB */}
            {adminTab === "dragon" && (
              <div style={{ display: "grid", gap: "8px" }}>
                {/* Toggle Animation & History controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", background: "#0f172a", padding: "8px", borderRadius: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      id="toggle-anim"
                      type="checkbox"
                      checked={animationsEnabled}
                      onChange={(e) => setAnimationsEnabled(e.target.checked)}
                    />
                    <label htmlFor="toggle-anim" style={{ fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer", color: "#38bdf8" }}>
                      Flapping
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="rpg-dpad-btn"
                      style={{ padding: "2px 8px", fontSize: "0.7rem", opacity: historyIndex > 0 ? 1 : 0.4, cursor: historyIndex > 0 ? "pointer" : "not-allowed" }}
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      title="Undo last change"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="rpg-dpad-btn"
                      style={{ padding: "2px 8px", fontSize: "0.7rem", opacity: historyIndex < history.length - 1 ? 1 : 0.4, cursor: historyIndex < history.length - 1 ? "pointer" : "not-allowed" }}
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      title="Redo next change"
                    >
                      Redo
                    </button>
                  </div>
                </div>

                {/* Custom Shape Spawner */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                  <h5 style={{ margin: "0 0 6px 0", fontSize: "0.72rem", textTransform: "uppercase", color: "#94a3b8" }}>Spawn Vector Shape</h5>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                    <select
                      value={spawnerType}
                      onChange={(e: any) => setSpawnerType(e.target.value)}
                      style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "4px", fontSize: "0.7rem", flex: 1 }}
                    >
                      <option value="circle">Circle</option>
                      <option value="ellipse">Ellipse</option>
                      <option value="rect">Rectangle</option>
                      <option value="polygon">Polygon</option>
                      <option value="path">Path</option>
                    </select>
                    <input
                      type="color"
                      value={spawnerColor}
                      onChange={(e) => setSpawnerColor(e.target.value)}
                      style={{ width: "32px", height: "24px", border: "none", background: "transparent", cursor: "pointer" }}
                    />
                  </div>
                  <button
                    type="button"
                    className="rpg-admin-action-btn"
                    style={{ background: "#16a34a", padding: "6px", fontSize: "0.7rem" }}
                    onClick={handleAddCustomShape}
                  >
                    Spawn Shape
                  </button>
                </div>

                <p style={{ fontSize: "0.68rem", margin: "0 0 6px 0", color: "#94a3b8" }}>
                  Click/drag shapes directly on screen (hold Shift), or drag blue vertex points to edit shape nodes!
                </p>

                {/* Layer Stack */}
                <div className="rpg-layers-stack" style={{ maxHeight: "260px", overflowY: "auto" }}>
                  {(() => {
                    const activeLayers = [...layerOrder]
                      .reverse()
                      .filter((id) => !deletedShapes[id]);

                    return activeLayers.map((layerId) => {
                      const isSelected = selectedDragonPart === layerId;
                      const offset = dragonOffsets[layerId] || { x: 0, y: 0, rotate: 0, scale: 1 };
                      const friendlyName = SHAPE_LABELS[layerId] || customShapes.find(s => s.id === layerId)?.name || `Custom Shape (${layerId.slice(-4)})`;
                      
                      return (
                        <div
                          key={layerId}
                          id={`layer-row-${layerId}`}
                          className={`rpg-layer-row ${isSelected ? "is-selected" : ""}`}
                          onClick={() => setSelectedDragonPart(layerId)}
                        >
                          <div className="rpg-layer-info">
                            <span className="rpg-layer-name">{friendlyName}</span>
                            <span className="rpg-layer-coords">X:{offset.x} Y:{offset.y} R:{offset.rotate}° S:{(offset.scale ?? 1).toFixed(2)}x</span>
                          </div>

                          {isSelected && (
                            <div className="rpg-layer-controls" onClick={(e) => e.stopPropagation()}>
                              {/* Position Coordinates */}
                              <div className="rpg-coords-inputs">
                                <label>
                                  X:
                                  <input
                                    type="number"
                                    value={offset.x}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setDragonOffsets((prev) => ({
                                        ...prev,
                                        [layerId]: { ...prev[layerId], x: val }
                                      }));
                                    }}
                                  />
                                </label>
                                <label>
                                  Y:
                                  <input
                                    type="number"
                                    value={offset.y}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setDragonOffsets((prev) => ({
                                        ...prev,
                                        [layerId]: { ...prev[layerId], y: val }
                                      }));
                                    }}
                                  />
                                </label>
                              </div>

                              {/* Rotation Input Row */}
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "3px", flex: 1 }}>
                                  Rot:
                                  <input
                                    type="number"
                                    style={{ width: "100%", padding: "2px 4px", background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", fontSize: "0.7rem" }}
                                    value={offset.rotate ?? 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setDragonOffsets((prev) => ({
                                        ...prev,
                                        [layerId]: { ...prev[layerId], rotate: val }
                                      }));
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="rpg-dpad-btn"
                                  style={{ width: "24px", padding: "2px 0" }}
                                  onClick={() => {
                                    const nextVal = ((offset.rotate ?? 0) - 5) % 360;
                                    const nextOffsets = {
                                      ...dragonOffsets,
                                      [layerId]: { ...offset, rotate: nextVal }
                                    };
                                    setDragonOffsets(nextOffsets);
                                    pushHistoryState(nextOffsets, dragonFills, deletedShapes, customShapes, dragonGeometries, layerOrder);
                                  }}
                                  title="Rotate CCW 5°"
                                >
                                  ↺
                                </button>
                                <button
                                  type="button"
                                  className="rpg-dpad-btn"
                                  style={{ width: "24px", padding: "2px 0" }}
                                  onClick={() => {
                                    const nextVal = ((offset.rotate ?? 0) + 5) % 360;
                                    const nextOffsets = {
                                      ...dragonOffsets,
                                      [layerId]: { ...offset, rotate: nextVal }
                                    };
                                    setDragonOffsets(nextOffsets);
                                    pushHistoryState(nextOffsets, dragonFills, deletedShapes, customShapes, dragonGeometries, layerOrder);
                                  }}
                                  title="Rotate CW 5°"
                                >
                                  ↻
                                </button>
                              </div>

                              {/* Scale Controls */}
                              <div style={{ display: "grid", gap: "2px", marginTop: "8px" }}>
                                <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                                  <span>Scale:</span>
                                  <span>{(offset.scale ?? 1).toFixed(2)}x</span>
                                </label>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <input
                                    type="range"
                                    min="0.2"
                                    max="3.0"
                                    step="0.05"
                                    style={{ flex: 1, accentColor: "#38bdf8" }}
                                    value={offset.scale ?? 1}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      setDragonOffsets((prev) => ({
                                        ...prev,
                                        [layerId]: { ...prev[layerId], scale: val }
                                      }));
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Layer Depth Reordering */}
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
                                <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Order:</span>
                                <button
                                  type="button"
                                  className="rpg-dpad-btn"
                                  style={{ padding: "2px 6px", fontSize: "0.65rem" }}
                                  onClick={() => handleMoveLayerUp(layerId)}
                                  title="Bring Forward"
                                >
                                  ▲ Up
                                </button>
                                <button
                                  type="button"
                                  className="rpg-dpad-btn"
                                  style={{ padding: "2px 6px", fontSize: "0.65rem" }}
                                  onClick={() => handleMoveLayerDown(layerId)}
                                  title="Send Backward"
                                >
                                  ▼ Down
                                </button>
                                <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{layerOrder.indexOf(layerId) + 1} / {layerOrder.length}</span>
                              </div>

                              {/* Color Fill Selector */}
                              <div style={{ marginTop: "8px" }}>
                                <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                                  Shape Fill Color:
                                  <input
                                    type="color"
                                    style={{ width: "100%", height: "24px", padding: "0", border: "none", background: "transparent", cursor: "pointer" }}
                                    value={dragonFills[layerId] || (layerId.startsWith("custom_") ? (customShapes.find(s => s.id === layerId)?.fill || "#b91c1c") : (DRAGON_ORIGINAL_SHAPES.find(s => s.id === layerId)?.defaultFill || "#7f1d1d"))}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (layerId.startsWith("custom_")) {
                                        setCustomShapes((prev) => prev.map((s) => s.id === layerId ? { ...s, fill: val } : s));
                                      } else {
                                        setDragonFills((prev) => ({
                                          ...prev,
                                          [layerId]: val,
                                        }));
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              {/* Duplicate Element Action */}
                              <button
                                type="button"
                                className="rpg-admin-action-btn"
                                style={{ background: "#4f46e5", padding: "4px", fontSize: "0.65rem", marginTop: "8px", width: "100%" }}
                                onClick={() => handleDuplicateShape(layerId)}
                              >
                                Duplicate Object
                              </button>

                              {/* Delete Element Action */}
                              <button
                                type="button"
                                className="rpg-admin-action-btn reset"
                                style={{ background: "#b91c1c", padding: "4px", fontSize: "0.65rem", marginTop: "8px", width: "100%" }}
                                onClick={() => {
                                  let nextCustoms = customShapes;
                                  let nextOrder = layerOrder;
                                  let nextDeleted = deletedShapes;

                                  if (layerId.startsWith("custom_")) {
                                    nextCustoms = customShapes.filter((s) => s.id !== layerId);
                                    nextOrder = layerOrder.filter((id) => id !== layerId);
                                    setCustomShapes(nextCustoms);
                                    setLayerOrder(nextOrder);
                                  } else {
                                    nextDeleted = {
                                      ...deletedShapes,
                                      [layerId]: true,
                                    };
                                    setDeletedShapes(nextDeleted);
                                  }
                                  setSelectedDragonPart(null);
                                  pushHistoryState(dragonOffsets, dragonFills, nextDeleted, nextCustoms, dragonGeometries, nextOrder);
                                }}
                              >
                                Delete Object
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* 4. UI SIZING TAB */}
            {adminTab === "sizing" && (
              <div style={{ display: "grid", gap: "10px" }}>
                {/* Dragon Boss HP Bar */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155", display: "grid", gap: "6px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "bold", color: "#f87171" }}>Dragon Boss HP Bar</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Offset X (px):
                      <input type="number" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={dragonHpBarPos.x} onChange={(e) => setDragonHpBarPos(p => ({ ...p, x: parseInt(e.target.value) || 0 }))} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Offset Y (px):
                      <input type="number" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={dragonHpBarPos.y} onChange={(e) => setDragonHpBarPos(p => ({ ...p, y: parseInt(e.target.value) || 0 }))} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Width (px):
                      <input type="number" min="80" max="400" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={dragonHpBarWidth} onChange={(e) => setDragonHpBarWidth(parseInt(e.target.value) || 180)} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Height (px):
                      <input type="number" min="6" max="30" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={dragonHpBarHeight} onChange={(e) => setDragonHpBarHeight(parseInt(e.target.value) || 14)} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px", gridColumn: "span 2" }}>
                      <span>Scale: {dragonHpBarScale.toFixed(2)}x</span>
                      <input type="range" min="0.5" max="2.5" step="0.05" style={{ accentColor: "#f87171" }} value={dragonHpBarScale} onChange={(e) => setDragonHpBarScale(parseFloat(e.target.value) || 1)} />
                    </label>
                  </div>
                </div>

                {/* Village HP Bar */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155", display: "grid", gap: "6px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "bold", color: "#86efac" }}>Village HP Bar</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Offset X (px):
                      <input type="number" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={villageHpBarPos.x} onChange={(e) => setVillageHpBarPos(p => ({ ...p, x: parseInt(e.target.value) || 0 }))} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Offset Y (px):
                      <input type="number" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={villageHpBarPos.y} onChange={(e) => setVillageHpBarPos(p => ({ ...p, y: parseInt(e.target.value) || 0 }))} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Width (px):
                      <input type="number" min="80" max="350" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={villageHpBarWidth} onChange={(e) => setVillageHpBarWidth(parseInt(e.target.value) || 140)} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Height (px):
                      <input type="number" min="6" max="30" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={villageHpBarHeight} onChange={(e) => setVillageHpBarHeight(parseInt(e.target.value) || 12)} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px", gridColumn: "span 2" }}>
                      <span>Scale: {villageHpBarScale.toFixed(2)}x</span>
                      <input type="range" min="0.5" max="2.5" step="0.05" style={{ accentColor: "#86efac" }} value={villageHpBarScale} onChange={(e) => setVillageHpBarScale(parseFloat(e.target.value) || 1)} />
                    </label>
                  </div>
                </div>

                {/* Goblin Attack & Ghost Testing Cheats */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155", display: "grid", gap: "6px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "bold", color: "#67e8f9" }}>Goblin Attack & Ghost Testing (Cosmetic Cheats)</div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                    Test elemental strikes on specific goblins or toggle ghost states:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(state?.members || []).map((m, idx) => {
                      const isGhost = (testDeadGoblins[m.profileId] ?? false) || m.hasSubmittedToday;
                      return (
                        <div key={m.profileId} style={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "6px", padding: "6px", display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 45%" }}>
                          <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#fff" }}>
                            #{idx + 1} {m.displayName} ({isGhost ? <>Ghost <UiIcon name="Ghost" /></> : <>Active <UiIcon name="Swords" /></>})
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              type="button"
                              style={{ padding: "2px 6px", fontSize: "0.62rem", borderRadius: "4px", background: "#38bdf8", color: "#0f172a", border: "none", fontWeight: 800, cursor: "pointer" }}
                              onClick={() => {
                                setTestGoblinTargetIndex(idx);
                                setTestActiveSpell("lightning");
                                setTestDeadGoblins(prev => ({ ...prev, [m.profileId]: true }));
                                setTimeout(() => {
                                  setTestActiveSpell(null);
                                  setTestGoblinTargetIndex(null);
                                }, 3000);
                              }}
                            >
                              <UiIcon name="Zap" /> Strike
                            </button>
                            <button
                              type="button"
                              style={{ padding: "2px 6px", fontSize: "0.62rem", borderRadius: "4px", background: "#f97316", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }}
                              onClick={() => {
                                setTestGoblinTargetIndex(idx);
                                setTestActiveSpell("fire");
                                setTestDeadGoblins(prev => ({ ...prev, [m.profileId]: true }));
                                setTimeout(() => {
                                  setTestActiveSpell(null);
                                  setTestGoblinTargetIndex(null);
                                }, 3000);
                              }}
                            >
                              <UiIcon name="Flame" /> Fire
                            </button>
                            <button
                              type="button"
                              style={{ padding: "2px 6px", fontSize: "0.62rem", borderRadius: "4px", background: "#a855f7", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }}
                              onClick={() => {
                                setTestDeadGoblins(prev => ({ ...prev, [m.profileId]: !isGhost }));
                              }}
                            >
                              <UiIcon name="Ghost" /> {isGhost ? "Revive" : "Slay"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deadline Progress Bar */}
                <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155", display: "grid", gap: "6px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "bold", color: "#facc15" }}>Deadline Progress Bar</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Offset X (px):
                      <input type="number" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={pvzBarOffset.x} onChange={(e) => setPvzBarOffset(p => ({ ...p, x: parseInt(e.target.value) || 0 }))} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Offset Y (px):
                      <input type="number" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={pvzBarOffset.y} onChange={(e) => setPvzBarOffset(p => ({ ...p, y: parseInt(e.target.value) || 0 }))} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Width (px):
                      <input type="number" min="200" max="600" style={{ background: "#1e293b", color: "#fff", border: "1px solid #475569", borderRadius: "3px", padding: "2px 4px", fontSize: "0.65rem" }} value={pvzBarOffset.width} onChange={(e) => setPvzBarOffset(p => ({ ...p, width: parseInt(e.target.value) || 380 }))} />
                    </label>
                    <label style={{ fontSize: "0.65rem", color: "#94a3b8", display: "grid", gap: "2px" }}>
                      Scale ({pvzBarOffset.scale.toFixed(2)}x):
                      <input type="range" min="0.5" max="2.0" step="0.05" style={{ accentColor: "#facc15" }} value={pvzBarOffset.scale} onChange={(e) => setPvzBarOffset(p => ({ ...p, scale: parseFloat(e.target.value) || 1 }))} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="rpg-admin-actions" style={{ padding: "8px 12px", background: "#0f172a", borderTop: "1px solid #334155" }}>
            <button
              type="button"
              className="rpg-admin-action-btn"
              onClick={() => {
                const exportData = {
                  dragonOffsets,
                  dragonFills,
                  deletedShapes,
                  customShapes,
                  dragonGeometries,
                  layerOrder,
                  dragonHpBarPos,
                  dragonHpBarWidth,
                  dragonHpBarHeight,
                  dragonHpBarScale,
                  villageHpBarPos,
                  villageHpBarWidth,
                  villageHpBarHeight,
                  villageHpBarScale,
                  layerTransforms,
                  pvzBarOffset,
                };
                const codeStr = JSON.stringify(exportData, null, 2);
                navigator.clipboard.writeText(codeStr);
                alert("Copied full layout, layers, geometries, fills, HP bar pos & custom shapes config to clipboard!");
              }}
            >
              Copy Layout Config
            </button>
            <button
              type="button"
              className="rpg-admin-action-btn reset"
              onClick={() => {
                if (confirm("Reset all customizations, colors, and coordinates to default?")) {
                  setDragonOffsets(DEFAULT_DRAGON_OFFSETS);
                  setDragonFills(DEFAULT_DRAGON_FILLS);
                  setDeletedShapes(DEFAULT_DELETED_SHAPES);
                  setCustomShapes(DEFAULT_CUSTOM_SHAPES);
                  setDragonGeometries(DEFAULT_DRAGON_GEOMETRIES);
                  setLayerOrder(DEFAULT_LAYER_ORDER);
                  setDragonHpBarPos({ x: 0, y: 0 });
                  setDragonHpBarWidth(180);
                  setDragonHpBarHeight(14);
                  setDragonHpBarScale(1);
                  setVillageHpBarPos({ x: 0, y: 0 });
                  setVillageHpBarWidth(140);
                  setVillageHpBarHeight(12);
                  setVillageHpBarScale(1);
                  setLayerTransforms({
                    sky: { x: 0, y: 0, scale: 1, visible: true },
                    terrain: { x: 0, y: 0, scale: 1, visible: true },
                    village: { x: 0, y: 0, scale: 1, visible: true },
                    goblins: { x: 0, y: 0, scale: 1, visible: true },
                    players: { x: 0, y: 0, scale: 1, visible: true },
                    dragon: { x: 0, y: 0, scale: 1, visible: true },
                    fx: { x: 0, y: 0, scale: 1, visible: true },
                  });
                  setPvzBarOffset({ x: 0, y: 0, width: 380, scale: 1, visible: true });
                  setSelectedDragonPart(null);
                  pushHistoryState(
                    DEFAULT_DRAGON_OFFSETS,
                    DEFAULT_DRAGON_FILLS,
                    DEFAULT_DELETED_SHAPES,
                    DEFAULT_CUSTOM_SHAPES,
                    DEFAULT_DRAGON_GEOMETRIES,
                    DEFAULT_LAYER_ORDER
                  );
                }
              }}
            >
              Reset Config
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN PASSWORD GATE MODAL ("taolamadmin")
         ========================================================================= */}
      {showAdminPasswordModal && (
        <div className="rpg-modal-overlay" style={{ zIndex: 99999 }} onClick={() => setShowAdminPasswordModal(false)}>
          <div className="rpg-parchment-modal" style={{ maxWidth: "380px" }} onClick={(e) => e.stopPropagation()}>
            <div className="rpg-modal-header">
              <h2>Admin Password Access</h2>
              <button type="button" className="rpg-btn-close" onClick={() => setShowAdminPasswordModal(false)}>✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (adminPasswordInput.trim() === "taolamadmin") {
                  sessionStorage.setItem("taolamadmin_auth", "true");
                  setAdminAuthenticated(true);
                  setShowAdminPasswordModal(false);
                  setShowDragonEditor(true);
                  if (!selectedDragonPart) {
                    setSelectedDragonPart("headNeck");
                  }
                  setAdminPasswordError("");
                  setAdminPasswordInput("");
                } else {
                  setAdminPasswordError("Incorrect password. Access denied.");
                }
              }}
              className="rpg-modal-body"
            >
              <p style={{ margin: "0 0 12px 0", fontSize: "0.88rem", color: "#334155" }}>
                Enter the developer password to access Layout Admin vector tools and testing cheats:
              </p>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
                  setAdminPasswordError("");
                }}
                placeholder="Enter password..."
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "2px solid #334155", background: "#ffffff", color: "#0f172a", fontSize: "0.95rem", fontWeight: "bold" }}
                autoFocus
              />
              {adminPasswordError && (
                <p style={{ color: "#ef4444", fontSize: "0.82rem", margin: "6px 0 0 0", fontWeight: "bold" }}>
                  {adminPasswordError}
                </p>
              )}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowAdminPasswordModal(false)} style={{ padding: "8px 14px", borderRadius: "6px", background: "#64748b", color: "#fff", border: "none", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", background: "#2563eb", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" }}>
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* =========================================================================
          SOUND SETTINGS & WEB PUSH NOTIFICATION MODAL
         ========================================================================= */}
      {/* =========================================================================
          SOUND SETTINGS MODAL (3 Clean Sliders: Master SFX, Spell SFX, BGM)
         ========================================================================= */}
      {showSoundSettingsModal && (
        <div className="rpg-modal-backdrop" onClick={() => setShowSoundSettingsModal(false)}>
          <div className="rpg-modern-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 className="rpg-modern-title" style={{ fontSize: "1.25rem", margin: 0 }}>Sound Settings</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>Master, elemental spell, and background audio</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSoundSettingsModal(false)}
                style={{ background: "#ef4444", color: "#fff", border: "2px solid #101517", borderRadius: "8px", width: "28px", height: "28px", display: "grid", placeItems: "center", cursor: "pointer", fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {/* 1. Master Sound Effects Slider (Default 80%, On) */}
              <div className="rpg-panel-card" style={{ display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 900 }}>Master Sound Effects</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>Overall volume for all sound effects</p>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0284c7" }}>
                    {isAudioMuted ? "Muted (0%)" : `${audioVolume}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isAudioMuted ? 0 : audioVolume}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setAudioVolume(val);
                    gameAudio.setVolume(val / 100);
                    if (val > 0 && isAudioMuted) {
                      setIsAudioMuted(false);
                      gameAudio.setMuted(false);
                    }
                  }}
                  style={{ width: "100%", accentColor: "#0284c7" }}
                />
              </div>

              {/* 2. Spell Sound Effects Slider (Default 80%, On) */}
              <div className="rpg-panel-card" style={{ display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 900 }}>Spell Sound Effects</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>Elemental projectile impact sounds (Fire, Ice, Lightning, Arcane)</p>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0284c7" }}>
                    {spellVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={spellVolume}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setSpellVolume(val);
                    gameAudio.setSpellVolume(val / 100);
                  }}
                  style={{ width: "100%", accentColor: "#0284c7" }}
                />
              </div>

              {/* 3. Background Music Slider (Default 0%, Muted - user slides up to turn on) */}
              <div className="rpg-panel-card" style={{ display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 900 }}>Background Music</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.74rem", color: "#64748b" }}>Medieval lute, brass fanfare & marching tempo (Slide up to play)</p>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: bgmVolume > 0 ? "#16a34a" : "#64748b" }}>
                    {bgmVolume > 0 ? `${bgmVolume}%` : "Off (0%)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgmVolume}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setBgmVolume(val);
                    gameAudio.setBgmVolume(val / 100);
                    setIsLofiBgmPlaying(val > 0);
                  }}
                  style={{ width: "100%", accentColor: "#16a34a" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                className="rpg-modern-btn is-primary"
                type="button"
                onClick={() => setShowSoundSettingsModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
