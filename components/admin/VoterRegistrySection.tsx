"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CONSTITUENCIES } from "@/lib/constituencies";

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
  address: string;
  constituency: string;
  wardNo: number | string;
  wardName: string;
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

const FIELD_LABELS: Record<string, string> = {
  voterId: "Voter ID",
  name: "Name",
  dob: "DOB / பிறந்த தேதி",
  wardNo: "Ward No",
  wardName: "Ward Name",
  constituency: "Constituency",
  mobile: "Mobile",
  address: "Address",
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

  const constituencyOptions = constituencyFilterOptions;

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
      setUploadError("முதலில் கோப்பைத் தேர்ந்தெடுக்கவும்");
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
        setUploadError(data.error || "பகுப்பாய்வு தோல்வி");
        setAnalyzeResult(null);
        return;
      }

      setAnalyzeResult(data);
      setSheetName(data.sheetName);
      if (data.canImport) setShowConfirm(true);
      else setUploadError("வாக்காளர் ID புலம் கண்டறியப்படவில்லை — mapping சரிபார்க்கவும்");
    } catch (err) {
      console.error(err);
      setUploadError("இணைப்புப் பிழை. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (row: HistoryRow) => {
    const ok = window.confirm(
      `"${row.fileName}" import பதிவையும் அந்த import-ல் சேர்க்கப்பட்ட வாக்காளர் பதிவுகளையும் நீக்க விரும்புகிறீர்களா?\n\nஇந்தச் செயலை மீள முடியாது.`
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
        setUploadError(data.error || "நீக்குதல் தோல்வி");
        return;
      }

      await Promise.all([fetchStats(), fetchHistory(), fetchVoters()]);
    } catch (err) {
      console.error(err);
      setUploadError("Import நீக்குதல் — இணைப்புப் பிழை");
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
        setUploadError(data.error || "Import தோல்வி");
        return;
      }

      setImportSummary(data.summary);
      setShowConfirm(false);
      setAnalyzeResult(null);
      setSelectedFile(null);
      await Promise.all([fetchStats(), fetchHistory(), fetchVoters()]);
    } catch (err) {
      console.error(err);
      setUploadError("Import இணைப்புப் பிழை");
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
            <span>மொத்த வாக்காளர்கள்</span>
          </div>
          <div className="kpi" style={{ "--accent": "var(--ok)", "--accent-bg": "var(--ok-bg)" } as React.CSSProperties}>
            <b>{isStatsLoading ? "..." : constituencyOptions.length}</b>
            <span>தொகுதிகள் (தரவில்)</span>
          </div>
          <div className="kpi" style={{ "--accent": "var(--red)", "--accent-bg": "rgba(160,0,0,.1)" } as React.CSSProperties}>
            <b>{history[0]?.imported ?? "—"}</b>
            <span>கடைசி import (புதிய)</span>
          </div>
          <div className="kpi" style={{ "--accent": "var(--warn)", "--accent-bg": "var(--warn-bg)" } as React.CSSProperties}>
            <b>{history[0]?.updated ?? "—"}</b>
            <span>கடைசி import (புதுப்பிப்பு)</span>
          </div>
        </div>

        {/* Upload & import */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>🗳️ வாக்காளர் பதிவேடு — Excel Import</h3>
              <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                xlsx · xls · csv — பகுப்பாய்வு → preview → உறுதிப்படுத்தல் → import
              </span>
            </div>
          </div>

          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="admin-modal-field">
              <label htmlFor="voter-file">வாக்காளர் பட்டியல் கோப்பு</label>
              <input
                id="voter-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
              />
            </div>

            {analyzeResult && analyzeResult.sheetNames.length > 1 && (
              <div className="admin-modal-field">
                <label htmlFor="voter-sheet">விரிதாள் (Sheet)</label>
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
                {isAnalyzing ? "பகுப்பாய்வு..." : " கோப்பை பகுப்பாய்வு செய்"}
              </button>
              {showConfirm && analyzeResult?.canImport && (
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? "Import செய்கிறது..." : "உறுதிப்படுத்தி Import செய்"}
                </button>
              )}
            </div>

            {uploadError && <div className="admin-form-message error">⚠️ {uploadError}</div>}

            {importSummary && (
              <div className="admin-form-message success">
                Import முடிந்தது — மொத்தம்: {importSummary.totalRows} · புதிய: {importSummary.imported} ·
                புதுப்பிப்பு: {importSummary.updated} · தவிர்க்கப்பட்டது: {importSummary.skipped}
                {importSummary.durationMs ? ` · ${importSummary.durationMs}ms` : ""}
              </div>
            )}

            {analyzeResult && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  <div className="detail-modal-section">
                    <h4>கண்டறியப்பட்ட Excel புலங்கள் ({analyzeResult.headers.length})</h4>
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
                  <h4>Preview — முதல் {Math.min(10, analyzeResult.previewRows.length)} பதிவுகள் (மொத்தம் {analyzeResult.totalRows})</h4>
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
              <h3> Import வரலாறு</h3>
            </div>
          </div>
          <div className="tbl-scroll">
            <table>
              <thead>
                <tr>
                  <th>தேதி</th>
                  <th>கோப்பு</th>
                  <th style={{ textAlign: "center" }}>மொத்தம்</th>
                  <th style={{ textAlign: "center" }}>புதிய</th>
                  <th style={{ textAlign: "center" }}>புதுப்பிப்பு</th>
                  <th style={{ textAlign: "center" }}>தவிர்</th>
                  <th>Import செய்தவர்</th>
                  <th style={{ textAlign: "center" }}>நீக்கு</th>
                </tr>
              </thead>
              <tbody>
                {isHistoryLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem" }}>ஏற்றப்படுகிறது...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                      Import வரலாறு இல்லை
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h._id}>
                      <td className="t-meta">{h.importedAt ? new Date(h.importedAt).toLocaleString("ta-IN") : "—"}</td>
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
                          title="இந்த import-ஐ நீக்கு"
                        >
                          {deletingHistoryId === h._id ? "..." : "🗑️ நீக்கு"}
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
              <h3> வாக்காளர் தேடல்</h3>
              <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                Voter ID · பெயர் · மொபைல் · தொகுதி · வார்டு — {totalVoters} பதிவுகள்
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
                      placeholder="Voter ID / பெயர் / மொபைல்..."
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
                <span className="fb-label">தொகுதி</span>
                <select
                  value={filterConstituency}
                  onChange={(e) => { setFilterConstituency(e.target.value); setPage(1); }}
                  title="தொகுதி வடிகட்டி"
                >
                  <option value="அனைத்தும்">அனைத்தும்</option>
                  {constituencyFilterOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="complaints-filter-item">
                <span className="fb-label">வார்டு</span>
                <input
                  type="text"
                  placeholder="வார்டு எண்"
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
                  <th>பெயர்</th>
                  <th>பிறந்த தேதி</th>
                  <th>கதவு எண்</th>
                  <th>மொபைல்</th>
                  <th>தொகுதி</th>
                  <th>வார்டு</th>
                  <th>வார்டு பெயர்</th>
                  <th>முகவரி</th>
                </tr>
              </thead>
              <tbody>
                {isVotersLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2rem" }}>ஏற்றப்படுகிறது...</td>
                  </tr>
                ) : voters.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                      பதிவுகள் இல்லை
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
                      <td className="t-meta">{v.constituency || "—"}</td>
                      <td className="t-meta">{v.wardNo ?? "—"}</td>
                      <td className="t-meta">{v.wardName || "—"}</td>
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
                ? `${pageStart}–${pageEnd} / ${totalVoters} பதிவுகள்`
                : "0 பதிவுகள்"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>
                <span>ஒரு பக்கம்</span>
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
              <span style={{ fontWeight: 700 }}>பக்கம் {page} / {totalPages}</span>
              <button type="button" className="tfilt" disabled={page <= 1} onClick={() => setPage(1)}>« முதல்</button>
              <button type="button" className="tfilt" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← முந்தைய</button>
              <button type="button" className="tfilt" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>அடுத்த →</button>
              <button type="button" className="tfilt" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>கடைசி »</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
