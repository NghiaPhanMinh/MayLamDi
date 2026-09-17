import { UiIcon } from "../common/UiIcon";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { BookOpen, CheckSquare, FolderKanban, Home, ListChecks, Menu, UserRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { BrandLogo } from "../brand/BrandLogo";
import { TeamSystem } from "../teams/TeamSystem";
import { ThemeToggle } from "../theme/ThemeToggle";
import { ProfileCenter } from "../profile/ProfileCenter";
import { SubscriptionNavItem } from "../subscription/SubscriptionNavItem";
import { SubscriptionPage } from "../subscription/SubscriptionPage";
import { MAIN_NAV_ITEMS, getPathForSection, type MainSection, type ProjectsView } from "../../lib/navigation";
import { getGroupColor } from "../../lib/groupColors";
import { normalizeSubscriptionPlan } from "../../lib/subscription";

import { ActivityCenter } from "../teams/ActivityCenter";
import { OnboardingTutorial, type TutorialStep } from "../onboarding/OnboardingTutorial";

const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: "nav-home",
    title: "Home",
    description: "Track your next immediate actions, upcoming deadlines, and active project rooms.",
    placement: "right",
  },
  {
    target: "nav-profile",
    title: "Profile",
    description: "Update your skills and weekly capacity so the AI can allocate tasks accurately.",
    placement: "right",
  },
  {
    target: "nav-projects",
    title: "Projects",
    description: "View your team projects, or click Create Project to start a new one.",
    placement: "right",
  },
  {
    target: "nav-my-tasks",
    title: "My Tasks",
    description: "Manage your personal task queue, submit evidence, and earn XP rewards.",
    placement: "right",
  },
  {
    target: "nav-resources",
    title: "Resources",
    description: "Explore project framework templates and collaborative team guides.",
    placement: "right",
  },
];

export function AuthenticatedHome() {
  const { signOut } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();

  const profile = useQuery(api.profiles.getOrNull);
  const subscription = useQuery(api.aiUsage.getCurrent, profile ? {} : "skip");
  const currentPlan = normalizeSubscriptionPlan(subscription?.tier);
  const profileComplete =
    profile !== undefined &&
    profile !== null &&
    profile.profileCompletedAt !== undefined &&
    profile.weeklyCapacity !== undefined &&
    (profile.skills?.length ?? 0) + (profile.softwareSkills?.length ?? 0) > 0;

  const rooms = useQuery(api.teams.listMine, profileComplete ? {} : "skip");
  const projects = useQuery(api.projects.listMineAcrossRooms, profileComplete ? {} : "skip");
  const ensureProfile = useMutation(api.profiles.ensureCurrent);
  const hasRequestedProfile = useRef(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDashboardTour, setShowDashboardTour] = useState(() => {
    try {
      return localStorage.getItem("maylamdi_tour_dashboard_done") !== "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (profile !== null || hasRequestedProfile.current) {
      return;
    }

    hasRequestedProfile.current = true;
    void ensureProfile().catch(() => {
      setProfileError(
        "Your MayLamDi profile could not be prepared. Please sign out and try again.",
      );
    });
  }, [ensureProfile, profile]);

  // Synchronize state from current URL location
  const path = location.pathname;
  let activeSection: MainSection = "home";
  let projectsView: ProjectsView = "index";
  let selectedRoomId: Id<"teams"> | null = null;

  if (path.startsWith("/subscription")) {
    activeSection = "subscription";
  } else if (path.startsWith("/profile")) {
    activeSection = "profile";
  } else if (path.startsWith("/resources") || path.startsWith("/projects/resources")) {
    activeSection = "resources";
    projectsView = "resources";
  } else if (path.startsWith("/projects/create")) {
    activeSection = "projects";
    projectsView = "create";
  } else if (path.startsWith("/projects/join")) {
    activeSection = "projects";
    projectsView = "join";
  } else if (path.startsWith("/projects/my-tasks")) {
    activeSection = "projects";
    projectsView = "personal-tasks";
  } else if (path.startsWith("/rooms/")) {
    activeSection = "projects";
    projectsView = "room";
    const roomIdStr = path.replace("/rooms/", "").split("/")[0];
    if (roomIdStr) {
      selectedRoomId = roomIdStr as Id<"teams">;
    }
  } else if (path.startsWith("/projects")) {
    activeSection = "projects";
    projectsView = "index";
  }

  useEffect(() => {
    if (
      projectsView === "room" &&
      selectedRoomId !== null &&
      projects !== undefined &&
      !projects.some((project) => project.teamId === selectedRoomId)
    ) {
      navigate("/projects", { replace: true });
    }
  }, [navigate, projects, projectsView, selectedRoomId]);

  if (profileError) {
    return (
      <main className="auth-state-page">
        <BrandLogo />
        <h1 className="display-heading">Profile setup needs attention.</h1>
        <p role="alert">{profileError}</p>
        <button
          className="primary-button"
          type="button"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </main>
    );
  }

  if (profile === undefined || profile === null) {
    return (
      <main className="auth-state-page" aria-busy="true">
        <BrandLogo />
        <p className="kicker">Setting up your workspace</p>
        <h1 className="display-heading">Loading your profile.</h1>
        <p role="status">Preparing your MayLamDi profile…</p>
      </main>
    );
  }

  if (!profileComplete && activeSection !== "subscription") {
    return (
      <main className="authenticated-shell profile-gate-shell">
        <header className="app-header">
          <Link className="nav-brand" to="/" aria-label="MayLamDi home"><BrandLogo compact /><span>MayLamDi</span></Link>
          <div className="nav-actions"><SubscriptionNavItem plan={currentPlan} /><ThemeToggle /><button className="secondary-button" type="button" onClick={() => void signOut()}>Sign out</button></div>
        </header>
        <div className="profile-gate-content"><ProfileCenter setupRequired /></div>
      </main>
    );
  }

  const availableRooms = rooms ?? [];
  const availableProjects = projects ?? [];
  const visibleRooms = projects === undefined
    ? availableRooms
    : availableRooms.filter((room) => availableProjects.some((project) => project.teamId === room._id));
  const selectedRoomIsAvailable = visibleRooms.some((room) => room._id === selectedRoomId);
  const activeRoomId = projects === undefined
    ? selectedRoomId
    : selectedRoomIsAvailable
    ? selectedRoomId
    : projectsView === "room"
      ? null
      : (visibleRooms[0]?._id ?? null);

  function openProjects(view: ProjectsView, roomId?: Id<"teams">) {
    const targetPath = getPathForSection("projects", view, roomId);
    navigate(targetPath);
    setMobileMenuOpen(false);
  }

  function handleNavClick(item: (typeof MAIN_NAV_ITEMS)[number]) {
    navigate(item.path);
    setMobileMenuOpen(false);
  }

  function handleDashboardTourStepChange(_stepIndex: number, step: TutorialStep) {
    if (step.target === "nav-home") {
      navigate("/home");
    } else if (step.target === "nav-profile") {
      navigate("/profile");
    } else if (step.target === "nav-projects") {
      openProjects("index");
    } else if (step.target === "nav-my-tasks") {
      openProjects("personal-tasks");
    } else if (step.target === "nav-resources") {
      navigate("/resources");
      setMobileMenuOpen(false);
    }
  }

  function handleStartTutorial() {
    if (projectsView === "room") {
      window.dispatchEvent(new CustomEvent("mld:restart-room-tour"));
    } else {
      setShowDashboardTour(false);
      setTimeout(() => setShowDashboardTour(true), 50);
    }
  }

  return (
    <main className={`authenticated-shell app-shell ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      <header className="app-header">
        <button className="nav-menu-button" type="button" aria-label="Toggle sidebar" onClick={() => {
          if (window.matchMedia("(max-width: 760px)").matches) {
            setMobileMenuOpen((current) => !current);
          } else {
            setSidebarOpen((current) => !current);
          }
        }}><UiIcon name="Menu" /></button>
        <Link className="nav-brand" to="/" aria-label="MayLamDi home">
          <BrandLogo compact />
          <span>MayLamDi</span>
        </Link>
        <div className="nav-actions">
          {activeRoomId ? <ActivityCenter teamId={activeRoomId} /> : null}
          <button
            type="button"
            className="tutorial-nav-button"
            onClick={handleStartTutorial}
            aria-label="Start interactive tutorial"
          >
            Tutorial
          </button>
          <SubscriptionNavItem plan={currentPlan} />
          <ThemeToggle />
          <button
            className="secondary-button"
            type="button"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </header>
      <aside className={`app-sidebar ${mobileMenuOpen ? "is-mobile-open" : ""}`} aria-label="Main navigation">
        <nav>
          {MAIN_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              data-tour={`nav-${item.id}`}
              className={activeSection === item.id ? "is-active" : ""}
              type="button"
              onClick={() => handleNavClick(item)}
            >
              <span aria-hidden="true"><UiIcon name={item.icon} /></span><strong>{item.label}</strong>
            </button>
          ))}
          <div className="sidebar-room-tree" aria-label="Project rooms">
            <div className="sidebar-projects-scroll">
              {availableProjects.map((project, index) => (
                <button
                  key={project._id}
                  className={activeSection === "projects" && projectsView === "room" && activeRoomId === project.teamId ? "is-active is-room is-project-room" : "is-room is-project-room"}
                  type="button"
                  style={{ "--group-color": getGroupColor(index) } as CSSProperties}
                  onClick={() => openProjects("room", project.teamId)}
                >
                  <span className="project-color-marker" aria-hidden="true" /><strong>{project.title}</strong>
                </button>
              ))}
            </div>
          </div>
          <button
            data-tour="nav-my-tasks"
            className={projectsView === "personal-tasks" ? "is-active sidebar-bottom-tasks-button" : "sidebar-bottom-tasks-button"}
            type="button"
            onClick={() => openProjects("personal-tasks")}
            style={{ marginTop: "0.25rem" }}
          >
            <CheckSquare size={18} aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-3px" }} />
            <strong>My Tasks</strong>
          </button>
          <button
            data-tour="nav-resources"
            className={activeSection === "resources" || projectsView === "resources" ? "is-active sidebar-bottom-resources-button" : "sidebar-bottom-resources-button"}
            type="button"
            onClick={() => {
              navigate("/resources");
              setMobileMenuOpen(false);
            }}
            style={{ marginTop: "0.25rem" }}
          >
            <BookOpen size={18} aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-3px" }} />
            <strong>Resources</strong>
          </button>
        </nav>
      </aside>
      {mobileMenuOpen ? <button className="nav-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} /> : null}
      <div className="app-content">
        <div className="content-container">
          {activeSection === "subscription" ? (
            <SubscriptionPage currentPlan={currentPlan} />
          ) : (
            <TeamSystem
              profile={profile}
              activeSection={activeSection}
              projectsView={projectsView}
              rooms={visibleRooms}
              projectCards={projects}
              selectedRoomId={activeRoomId}
              onNavigateHome={() => navigate("/home")}
              onOpenProjects={(view) => openProjects(view)}
              onOpenRoom={(roomId) => openProjects("room", roomId)}
              resumePendingProjectCreation={new URLSearchParams(location.search).get("resume") === "1"}
            />
          )}
        </div>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button className={activeSection === "home" ? "is-active" : ""} type="button" onClick={() => { navigate("/home"); setMobileMenuOpen(false); }}><Home aria-hidden="true" /><span>Home</span></button>
        <button className={activeSection === "projects" && projectsView !== "personal-tasks" ? "is-active" : ""} type="button" onClick={() => openProjects("index")}><FolderKanban aria-hidden="true" /><span>Projects</span></button>
        <button className={projectsView === "personal-tasks" ? "is-active" : ""} type="button" onClick={() => openProjects("personal-tasks")}><ListChecks aria-hidden="true" /><span>Tasks</span></button>
        <button className={activeSection === "profile" ? "is-active" : ""} type="button" onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}><UserRound aria-hidden="true" /><span>Profile</span></button>
        <button className={mobileMenuOpen ? "is-active" : ""} type="button" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((current) => !current)}><Menu aria-hidden="true" /><span>More</span></button>
      </nav>

      {showDashboardTour && (
        <OnboardingTutorial
          steps={DASHBOARD_TUTORIAL_STEPS}
          isOpen={showDashboardTour}
          storageKey="maylamdi_tour_dashboard_done"
          onStepChange={handleDashboardTourStepChange}
          onComplete={() => setShowDashboardTour(false)}
          onSkip={() => setShowDashboardTour(false)}
        />
      )}
    </main>
  );
}
