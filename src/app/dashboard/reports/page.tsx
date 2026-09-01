"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Download,
  FileBarChart,
  Home,
  Loader2,
  RefreshCw,
} from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  buildOrganizationReport,
  downloadCsv,
  type OrganizationReport,
} from "@/services/reportsData";
import "../module-pages.css";

export default function ReportsPage() {
  const [report, setReport] = useState<OrganizationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError("");
      try {
        const next = await buildOrganizationReport();
        if (!cancelled) setReport(next);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("Unable to load report data. Check your connection and try again.");
          setReport(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  function handleExport() {
    if (!report) return;
    const stamp = new Date(report.generatedAt).toISOString().slice(0, 10);
    downloadCsv(`hopebridge-report-${stamp}.csv`, report.csvRows);
  }

  return (
    <div className="hb-app op-page">
      <HopeBridgeSidebar activePath="/dashboard/reports" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
          <nav className="flex items-center gap-2 text-sm text-[#607269]">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">Reports</strong>
          </nav>

          <header className="op-hero">
            <p className="op-kicker">REPORTING</p>
            <h1>Organizational Reports</h1>
            <p>
              Summaries below are generated from your connected HopeBridge records —
              campaigns, programs, donors, volunteers, beneficiaries, and teams.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="op-btn op-btn-gold"
                onClick={handleExport}
                disabled={!report || loading}
              >
                <Download size={15} />
                Export CSV
              </button>
              <button
                type="button"
                className="op-btn op-btn-secondary"
                onClick={() => setRefreshToken((value) => value + 1)}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
                Refresh report
              </button>
              <Link href="/dashboard/analytics" className="op-btn op-btn-secondary">
                <FileBarChart size={15} />
                Open Impact Analytics
              </Link>
            </div>
          </header>

          {error ? <div className="op-error" role="alert">{error}</div> : null}

          {loading && !report ? (
            <div className="op-panel flex items-center gap-2 text-sm text-[#607269]">
              <Loader2 size={16} className="animate-spin text-[#0d5f44]" />
              Building report from live organizational data…
            </div>
          ) : null}

          {report ? (
            <>
              <p className="text-xs text-[#929d97]">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </p>
              <div className="grid gap-5 lg:grid-cols-2">
                {report.sections.map((section) => (
                  <section key={section.id} className="op-panel">
                    <h2>{section.title}</h2>
                    <ul className="mt-4 list-disc space-y-2 pl-5">
                      {section.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          ) : !loading && !error ? (
            <div className="op-empty">
              No report data is available yet. Add campaigns, programs, or donor records to
              populate executive summaries.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
