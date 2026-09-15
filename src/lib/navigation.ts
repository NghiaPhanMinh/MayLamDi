export type MainSection =
  | "home"
  | "projects"
  | "profile"
  | "subscription"
  | "resources";

export type ProjectsView = "index" | "create" | "join" | "room" | "personal-tasks" | "resources";

export const MAIN_NAV_ITEMS: { id: MainSection; label: string; icon: "Home" | "UserRound" | "FolderKanban"; path: string }[] = [
  { id: "home", label: "Home", icon: "Home", path: "/home" },
  { id: "profile", label: "Profile", icon: "UserRound", path: "/profile" },
  { id: "projects", label: "Projects", icon: "FolderKanban", path: "/projects" },
];

export function getPathForSection(section: MainSection, view?: ProjectsView, roomId?: string): string {
  if (section === "home") return "/home";
  if (section === "profile") return "/profile";
  if (section === "subscription") return "/subscription";
  if (section === "resources" || view === "resources") return "/resources";
  if (section === "projects") {
    if (view === "create") return "/projects/create";
    if (view === "join") return "/projects/join";
    if (view === "personal-tasks") return "/projects/my-tasks";
    if (view === "room" && roomId) return `/rooms/${roomId}`;
    return "/projects";
  }
  return "/";
}
