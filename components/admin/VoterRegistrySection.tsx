"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CONSTITUENCIES } from "@/lib/constituencies";
import { useLanguage } from "@/components/LanguageProvider";

type AnalyzeResponse = {
  fileName: string;
  sheetNames: string[];
  sheetName: string;
  headers: string[];
  mapping: Record<string, string>;
  mappingDisplay: Array<{ field: string; label: string; column: string | null }>;
  previewRows: Record<string, unknown>[];
  totalRows: number;
  missingRequired: string[];
  canImport: boolean;
};

type ImportSummary = {
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  skipReasons?: Record<string, number>;
  durationMs?: number;
  fileName?: string;
  sheetName?: string;
};

type VoterRow = {
  voterId: string;
  name: string;
  dob: string;
  doorNo?: string;
  mobile: string;
  gender: string;
  age: string;
  address: string;
  constituency: string;
  wardNo: number | string;
  wardName: string;
  panchayat: string;
  taluk: string;
  district: string;
};

type HistoryRow = {
  _id: string;
  fileName: string;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  importedBy: string;
  importedAt: string;
  sheetName?: string;
};

type StatsResponse = {
  totalVoters: number;
  byConstituency: Array<{ constituency: string; count: number }>;
  lastImport: ImportSummary | null;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export default function VoterRegistrySection() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterConstituency, setFilterConstituency] = useState("அனைத்தும்");
  const [filterWard, setFilterWard] = useState("");
  const [voters, setVoters] = useState<VoterRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  const [isVotersLoading, setIsVotersLoading] = useState(false);
  const { lang, t } = useLanguage();

  const FIELD_LABELS: Record<string, string> = {
    voterId: "Voter ID",
    name: t("home.form.citizen.name"),
    dob: t("home.form.citizen.dob"),
    wardNo: t("common.ward"),
    wardName: t("home.receipt.ward"),
    constituency: t("common.constituency"),
    mobile: t("common.mobile"),
    address: t("complaints.modal.address"),
  };

  const constituencyFilterOptions = useMemo(() => {
    const fromData = stats?.byConstituency?.map((c) => c.constituency).filter(Boolean) || [];
    return [...new Set([...CONSTITUENCIES, ...fromData])];
  }, [stats]);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const res = await fetch("/api/admin/voters/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/voters/history?limit=15");
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const fetchVoters = useCallback(async () => {
    setIsVotersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search,
        constituency: filterConstituency,
        ward: filterWard,
      });
      const res = await fetch(`/api/admin/voters?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVoters(data.voters);
        setTotalPages(data.pagination.totalPages);
        setTotalVoters(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVotersLoading(false);
    }
  }, [page, pageSize, search, filterConstituency, filterWard]);

  const pageStart = totalVoters === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalVoters);

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [fetchStats, fetchHistory]);

  useEffect(() => {
    fetchVoters();
  }, [fetchVoters]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setAnalyzeResult(null);
    setImportSummary(null);
    setShowConfirm(false);
    setUploadError("");
    setSheetName("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setUploadError(t("voters.import.err_select"));
      return;
    }

    setIsAnalyzing(true);
    setUploadError("");
    setImportSummary(null);
    setShowConfirm(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (sheetName) formData.append("sheetName", sheetName);

      const res = await fetch("/api/admin/voters/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || t("voters.import.err_fail"));
        setAnalyzeResult(null);
        return;
      }

      setAnalyzeResult(data);
      setSheetName(data.sheetName);
      if (data.canImport) setShowConfirm(true);
      else setUploadError(t("voters.import.err_no_voter_id"));
    } catch (err) {
      console.error(err);
      setUploadError(t("track.conn_error"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (row: HistoryRow) => {
    const ok = window.confirm(
      t("voters.history.confirm_delete", { file: row.fileName })
    );
    if (!ok) return;

    setDeletingHistoryId(row._id);
    setUploadError("");

    try {
      const res = await fetch("/api/admin/voters/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row._id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || t("common.error"));
        return;
      }

      await Promise.all([fetchStats(), fetchHistory(), fetchVoters()]);
    } catch (err) {
      console.error(err);
      setUploadError(t("track.conn_error"));
    } finally {
      setDeletingHistoryId(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !analyzeResult?.canImport) return;

    setIsImporting(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sheetName", analyzeResult.sheetName);
      formData.append("mapping", JSON.stringify(analyzeResult.mapping));

      const res = await fetch("/api/admin/voters/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || t("common.error"));
        return;
      }

      setImportSummary(data.summary);
      setShowConfirm(false);
      setAnalyzeResult(null);
      setSelectedFile(null);
      await Promise.all([fetchStats(), fetchHistory(), fetchVoters()]);
    } catch (err) {
      console.error(err);
      setUploadError(t("track.conn_error"));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="section admin-dashboard" style={{ paddingTop: 0 }} id="voter-registry">
      <div className="wrap flex flex-col gap-8">
        {/* KPI summary */}
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <div className="kpi" style={{ "--accent": "var(--gold)", "--accent-bg": "rgba(254,203,2,.12)" } as React.CSSProperties}>
            <b>{isStatsLoading ? "..." : stats?.totalVoters ?? 0}</b>
            <span>{t("voters.kpi.total")}</span>
          </div>
          <div className="kpi" style={{ "--accent": "var(--ok)", "--accent-bg": "var(--ok-bg)" } as React.CSSProperties}>
            <b>{isStatsLoading ? "..." : constituencyFilterOptions.length}</b>
            <span>{t("voters.kpi.constituencies")}</span>
          </div>
          <div className="kpi" style={{ "--accent": "var(--red)", "--accent-bg": "rgba(160,0,0,.1)" } as React.CSSProperties}>
            <b>{history[0]?.imported ?? "—"}</b>
            <span>{t("voters.kpi.imported")}</span>
          </div>
          <div className="kpi" style={{ "--accent": "var(--warn)", "--accent-bg": "var(--warn-bg)" } as React.CSSProperties}>
            <b>{history[0]?.updated ?? "—"}</b>
            <span>{t("voters.kpi.updated")}</span>
          </div>
        </div>

        {/* Upload & import */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>{t("voters.import.title")}</h3>
              <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                {t("voters.import.subtitle")}
              </span>
            </div>
          </div>

          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="admin-modal-field">
              <label htmlFor="voter-file">{t("voters.import.file_lbl")}</label>
              <input
                id="voter-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
              />
            </div>

            {analyzeResult && analyzeResult.sheetNames.length > 1 && (
              <div className="admin-modal-field">
                <label htmlFor="voter-sheet">{t("voters.import.sheet_lbl")}</label>
                <select
                  id="voter-sheet"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                >
                  {analyzeResult.sheetNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <button
                type="button"
                className="tb-back"
                style={{ color: "#4A080E", background: "#FECB02", fontWeight: 900, border: "none", cursor: "pointer" }}
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
              >
                {isAnalyzing ? t("voters.import.btn_analyzing") : t("voters.import.btn_analyze")}
              </button>
              {showConfirm && analyzeResult?.canImport && (
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? t("voters.import.btn_importing") : t("voters.import.btn_confirm")}
                </button>
              )}
            </div>

            {uploadError && <div className="admin-form-message error"> {uploadError}</div>}

            {importSummary && (
              <div className="admin-form-message success">
                {t("voters.import.msg_success", {
                  total: String(importSummary.totalRows),
                  imported: String(importSummary.imported),
                  updated: String(importSummary.updated),
                  skipped: String(importSummary.skipped)
                })}
              </div>
            )}

            {analyzeResult && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  <div className="detail-modal-section">
                    <h4>{t("voters.import.detected_fields", { count: String(analyzeResult.headers.length) })}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 0 }}>
                      {analyzeResult.headers.join(" · ")}
                    </p>
                  </div>
                  <div className="detail-modal-section">
                    <h4>Mapping</h4>
                    <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                      {analyzeResult.mappingDisplay.map((m) => (
                        <li key={m.field}>
                          <b>{m.label || FIELD_LABELS[m.field] || m.field}</b>
                          {" → "}
                          {m.column ? <span>{m.column}</span> : <span style={{ color: "var(--warn)" }}>—</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="detail-modal-section">
                  <h4>{t("voters.import.preview_title", { count: String(Math.min(10, analyzeResult.previewRows.length)), total: String(analyzeResult.totalRows) })}</h4>
                  <div className="tbl-scroll">
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(FIELD_LABELS).map((key) => (
                            <th key={key}>{FIELD_LABELS[key]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyzeResult.previewRows.map((row, idx) => (
                          <tr key={idx}>
                            {Object.keys(FIELD_LABELS).map((key) => (
                              <td key={key}>{String(row[key] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Import history */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>{t("voters.history.title")}</h3>
            </div>
          </div>
          <div className="tbl-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("common.date")}</th>
                  <th>{t("voters.import.file_lbl")}</th>
                  <th style={{ textAlign: "center" }}>{t("admin.overview.total")}</th>
                  <th style={{ textAlign: "center" }}>{t("status.registered")}</th>
                  <th style={{ textAlign: "center" }}>{t("common.edit")}</th>
                  <th style={{ textAlign: "center" }}>{t("common.cancel")}</th>
                  <th>Imported By</th>
                  <th style={{ textAlign: "center" }}>{t("common.delete")}</th>
                </tr>
              </thead>
              <tbody>
                {isHistoryLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem" }}>{t("common.loading")}</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                      {t("voters.history.empty")}
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h._id}>
                      <td className="t-meta">{h.importedAt ? new Date(h.importedAt).toLocaleString(lang === "ta" ? "ta-IN" : "en-IN") : "—"}</td>
                      <td style={{ fontWeight: 700 }}>{h.fileName}</td>
                      <td style={{ textAlign: "center" }}>{h.totalRows}</td>
                      <td style={{ textAlign: "center", color: "var(--ok)", fontWeight: 700 }}>{h.imported}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{h.updated}</td>
                      <td style={{ textAlign: "center", color: "var(--warn)", fontWeight: 700 }}>{h.skipped}</td>
                      <td>@{h.importedBy}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="admin-modal-cancel"
                          style={{ flex: "none", padding: "0.35rem 0.65rem", fontSize: "0.8rem", minWidth: 0 }}
                          disabled={deletingHistoryId === h._id}
                          onClick={() => handleDeleteHistory(h)}
                          title="Delete this import"
                        >
                          {deletingHistoryId === h._id ? "..." : t("common.delete")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voter search */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>{t("voters.search.title")}</h3>
              <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                {t("voters.search.subtitle", { count: String(totalVoters) })}
              </span>
            </div>
          </div>

          <div style={{ padding: "1rem 1.5rem" }}>
            <div className="complaints-filter-controls">
              <div className="complaints-filter-search">
                <div className="fb-search">
                  <div className="fb-search-input-wrapper">
                    <input
                      type="text"
                      placeholder={t("voters.search.placeholder")}
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.9rem",
                        borderRadius: "999px",
                        border: "1.5px solid var(--line)",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="complaints-filter-item">
                <span className="fb-label">{t("voters.search.constituency")}</span>
                <select
                  value={filterConstituency}
                  onChange={(e) => { setFilterConstituency(e.target.value); setPage(1); }}
                  title="Constituency filter"
                >
                  <option value="அனைத்தும்">{t("status.all")}</option>
                  {constituencyFilterOptions.map((c) => (
                    <option key={c} value={c}>{t(c)}</option>
                  ))}
                </select>
              </div>
              <div className="complaints-filter-item">
                <span className="fb-label">{t("voters.search.ward")}</span>
                <input
                  type="text"
                  placeholder="Ward No"
                  value={filterWard}
                  onChange={(e) => { setFilterWard(e.target.value); setPage(1); }}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--line)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="tbl-scroll">
            <table>
              <thead>
                <tr>
                  <th>Voter ID</th>
                  <th>{t("home.form.citizen.name")}</th>
                  <th>{t("home.form.citizen.dob")}</th>
                  <th>{t("home.form.citizen.door")}</th>
                  <th>{t("common.mobile")}</th>
                  <th>{t("home.form.citizen.gender")}</th>
                  <th>{t("home.form.citizen.age")}</th>
                  <th>{t("voters.search.constituency")}</th>
                  <th>{t("voters.search.ward")}</th>
                  <th>Ward Name</th>
                  <th>Panchayat</th>
                  <th>Taluk</th>
                  <th>District</th>
                  <th>{t("complaints.modal.address")}</th>
                </tr>
              </thead>
              <tbody>
                {isVotersLoading ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: "center", padding: "2rem" }}>{t("common.loading")}</td>
                  </tr>
                ) : voters.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                      {t("voters.search.empty")}
                    </td>
                  </tr>
                ) : (
                  voters.map((v) => (
                    <tr key={v.voterId}>
                      <td className="t-id">{v.voterId}</td>
                      <td style={{ fontWeight: 700 }}>{v.name || "—"}</td>
                      <td className="t-meta">{v.dob || "—"}</td>
                      <td className="t-meta">{v.doorNo || "—"}</td>
                      <td className="t-meta">{v.mobile || "—"}</td>
                      <td className="t-meta">{v.gender || "—"}</td>
                      <td className="t-meta" style={{ textAlign: "center" }}>{v.age || "—"}</td>
                      <td className="t-meta">{t(v.constituency) || "—"}</td>
                      <td className="t-meta" style={{ textAlign: "center" }}>{v.wardNo ?? "—"}</td>
                      <td className="t-meta">{v.wardName || "—"}</td>
                      <td className="t-meta">{v.panchayat || "—"}</td>
                      <td className="t-meta">{v.taluk || "—"}</td>
                      <td className="t-meta">{v.district || "—"}</td>
                      <td style={{ maxWidth: 220, fontSize: "0.82rem" }}>{v.address || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="tbl-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <span>
              {totalVoters > 0
                ? t("voters.search.records_range", { start: String(pageStart), end: String(pageEnd), total: String(totalVoters) })
                : t("voters.search.empty")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>
                <span>{t("voters.search.page_size")}</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ padding: "0.35rem 0.5rem", borderRadius: "0.4rem", border: "1px solid var(--line)" }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
              <span style={{ fontWeight: 700 }}>Page {page} / {totalPages}</span>
              <button type="button" className="tfilt" disabled={page <= 1} onClick={() => setPage(1)}>{t("voters.search.first")}</button>
              <button type="button" className="tfilt" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("voters.search.prev")}</button>
              <button type="button" className="tfilt" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t("voters.search.next")}</button>
              <button type="button" className="tfilt" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>{t("voters.search.last")}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
