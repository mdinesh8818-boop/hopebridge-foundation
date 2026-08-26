"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  Home,
  MessageSquare,
  Plus,
  Search,
  Users,
  UsersRound,
} from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  createDocument,
  deleteDocument,
  subscribeDocuments,
  updateDocument,
} from "../../../services/firestore";
import { logActivity } from "../../../services/activity";
import { useAuth } from "@/providers/AuthProvider";
import AssignmentModal from "./components/AssignmentModal";
import CreateTeamModal from "./components/CreateTeamModal";
import DiscussionDrawer from "./components/DiscussionDrawer";
import MeetingModal from "./components/MeetingModal";
import MemberProfileDrawer from "./components/MemberProfileDrawer";
import RebalancePanel from "./components/RebalancePanel";
import TeamDetailDrawer from "./components/TeamDetailDrawer";
import {
  DEPARTMENTS,
  PERMISSION_LABELS,
  PERMISSION_ROLES,
  ROLES,
} from "./data";
import type {
  CreateTeamForm,
  DirectoryFilters,
  KpiFocus,
  Team,
  TeamActivityEvent,
  TeamAssignment,
  TeamDiscussion,
  TeamMeeting,
  TeamMember,
  WorkspaceTab,
} from "./types";
import {
  buildRebalanceSuggestions,
  calculateKpis,
  filterMembers,
  formatDate,
  formatRelativeTime,
  getCapacityClass,
  getInitials,
  getTeamAssignmentCount,
  normalizeTeamActivityRecord,
  normalizeTeamAssignmentRecord,
  normalizeTeamDiscussionRecord,
  normalizeTeamMeetingRecord,
  normalizeTeamMemberRecord,
  normalizeTeamRecord,
  searchTeams,
  sortActivity,
  toTeamWriteData,
  updateMembersWorkload,
  updateTeamsCapacity,
} from "./utils";
import { useModuleCreateAction } from "@/hooks/useModuleCreateAction";
import "./teams.css";

const INITIAL_DIRECTORY_FILTERS: DirectoryFilters = {
  search: "",
  department: "All",
  role: "All",
  team: "All",
  availability: "All",
  workload: "All",
};

const WORKSPACE_TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "directory", label: "Directory" },
  { id: "assignments", label: "Assignments" },
  { id: "discussions", label: "Discussions" },
  { id: "meetings", label: "Meetings" },
  { id: "permissions", label: "Permissions" },
];

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [discussions, setDiscussions] = useState<TeamDiscussion[]>([]);
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [activity, setActivity] = useState<TeamActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("overview");
  const [kpiFocus, setKpiFocus] = useState<KpiFocus>("teams");
  const [heroSearch, setHeroSearch] = useState("");
  const [directoryFilters, setDirectoryFilters] = useState(INITIAL_DIRECTORY_FILTERS);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState<TeamDiscussion | null>(null);
  const [assignmentModal, setAssignmentModal] = useState<{
    assignment?: TeamAssignment | null;
    teamId?: string;
  } | null>(null);
  const [meetingModal, setMeetingModal] = useState<{
    meeting?: TeamMeeting | null;
    teamId?: string;
  } | null>(null);
  const [rebalanceTeam, setRebalanceTeam] = useState<Team | null>(null);
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionTeamId, setNewDiscussionTeamId] = useState("");

  const workspaceRef = useRef<HTMLDivElement>(null);
  const directorySearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const ready = {
      teams: false,
      members: false,
      assignments: false,
      discussions: false,
      meetings: false,
      activity: false,
    };

    function markReady(key: keyof typeof ready) {
      ready[key] = true;
      if (Object.values(ready).every(Boolean)) setIsLoading(false);
    }

    const unsubscribeTeams = subscribeDocuments(
      "teams",
      (docs) => {
        setTeams(docs.map((doc) => normalizeTeamRecord(doc)));
        markReady("teams");
      },
      (error) => {
        console.error(error);
        setLoadError("Unable to load team data.");
        setTeams([]);
        markReady("teams");
      },
    );

    const unsubscribeMembers = subscribeDocuments(
      "teamMembers",
      (docs) => {
        setMembers(docs.map((doc) => normalizeTeamMemberRecord(doc)));
        markReady("members");
      },
      () => {
        setMembers([]);
        markReady("members");
      },
    );

    const unsubscribeAssignments = subscribeDocuments(
      "teamAssignments",
      (docs) => {
        setAssignments(docs.map((doc) => normalizeTeamAssignmentRecord(doc)));
        markReady("assignments");
      },
      () => {
        setAssignments([]);
        markReady("assignments");
      },
    );

    const unsubscribeDiscussions = subscribeDocuments(
      "teamDiscussions",
      (docs) => {
        setDiscussions(docs.map((doc) => normalizeTeamDiscussionRecord(doc)));
        markReady("discussions");
      },
      () => {
        setDiscussions([]);
        markReady("discussions");
      },
    );

    const unsubscribeMeetings = subscribeDocuments(
      "teamMeetings",
      (docs) => {
        setMeetings(docs.map((doc) => normalizeTeamMeetingRecord(doc)));
        markReady("meetings");
      },
      () => {
        setMeetings([]);
        markReady("meetings");
      },
    );

    const unsubscribeActivity = subscribeDocuments(
      "teamActivity",
      (docs) => {
        setActivity(sortActivity(docs.map((doc) => normalizeTeamActivityRecord(doc))));
        markReady("activity");
      },
      () => {
        setActivity([]);
        markReady("activity");
      },
    );

    return () => {
      unsubscribeTeams();
      unsubscribeMembers();
      unsubscribeAssignments();
      unsubscribeDiscussions();
      unsubscribeMeetings();
      unsubscribeActivity();
    };
  }, [user]);

  const membersWithWorkload = useMemo(
    () => updateMembersWorkload(members, assignments),
    [members, assignments],
  );

  const teamsWithCapacity = useMemo(
    () => updateTeamsCapacity(teams, membersWithWorkload),
    [teams, membersWithWorkload],
  );

  useModuleCreateAction(useCallback(() => setIsCreateTeamOpen(true), []));

  const kpis = useMemo(
    () => calculateKpis(teamsWithCapacity, membersWithWorkload, assignments),
    [teamsWithCapacity, membersWithWorkload, assignments],
  );

  const filteredTeams = useMemo(() => {
    const list = searchTeams(teamsWithCapacity, membersWithWorkload, heroSearch);
    if (kpiFocus === "teams") return list.filter((t) => t.status === "Active");
    if (kpiFocus === "workload") return list.filter((t) => t.capacity >= 85);
    return list;
  }, [teamsWithCapacity, membersWithWorkload, heroSearch, kpiFocus]);

  const filteredMembers = useMemo(
    () => filterMembers(membersWithWorkload, directoryFilters),
    [membersWithWorkload, directoryFilters],
  );

  const visibleActivity = showAllActivity ? activity : activity.slice(0, 5);
  const outreachTeam = teamsWithCapacity.find((t) => t.name === "Community Outreach") ?? teamsWithCapacity[0];
  const rebalanceSuggestions = useMemo(
    () => (outreachTeam ? buildRebalanceSuggestions(outreachTeam, membersWithWorkload, assignments) : []),
    [outreachTeam, membersWithWorkload, assignments],
  );

  const scrollToWorkspace = useCallback(() => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const appendActivity = useCallback(async (detail: string, teamId?: string) => {
    const event = {
      type: "team_update",
      detail,
      teamId,
      createdAt: new Date().toISOString(),
    };
    try {
      await createDocument("teamActivity", event);
    } catch (error) {
      console.error("Unable to record team activity.", error);
    }
  }, []);

  const notify = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3200);
  };

  async function syncMemberTeamIds(teamId: string, memberIds: string[]) {
    const memberIdSet = new Set(memberIds);
    await Promise.all(
      membersWithWorkload.map(async (member) => {
        const shouldInclude = memberIdSet.has(member.id);
        const hasTeam = member.teamIds.includes(teamId);
        if (shouldInclude === hasTeam) return;

        const teamIds = shouldInclude
          ? Array.from(new Set([...member.teamIds, teamId]))
          : member.teamIds.filter((id) => id !== teamId);

        await updateDocument("teamMembers", member.id, { teamIds });
      }),
    );
  }

  async function handleCreateTeam(form: CreateTeamForm) {
    const lead = membersWithWorkload.find((m) => m.id === form.leadId);
    const secondary = form.secondaryLeadId
      ? membersWithWorkload.find((m) => m.id === form.secondaryLeadId)
      : undefined;
    if (!lead) return;

    const memberIds = Array.from(new Set([form.leadId, ...form.memberIds]));
    const data = {
      name: form.name.trim(),
      department: form.department,
      description: form.description.trim(),
      leadId: form.leadId,
      leadName: lead.name,
      secondaryLeadId: secondary?.id ?? "",
      secondaryLeadName: secondary?.name ?? "",
      memberIds,
      status: "Active" as const,
      capacity: 0,
      defaultPermission: form.defaultPermission,
      nextDeadline: "",
    };

    setSaving(true);
    try {
      const id = await createDocument("teams", toTeamWriteData(data));
      await syncMemberTeamIds(id, memberIds);
      setIsCreateTeamOpen(false);
      await logActivity({
        module: "teams",
        action: "created",
        entityType: "team",
        entityId: id,
        entityName: data.name,
        description: `Team "${data.name}" created.`,
      });
      await appendActivity(`New team "${data.name}" created`, id);
      notify(`Team "${data.name}" created successfully.`);
    } catch (error) {
      console.error("Unable to create team.", error);
      alert("Unable to create team. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTeam(teamId: string, form: CreateTeamForm) {
    const existing = teamsWithCapacity.find((team) => team.id === teamId);
    const lead = membersWithWorkload.find((m) => m.id === form.leadId);
    const secondary = form.secondaryLeadId
      ? membersWithWorkload.find((m) => m.id === form.secondaryLeadId)
      : undefined;
    if (!existing || !lead) return;

    const memberIds = Array.from(new Set([form.leadId, ...form.memberIds]));
    const data = {
      name: form.name.trim(),
      department: form.department,
      description: form.description.trim(),
      leadId: form.leadId,
      leadName: lead.name,
      secondaryLeadId: secondary?.id ?? "",
      secondaryLeadName: secondary?.name ?? "",
      memberIds,
      status: existing.status,
      capacity: existing.capacity,
      defaultPermission: form.defaultPermission,
      nextDeadline: existing.nextDeadline ?? "",
    };

    setSaving(true);
    try {
      await updateDocument("teams", teamId, toTeamWriteData(data));
      await syncMemberTeamIds(teamId, memberIds);
      setEditingTeam(null);
      setSelectedTeam(null);
      await logActivity({
        module: "teams",
        action: "updated",
        entityType: "team",
        entityId: teamId,
        entityName: data.name,
        description: `Team "${data.name}" updated.`,
      });
      await appendActivity(`Team "${data.name}" updated`, teamId);
      notify(`Team "${data.name}" saved successfully.`);
    } catch (error) {
      console.error("Unable to update team.", error);
      alert("Unable to update team. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    setSaving(true);
    try {
      const teamAssignments = assignments.filter((assignment) => assignment.teamId === teamId);
      const teamDiscussions = discussions.filter((discussion) => discussion.teamId === teamId);
      const teamMeetings = meetings.filter((meeting) => meeting.teamId === teamId);

      await Promise.all([
        ...teamAssignments.map((assignment) => deleteDocument("teamAssignments", assignment.id)),
        ...teamDiscussions.map((discussion) => deleteDocument("teamDiscussions", discussion.id)),
        ...teamMeetings.map((meeting) => deleteDocument("teamMeetings", meeting.id)),
      ]);

      await syncMemberTeamIds(teamId, []);
      await deleteDocument("teams", teamId);

      setEditingTeam(null);
      setSelectedTeam(null);
      setIsCreateTeamOpen(false);
      await appendActivity(`Team removed from workspace`, teamId);
      notify("Team deleted successfully.");
    } catch (error) {
      console.error("Unable to delete team.", error);
      alert("Unable to delete team. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAssignment(data: Omit<TeamAssignment, "id"> & { id?: string }) {
    const payload = {
      title: data.title,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      teamId: data.teamId,
      teamName: data.teamName,
      priority: data.priority,
      dueDate: data.dueDate,
      status: data.status,
    };
    setSaving(true);
    try {
      if (data.id) {
        await updateDocument("teamAssignments", data.id, payload);
        await appendActivity(`${data.teamName} updated assignment "${data.title}"`, data.teamId);
      } else {
        const id = await createDocument("teamAssignments", payload);
        await appendActivity(`${data.teamName} assigned "${data.title}" to ${data.ownerName}`, data.teamId);
        void id;
      }
      setAssignmentModal(null);
      notify("Assignment saved.");
    } catch (error) {
      console.error("Unable to save assignment.", error);
      alert("Unable to save assignment. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    try {
      await deleteDocument("teamAssignments", assignmentId);
      setAssignmentModal(null);
      notify("Assignment deleted.");
    } catch (error) {
      console.error("Unable to delete assignment.", error);
      alert("Unable to delete assignment. Please try again.");
    }
  }

  async function handleSaveMeeting(data: Omit<TeamMeeting, "id"> & { id?: string }) {
    const payload = {
      title: data.title,
      teamId: data.teamId,
      teamName: data.teamName,
      date: data.date,
      time: data.time,
      attendeeIds: data.attendeeIds,
      agenda: data.agenda,
      notes: data.notes ?? "",
      actionItems: data.actionItems ?? [],
      completed: data.completed ?? false,
    };
    setSaving(true);
    try {
      if (data.id) {
        await updateDocument("teamMeetings", data.id, payload);
      } else {
        await createDocument("teamMeetings", payload);
        await appendActivity(`${data.teamName} scheduled ${data.title}`, data.teamId);
      }
      setMeetingModal(null);
      notify("Meeting saved.");
    } catch (error) {
      console.error("Unable to save meeting.", error);
      alert("Unable to save meeting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMeeting(meetingId: string) {
    try {
      await deleteDocument("teamMeetings", meetingId);
      setMeetingModal(null);
      notify("Meeting deleted.");
    } catch (error) {
      console.error("Unable to delete meeting.", error);
      alert("Unable to delete meeting. Please try again.");
    }
  }

  async function handleReplyDiscussion(discussionId: string, body: string) {
    const disc = discussions.find((d) => d.id === discussionId);
    if (!disc) return;
    const msg = {
      id: `msg-${Date.now()}`,
      authorId: "mem-001",
      authorName: "Dinesh M.",
      body,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...disc,
      messages: [...disc.messages, msg],
      lastMessage: body,
      lastActivityAt: msg.createdAt,
      unreadCount: 0,
    };
    try {
      await updateDocument("teamDiscussions", discussionId, {
        messages: updated.messages,
        lastMessage: updated.lastMessage,
        lastActivityAt: updated.lastActivityAt,
        unreadCount: 0,
      });
      setSelectedDiscussion(updated);
    } catch (error) {
      console.error("Unable to reply to discussion.", error);
      alert("Unable to save reply. Please try again.");
    }
  }

  async function handleResolveDiscussion(discussionId: string) {
    try {
      await updateDocument("teamDiscussions", discussionId, { resolved: true });
      setSelectedDiscussion(null);
    } catch (error) {
      console.error("Unable to resolve discussion.", error);
      alert("Unable to resolve discussion. Please try again.");
    }
  }

  async function handleDeleteDiscussion(discussionId: string) {
    try {
      await deleteDocument("teamDiscussions", discussionId);
      setSelectedDiscussion(null);
      notify("Discussion deleted.");
    } catch (error) {
      console.error("Unable to delete discussion.", error);
      alert("Unable to delete discussion. Please try again.");
    }
  }

  async function handleRebalanceConfirm(s: ReturnType<typeof buildRebalanceSuggestions>[0]) {
    const assignment = assignments.find((a) => a.id === s.assignmentId);
    if (!assignment) return;
    const newOwner = membersWithWorkload.find((m) => m.id === s.suggestedOwnerId);
    if (!newOwner) return;
    await handleSaveAssignment({
      ...assignment,
      ownerId: newOwner.id,
      ownerName: newOwner.name,
    });
    await appendActivity(
      `Rebalanced "${assignment.title}" from ${s.currentOwnerName} to ${s.suggestedOwnerName}`,
      assignment.teamId,
    );
    setRebalanceTeam(null);
  }

  async function handleCreateDiscussion(e: React.FormEvent) {
    e.preventDefault();
    const team = teamsWithCapacity.find((t) => t.id === newDiscussionTeamId);
    if (!team || !newDiscussionTitle.trim()) return;
    const now = new Date().toISOString();
    const payload = {
      title: newDiscussionTitle.trim(),
      teamId: team.id,
      teamName: team.name,
      participantIds: team.memberIds,
      lastMessage: "Discussion started.",
      lastActivityAt: now,
      unreadCount: 0,
      resolved: false,
      messages: [{
        id: `msg-${Date.now()}`,
        authorId: "mem-001",
        authorName: "Dinesh M.",
        body: "Discussion started.",
        createdAt: now,
      }],
    };
    try {
      const id = await createDocument("teamDiscussions", payload);
      await appendActivity(`New discussion "${payload.title}" started in ${team.name}`, team.id);
      void id;
      setNewDiscussionOpen(false);
      setNewDiscussionTitle("");
      notify("Discussion created.");
    } catch (error) {
      console.error("Unable to create discussion.", error);
      alert("Unable to create discussion. Please try again.");
    }
  }

  function focusSearch() {
    setSearchFocus(true);
    setWorkspaceTab("directory");
    scrollToWorkspace();
    setTimeout(() => directorySearchRef.current?.focus(), 300);
  }

  function handleKpiClick(focus: KpiFocus) {
    setKpiFocus(focus);
    scrollToWorkspace();
    if (focus === "members") setWorkspaceTab("directory");
    if (focus === "assignments") setWorkspaceTab("assignments");
    if (focus === "workload") setWorkspaceTab("overview");
    if (focus === "teams") setWorkspaceTab("overview");
  }

  const statusClass = (status: string) => {
    const key = status.replace(/\s/g, "").toLowerCase();
    if (key === "todo") return "tm-status-todo";
    if (key === "inprogress") return "tm-status-progress";
    if (key === "inreview") return "tm-status-review";
    return "tm-status-done";
  };

  return (
    <div className="hb-app tm-page">
      <HopeBridgeSidebar activePath="/dashboard/teams" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1680px]">
          <nav className="hb-breadcrumb">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span className="text-[#c2cbc6]">/</span>
            <strong>Teams</strong>
          </nav>

          {loadError && (
            <div className="mt-4 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#be123c]">
              {loadError}
            </div>
          )}
          {successMessage && (
            <div className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] px-4 py-3 text-sm text-[#047857]">
              {successMessage}
            </div>
          )}

          <header className="tm-hero" aria-label="Team Management">
            <div className="tm-hero-scene" aria-hidden="true">
              <img
                src="/hopebridge/teams/hero-team-collaboration.png"
                alt=""
                className="tm-hero-scene-img"
                draggable={false}
              />
            </div>
            <div className="tm-hero-readability" aria-hidden="true" />
            <div className="tm-hero-content">
              <div className="tm-hero-copy">
                <div className="tm-hero-eyebrow">PEOPLE & COLLABORATION</div>
                <h1 className="tm-hero-title">
                  Team <em>Management</em>
                </h1>
                <p className="tm-hero-desc">
                  Connect people, coordinate responsibilities, balance workloads,
                  and keep every HopeBridge team working toward shared impact.
                </p>
                <div className="tm-hero-actions">
                  <button type="button" className="tm-gold-btn" onClick={() => setIsCreateTeamOpen(true)}>
                    <Plus size={18} /> Create Team
                  </button>
                  <button type="button" className="tm-glass-btn" onClick={focusSearch}>
                    <Search size={17} /> Search Team
                  </button>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { key: "teams" as KpiFocus, label: "Active Teams", value: kpis.activeTeams, icon: UsersRound },
              { key: "members" as KpiFocus, label: "Team Members", value: kpis.teamMembers, icon: Users },
              { key: "assignments" as KpiFocus, label: "Open Assignments", value: kpis.openAssignments, icon: ClipboardList },
              { key: "workload" as KpiFocus, label: "Workload Alerts", value: kpis.workloadAlerts, icon: AlertTriangle },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <button
                  key={kpi.key}
                  type="button"
                  className={`tm-kpi-card ${kpiFocus === kpi.key ? "active" : ""}`}
                  onClick={() => handleKpiClick(kpi.key)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#607269]">{kpi.label}</p>
                      <p className="mt-3 font-serif text-4xl font-bold text-[#022c22]">
                        {isLoading ? "—" : kpi.value}
                      </p>
                    </div>
                    <div className="tm-kpi-icon"><Icon size={20} /></div>
                  </div>
                </button>
              );
            })}
          </section>

          <div ref={workspaceRef} className="tm-workspace">
            <div className="tm-tab-bar">
              {WORKSPACE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tm-tab ${workspaceTab === tab.id ? "active" : ""}`}
                  onClick={() => setWorkspaceTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="tm-tab-panel">
              {workspaceTab === "overview" && (
                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-serif text-xl font-bold text-[#18392e]">Team Workspace</h2>
                      <div className={`tm-search-input max-w-xs ${searchFocus ? "ring-2 ring-[rgba(212,175,55,.2)]" : ""}`}>
                        <Search size={16} className="text-[#0d5f44]" />
                        <input
                          placeholder="Search teams..."
                          value={heroSearch}
                          onChange={(e) => setHeroSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredTeams.map((team) => (
                        <article key={team.id} className="tm-team-card">
                          <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#9f7b24]">
                            {team.department.toUpperCase()}
                          </p>
                          <h3 className="mt-1 font-serif text-lg font-bold text-[#022c22]">{team.name}</h3>
                          <p className="mt-2 text-sm text-[#65766e]">Lead: {team.leadName}</p>
                          <p className="text-sm text-[#65766e]">
                            {team.memberIds.length} Members · {getTeamAssignmentCount(team.id, assignments)} Active Assignments
                          </p>
                          <p className="text-sm text-[#65766e]">Next Deadline: {formatDate(team.nextDeadline ?? "")}</p>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-[#65766e]">
                              <span>Capacity</span><span>{team.capacity}%</span>
                            </div>
                            <div className={`tm-capacity-bar mt-1 ${getCapacityClass(team.capacity)}`}>
                              <div className="tm-capacity-fill" style={{ width: `${team.capacity}%` }} />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="tm-gold-btn mt-4 w-full text-sm"
                            onClick={() => setSelectedTeam(team)}
                          >
                            Open Team
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="tm-panel-dark">
                      <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#f1ce55]">TEAM CAPACITY & WORKLOAD</p>
                      <h3 className="mt-2 font-serif text-lg font-bold">Workforce Balance</h3>
                      <div className="mt-4 space-y-4">
                        {teamsWithCapacity.slice(0, 4).map((team) => (
                          <button
                            key={team.id}
                            type="button"
                            className="w-full text-left"
                            onClick={() => setSelectedTeam(team)}
                          >
                            <div className="flex justify-between text-sm">
                              <span>{team.name}</span>
                              <span>{team.capacity}%</span>
                            </div>
                            <div className={`tm-capacity-bar mt-1 ${getCapacityClass(team.capacity)}`}>
                              <div className="tm-capacity-fill" style={{ width: `${team.capacity}%` }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tm-panel-dark">
                      <div className="flex items-center gap-2">
                        <BrainCircuit size={18} className="text-[#f1ce55]" />
                        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#f1ce55]">HOPEBRIDGE AI · TEAM INTELLIGENCE</p>
                      </div>
                      <h3 className="mt-3 font-serif text-lg font-bold">Community Outreach is approaching capacity.</h3>
                      <p className="mt-2 text-sm text-[rgba(255,250,240,.72)]">
                        Three team members currently hold 64% of the team&apos;s active assignments,
                        while two members have available capacity.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" className="tm-gold-btn text-sm" onClick={() => { setWorkspaceTab("directory"); scrollToWorkspace(); }}>
                          View Workload
                        </button>
                        <button type="button" className="tm-glass-btn text-sm" onClick={() => setRebalanceTeam(outreachTeam ?? null)}>
                          Rebalance Assignments
                        </button>
                      </div>
                    </div>

                    <div className="tm-panel-light">
                      <h3 className="font-serif text-lg font-bold text-[#18392e]">Recent Team Activity</h3>
                      <div className="mt-4 space-y-0">
                        {visibleActivity.map((ev) => (
                          <div key={ev.id} className="border-b border-[#e4dac6] py-3 last:border-0">
                            <p className="text-sm text-[#334b41]">{ev.detail}</p>
                            <p className="mt-1 text-xs text-[#65766e]">{formatRelativeTime(ev.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                      {activity.length > 5 && (
                        <button type="button" className="mt-3 text-sm font-semibold text-[#0d5f44]" onClick={() => setShowAllActivity((v) => !v)}>
                          {showAllActivity ? "Show less" : "View All Activity"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {workspaceTab === "directory" && (
                <div>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <div className={`tm-search-input min-w-[240px] flex-1 ${searchFocus ? "ring-2 ring-[rgba(212,175,55,.2)]" : ""}`}>
                      <Search size={16} />
                      <input
                        ref={directorySearchRef}
                        placeholder="Search people..."
                        value={directoryFilters.search}
                        onChange={(e) => setDirectoryFilters((f) => ({ ...f, search: e.target.value }))}
                      />
                    </div>
                    <select className="rounded-xl border border-[#e4dac6] px-3 py-2 text-sm" value={directoryFilters.department} onChange={(e) => setDirectoryFilters((f) => ({ ...f, department: e.target.value }))}>
                      <option value="All">All Departments</option>
                      {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <select className="rounded-xl border border-[#e4dac6] px-3 py-2 text-sm" value={directoryFilters.role} onChange={(e) => setDirectoryFilters((f) => ({ ...f, role: e.target.value }))}>
                      <option value="All">All Roles</option>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <select className="rounded-xl border border-[#e4dac6] px-3 py-2 text-sm" value={directoryFilters.team} onChange={(e) => setDirectoryFilters((f) => ({ ...f, team: e.target.value }))}>
                      <option value="All">All Teams</option>
                      {teamsWithCapacity.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select className="rounded-xl border border-[#e4dac6] px-3 py-2 text-sm" value={directoryFilters.availability} onChange={(e) => setDirectoryFilters((f) => ({ ...f, availability: e.target.value }))}>
                      <option value="All">All Availability</option>
                      {["Available", "Focused", "In Meeting", "Remote", "On Leave"].map((a) => <option key={a}>{a}</option>)}
                    </select>
                    <select className="rounded-xl border border-[#e4dac6] px-3 py-2 text-sm" value={directoryFilters.workload} onChange={(e) => setDirectoryFilters((f) => ({ ...f, workload: e.target.value }))}>
                      <option value="All">All Workload</option>
                      <option value="High">High (85%+)</option>
                      <option value="Normal">Normal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    {filteredMembers.map((m) => (
                      <button key={m.id} type="button" className="tm-member-row" onClick={() => setSelectedMember(m)}>
                        <span className="tm-avatar">{getInitials(m.name)}</span>
                        <div className="flex-1 grid gap-1 sm:grid-cols-4 sm:items-center">
                          <div>
                            <p className="font-semibold text-[#18392e]">{m.name}</p>
                            <p className="text-xs text-[#65766e]">{m.role}</p>
                          </div>
                          <p className="text-sm text-[#65766e]">{m.department}</p>
                          <p className="text-sm text-[#65766e]">{m.assignmentCount} assignments · {m.workload}%</p>
                          <p className="text-sm text-[#65766e]">{m.availability}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {workspaceTab === "assignments" && (
                <div>
                  <div className="mb-4 flex justify-between">
                    <h2 className="font-serif text-xl font-bold text-[#18392e]">Team Assignments</h2>
                    <button type="button" className="tm-gold-btn text-sm" onClick={() => setAssignmentModal({})}>
                      <Plus size={16} /> Create Assignment
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {assignments.map((a) => (
                      <div key={a.id} className="tm-assignment-card">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[#18392e]">{a.title}</p>
                          <span className={`text-xs font-bold tm-priority-${a.priority.toLowerCase()}`}>{a.priority}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#65766e]">{a.teamName} · {a.ownerName}</p>
                        <p className="text-xs text-[#65766e]">Due {formatDate(a.dueDate)}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`tm-status-pill ${statusClass(a.status)}`}>{a.status}</span>
                          <button type="button" className="text-xs font-semibold text-[#0d5f44]" onClick={() => setAssignmentModal({ assignment: a })}>
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workspaceTab === "discussions" && (
                <div>
                  <div className="mb-4 flex justify-between">
                    <h2 className="font-serif text-xl font-bold text-[#18392e]">Team Discussions</h2>
                    <button type="button" className="tm-gold-btn text-sm" onClick={() => {
                      setNewDiscussionTeamId(teamsWithCapacity[0]?.id ?? "");
                      setNewDiscussionOpen(true);
                    }}>
                      <MessageSquare size={16} /> New Discussion
                    </button>
                  </div>
                  <div className="space-y-2">
                    {discussions.map((d) => (
                      <button key={d.id} type="button" className="w-full rounded-xl border border-[#e4dac6] px-4 py-3 text-left hover:border-[#d4af37]/40" onClick={() => setSelectedDiscussion(d)}>
                        <div className="flex justify-between">
                          <p className="font-semibold text-[#18392e]">{d.title}</p>
                          {d.unreadCount > 0 && <span className="rounded-full bg-[#be123c] px-2 py-0.5 text-[10px] font-bold text-white">{d.unreadCount}</span>}
                        </div>
                        <p className="mt-1 text-xs text-[#65766e]">{d.teamName} · {d.participantIds.length} participants</p>
                        <p className="text-xs text-[#65766e]">{formatRelativeTime(d.lastActivityAt)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {workspaceTab === "meetings" && (
                <div>
                  <div className="mb-4 flex justify-between">
                    <h2 className="font-serif text-xl font-bold text-[#18392e]">Upcoming Team Meetings</h2>
                    <button type="button" className="tm-gold-btn text-sm" onClick={() => setMeetingModal({})}>
                      <CalendarDays size={16} /> Schedule Meeting
                    </button>
                  </div>
                  <div className="space-y-3">
                    {meetings.filter((m) => !m.completed).map((m) => (
                      <div key={m.id} className="rounded-xl border border-[#e4dac6] bg-white px-4 py-4">
                        <p className="font-semibold text-[#18392e]">{m.title}</p>
                        <p className="text-sm text-[#65766e]">{m.teamName}</p>
                        <p className="text-sm text-[#65766e]">{formatDate(m.date)} · {m.time} · {m.attendeeIds.length} attendees</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" className="tm-secondary-btn text-xs" onClick={() => setMeetingModal({ meeting: m })}>View Agenda</button>
                          <button type="button" className="tm-secondary-btn text-xs" onClick={() => setMeetingModal({ meeting: m })}>View Attendees</button>
                          <button type="button" className="tm-secondary-btn text-xs" onClick={async () => {
                            try {
                              await updateDocument("teamMeetings", m.id, { completed: true });
                            } catch (error) {
                              console.error("Unable to complete meeting.", error);
                              alert("Unable to complete meeting. Please try again.");
                            }
                          }}>Complete Meeting</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workspaceTab === "permissions" && (
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#18392e]">Roles & Permissions</h2>
                  <p className="mt-2 text-sm text-[#65766e]">
                    Permission controls integrate with HopeBridge role architecture. Changes require administrator approval.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <div className="tm-perm-grid min-w-[720px]">
                      <div className="tm-perm-cell head">Role</div>
                      {PERMISSION_LABELS.map((p) => (
                        <div key={p} className="tm-perm-cell head">{p}</div>
                      ))}
                      {PERMISSION_ROLES.map((role) => (
                        <Fragment key={role.id}>
                          <div className="tm-perm-cell head text-left">{role.name}</div>
                          {PERMISSION_LABELS.map((p) => (
                            <div key={`${role.id}-${p}`} className="tm-perm-cell">
                              {role.permissions[p] ? "✓" : "—"}
                            </div>
                          ))}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isCreateTeamOpen && (
        <CreateTeamModal
          members={membersWithWorkload}
          onClose={() => setIsCreateTeamOpen(false)}
          onCreate={handleCreateTeam}
        />
      )}

      {editingTeam && (
        <CreateTeamModal
          members={membersWithWorkload}
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onCreate={handleCreateTeam}
          onUpdate={handleUpdateTeam}
          onDelete={handleDeleteTeam}
        />
      )}

      {selectedTeam && (
        <TeamDetailDrawer
          team={selectedTeam}
          members={membersWithWorkload}
          assignments={assignments}
          discussions={discussions}
          meetings={meetings}
          onClose={() => setSelectedTeam(null)}
          onAddMember={() => { setWorkspaceTab("directory"); setSelectedTeam(null); scrollToWorkspace(); }}
          onCreateAssignment={() => { setAssignmentModal({ teamId: selectedTeam.id }); setSelectedTeam(null); }}
          onScheduleMeeting={() => { setMeetingModal({ teamId: selectedTeam.id }); setSelectedTeam(null); }}
          onStartDiscussion={() => { setSelectedDiscussion(discussions.find((d) => d.teamId === selectedTeam.id) ?? discussions[0] ?? null); setSelectedTeam(null); }}
          onEditTeam={() => {
            setEditingTeam(selectedTeam);
            setSelectedTeam(null);
          }}
          onOpenMember={setSelectedMember}
          onOpenDiscussion={setSelectedDiscussion}
        />
      )}

      {selectedMember && (
        <MemberProfileDrawer
          member={selectedMember}
          assignments={assignments}
          teamNames={teamsWithCapacity.filter((t) => selectedMember.teamIds.includes(t.id)).map((t) => t.name)}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {selectedDiscussion && (
        <DiscussionDrawer
          discussion={selectedDiscussion}
          members={membersWithWorkload}
          onClose={() => setSelectedDiscussion(null)}
          onReply={handleReplyDiscussion}
          onResolve={handleResolveDiscussion}
          onDelete={handleDeleteDiscussion}
        />
      )}

      {assignmentModal && (
        <AssignmentModal
          teams={teamsWithCapacity}
          members={membersWithWorkload}
          assignment={assignmentModal.assignment}
          defaultTeamId={assignmentModal.teamId}
          onClose={() => setAssignmentModal(null)}
          onSave={handleSaveAssignment}
          onDelete={handleDeleteAssignment}
        />
      )}

      {meetingModal && (
        <MeetingModal
          teams={teamsWithCapacity}
          members={membersWithWorkload}
          meeting={meetingModal.meeting}
          defaultTeamId={meetingModal.teamId}
          onClose={() => setMeetingModal(null)}
          onSave={handleSaveMeeting}
          onComplete={async (id) => {
            try {
              await updateDocument("teamMeetings", id, { completed: true });
              setMeetingModal(null);
            } catch (error) {
              console.error("Unable to complete meeting.", error);
              alert("Unable to complete meeting. Please try again.");
            }
          }}
          onDelete={handleDeleteMeeting}
        />
      )}

      {rebalanceTeam && (
        <RebalancePanel
          teamName={rebalanceTeam.name}
          suggestions={buildRebalanceSuggestions(rebalanceTeam, membersWithWorkload, assignments)}
          onClose={() => setRebalanceTeam(null)}
          onConfirm={handleRebalanceConfirm}
        />
      )}

      {newDiscussionOpen && (
        <>
          <div className="tm-overlay" onClick={() => setNewDiscussionOpen(false)} aria-hidden="true" />
          <form className="tm-modal" onSubmit={handleCreateDiscussion}>
            <div className="border-b border-[#e4dac6] px-6 py-4">
              <h2 className="font-serif text-xl font-bold text-[#022c22]">New Discussion</h2>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block text-sm font-medium">
                Title
                <input required className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" value={newDiscussionTitle} onChange={(e) => setNewDiscussionTitle(e.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Team
                <select required className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" value={newDiscussionTeamId} onChange={(e) => setNewDiscussionTeamId(e.target.value)}>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#e4dac6] px-6 py-4">
              <button type="button" className="tm-secondary-btn" onClick={() => setNewDiscussionOpen(false)}>Cancel</button>
              <button type="submit" className="tm-gold-btn">Start Discussion</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
