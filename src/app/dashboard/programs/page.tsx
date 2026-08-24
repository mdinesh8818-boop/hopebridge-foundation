"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  createDocument,
  deleteDocument,
  subscribeDocuments,
  updateDocument,
} from "../../../services/firestore";
import { logActivity } from "../../../services/activity";
import { useAuth } from "@/providers/AuthProvider";
import ActivityTimeline from "./components/ActivityTimeline";
import CreateProgramModal from "./components/CreateProgramModal";
import DeleteProgramModal from "./components/DeleteProgramModal";
import EditProgramModal from "./components/EditProgramModal";
import ProgramChart from "./components/ProgramChart";
import ProgramFilters from "./components/ProgramFilters";
import ProgramHeader from "./components/ProgramHeader";
import ProgramImpactOverview from "./components/ProgramImpactOverview";
import ProgramInsights from "./components/ProgramInsights";
import ProgramSearch from "./components/ProgramSearch";
import ProgramStats from "./components/ProgramStats";
import ProgramTable from "./components/ProgramTable";
import ProgramTemplatesModal from "./components/ProgramTemplatesModal";
import ViewProgramModal from "./components/ViewProgramModal";
import { ProgramTemplate } from "./data";
import "./programs.css";
import { Program, ProgramFilters as ProgramFiltersType } from "./types";
import { calculateStatistics, getVisiblePrograms } from "./utils";
import { useModuleCreateAction } from "@/hooks/useModuleCreateAction";

const INITIAL_FILTERS: ProgramFiltersType = {
  search: "",
  status: "All",
  category: "All",
  priority: "All",
};

function toText(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateString(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
  }
  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    }
    if (typeof maybeTimestamp.seconds === "number") {
      return new Date(maybeTimestamp.seconds * 1000).toISOString().slice(0, 10);
    }
  }
  return "";
}

function normalizeProgram(record: Record<string, unknown> & { id: string }): Program {
  const status = toText(record.status) as Program["status"];
  const priority = toText(record.priority) as Program["priority"];

  return {
    id: record.id,
    name: toText(record.name),
    category: toText(record.category),
    description: toText(record.description),
    manager: toText(record.manager),
    beneficiaries: toNumber(record.beneficiaries),
    budget: toNumber(record.budget),
    spent: toNumber(record.spent),
    progress: Math.min(Math.max(toNumber(record.progress), 0), 100),
    startDate: toDateString(record.startDate),
    endDate: toDateString(record.endDate),
    status: status || "Planning",
    priority: priority || "Medium",
    location: toText(record.location),
    createdAt: toDateString(record.createdAt),
    updatedAt: toDateString(record.updatedAt),
  };
}

function toProgramWriteData(program: Program) {
  return {
    name: program.name,
    category: program.category,
    description: program.description,
    manager: program.manager,
    beneficiaries: program.beneficiaries,
    budget: program.budget,
    spent: program.spent,
    progress: program.progress,
    startDate: program.startDate,
    endDate: program.endDate,
    status: program.status,
    priority: program.priority,
    location: program.location,
  };
}

export default function ProgramsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filters, setFilters] = useState<ProgramFiltersType>(INITIAL_FILTERS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<{
    name: string;
    category: string;
    description: string;
    priority: Program["priority"];
    budget: string;
    location: string;
  } | null>(null);
  const [viewProgram, setViewProgram] = useState<Program | null>(null);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [deleteProgram, setDeleteProgram] = useState<Program | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeDocuments(
      "programs",
      (docs) => {
        setPrograms(docs.map((doc) => normalizeProgram(doc)));
      },
      (error) => {
        console.error("Unable to load programs.", error);
        setPrograms([]);
      },
    );

    return unsubscribe;
  }, [user]);

  const visiblePrograms = useMemo(() => {
    return getVisiblePrograms(programs, filters);
  }, [programs, filters]);

  const statistics = useMemo(() => {
    return calculateStatistics(programs);
  }, [programs]);

  function handleSearchChange(value: string) {
    setFilters((current) => ({
      ...current,
      search: value,
    }));
  }

  async function handleCreate(program: Program) {
    try {
      const firestoreId = await createDocument("programs", toProgramWriteData(program));
      const saved = { ...program, id: firestoreId };
      setPrograms((current) => [
        saved,
        ...current.filter((existing) => existing.id !== firestoreId),
      ]);
      await logActivity({
        module: "programs",
        action: "created",
        entityType: "program",
        entityId: firestoreId,
        entityName: program.name,
        description: `Program "${program.name}" created`,
      });
    } catch (error) {
      console.error("Unable to create program.", error);
      alert("Unable to create program. Please try again.");
      throw error;
    }
  }

  async function handleSave(program: Program) {
    try {
      await updateDocument("programs", program.id, toProgramWriteData(program));
      setPrograms((current) =>
        current.map((existingProgram) =>
          existingProgram.id === program.id ? program : existingProgram,
        ),
      );
      await logActivity({
        module: "programs",
        action: "updated",
        entityType: "program",
        entityId: program.id,
        entityName: program.name,
        description: `Program "${program.name}" updated`,
      });
      setEditProgram(null);
    } catch (error) {
      console.error("Unable to save program.", error);
      alert("Unable to save program. Please try again.");
      throw error;
    }
  }

  async function handleDelete(programId: string) {
    const program = programs.find((p) => p.id === programId);
    try {
      await deleteDocument("programs", programId);
      setPrograms((current) => current.filter((p) => p.id !== programId));
      if (program) {
        await logActivity({
          module: "programs",
          action: "deleted",
          entityType: "program",
          entityId: programId,
          entityName: program.name,
          description: `Program "${program.name}" deleted`,
        });
      }
      setDeleteProgram(null);
    } catch (error) {
      console.error("Unable to delete program.", error);
      alert("Unable to delete program. Please try again.");
      throw error;
    }
  }

  function handleTemplateSelect(template: ProgramTemplate) {
    setCreatePrefill({
      name: template.name,
      category: template.category,
      description: template.description,
      priority: template.priority,
      budget: template.budget.toString(),
      location: template.location,
    });
    setIsCreateOpen(true);
  }

  function handleCreateClose() {
    setIsCreateOpen(false);
    setCreatePrefill(null);
  }

  useModuleCreateAction(
    useCallback(() => {
      setCreatePrefill(null);
      setIsCreateOpen(true);
    }, []),
  );

  return (
    <div className="hb-app pn-page">
      <HopeBridgeSidebar activePath="/dashboard/programs" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1600px]">
          <nav className="pn-breadcrumb">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]"
            >
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span className="text-[#c2cbc6]">/</span>
            <strong>Programs</strong>
          </nav>

          <ProgramHeader
            onCreate={() => {
              setCreatePrefill(null);
              setIsCreateOpen(true);
            }}
            onTemplates={() => setIsTemplatesOpen(true)}
          />

          <ProgramStats statistics={statistics} />

          <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]">
            <ProgramChart programs={programs} />
            <ProgramInsights programs={programs} />
          </div>

          <ProgramImpactOverview programs={programs} />

          <section className="pn-panel mt-8 p-6 sm:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="pn-kicker">PORTFOLIO WORKSPACE</p>
                <h2 className="pn-section-title mt-2">Explore Programs</h2>
                <p className="mt-2 text-sm text-[#607269]">
                  Search and refine the program portfolio.
                </p>
              </div>

              <div className="w-full xl:max-w-xl">
                <ProgramSearch
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </section>

          <ProgramFilters filters={filters} onChange={setFilters} />

          <ProgramTable
            programs={visiblePrograms}
            onView={setViewProgram}
            onEdit={setEditProgram}
            onDelete={setDeleteProgram}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
            <section className="pn-panel-emerald p-8 text-white">
              <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#ead8b1]">
                PORTFOLIO SUMMARY
              </p>

              <h2 className="pn-section-title mt-3 text-white">
                Creating measurable community impact
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72">
                HopeBridge programs combine responsible budgeting, clear
                ownership, measurable outcomes, and continuous performance
                monitoring to improve the communities they serve.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <SummaryItem label="Total Programs" value={programs.length.toString()} />
                <SummaryItem
                  label="Total Beneficiaries"
                  value={statistics.totalBeneficiaries.toLocaleString()}
                />
                <SummaryItem
                  label="Critical Priorities"
                  value={statistics.attention.toString()}
                />
              </div>
            </section>

            <ActivityTimeline />
          </div>
        </div>

        <CreateProgramModal
          key={isCreateOpen ? `create-${createPrefill?.name ?? "new"}` : "create-closed"}
          isOpen={isCreateOpen}
          onClose={handleCreateClose}
          onCreate={handleCreate}
          prefill={createPrefill}
        />

        <ProgramTemplatesModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          onSelect={handleTemplateSelect}
        />

        <ViewProgramModal
          isOpen={viewProgram !== null}
          program={viewProgram}
          onClose={() => setViewProgram(null)}
        />

        <EditProgramModal
          key={editProgram?.id ?? "edit-closed"}
          isOpen={editProgram !== null}
          program={editProgram}
          onClose={() => setEditProgram(null)}
          onSave={handleSave}
        />

        <DeleteProgramModal
          isOpen={deleteProgram !== null}
          program={deleteProgram}
          onClose={() => setDeleteProgram(null)}
          onConfirm={handleDelete}
        />
      </main>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wider text-white/55">{label}</p>
      <p className="mt-2 font-serif text-2xl font-bold text-[#f3e5ab]">{value}</p>
    </div>
  );
}
