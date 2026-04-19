"use client";

import { useEffect, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
type StudentResult = {
  roll_number: string;
  name: string;
  obtained: number;
  max: number;
  percentage: number;
  grade: string;
  questions_graded: number;
};

type Analytics = {
  avg_score: number;
  max_marks: number;
  grade_distribution: Record<string, number>;
  total_students: number;
};

type QuestionDetail = {
  question_number: number;
  marks_awarded: number;
  total_marks: number;
  grade?: string;
  feedback?: string;
  extracted_ocr_text?: string;
  model_answer?: string;
  similarity_score?: number | null;
};

type TeacherExam = {
  _id: string | number;
  exam_name?: string;
  subject?: string;
  student_count?: number;
  pending_count?: number;
  q_count?: number;
  results_published?: boolean;
};

// ─── Grade Badge ─────────────────────────────────────────────────────────────
function GradeBadge({ grade }: { grade: string }) {
  const colours: Record<string, string> = {
    A: "bg-green-500/20 text-green-400 ring-green-500/30",
    B: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
    C: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30",
    D: "bg-orange-500/20 text-orange-400 ring-orange-500/30",
    F: "bg-red-500/20 text-red-400 ring-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ring-1 ${colours[grade] ?? colours.F}`}
    >
      {grade}
    </span>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ pct }: { pct: number }) {
  const colour =
    pct >= 90 ? "bg-green-500" : pct >= 75 ? "bg-blue-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
      <div className={`h-full ${colour} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResultsDashboardPage() {
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [examId, setExamId] = useState("");
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingExams, setLoadingExams] = useState(true);

  // Audit drawer
  const [selected, setSelected] = useState<StudentResult | null>(null);
  const [details, setDetails] = useState<QuestionDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Override form
  const [overrideQ, setOverrideQ] = useState<number | null>(null);
  const [overrideMarks, setOverrideMarks] = useState("");
  const [overriding, setOverriding] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetchExamsAndPrefill();
  }, []);

  async function fetchExamsAndPrefill() {
    setLoadingExams(true);
    try {
      const res = await fetch("/api/gradeai/teacher/active-exams");
      if (!res.ok) throw new Error("Failed to load your exams");
      const data = await res.json();
      const loadedExams = Array.isArray(data.exams) ? data.exams : [];
      setExams(loadedExams);

      if (loadedExams.length === 0) {
        setExamId("");
        return;
      }

      const withResults = loadedExams.find((e: TeacherExam) => (e.student_count ?? 0) > 0);
      const defaultExam = withResults ?? loadedExams[0];
      const defaultExamId = String(defaultExam._id);
      setExamId(defaultExamId);
      await fetchResults(defaultExamId);
    } catch (e: any) {
      setError(e.message || "Failed to load exams");
    } finally {
      setLoadingExams(false);
    }
  }

  async function fetchResults(targetExamId?: string) {
    const resolvedExamId = (targetExamId ?? examId).trim();
    if (!resolvedExamId) return;
    setLoading(true);
    setError(null);
    setStudents([]);
    setAnalytics(null);
    setSelected(null);

    try {
      const res = await fetch(`/api/gradeai/teacher/get-results/${resolvedExamId}`);
      if (!res.ok) throw new Error("Failed to load results");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudents(data.students ?? []);
      setAnalytics(data.analytics ?? null);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const selectedExamMeta = exams.find((e) => String(e._id) === examId.trim());

  async function openAudit(student: StudentResult) {
    setSelected(student);
    setDetails([]);
    setDetailsLoading(true);
    setOverrideQ(null);
    setOverrideMsg(null);

    try {
      const res = await fetch(
        `/api/gradeai/teacher/get-student-details/${examId.trim()}/${student.roll_number}`
      );
      if (!res.ok) throw new Error("Failed to load student details");
      const data = await res.json();
      setDetails(data.details ?? []);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function submitOverride(detail: QuestionDetail) {
    if (!selected || !overrideMarks) return;
    setOverriding(true);
    setOverrideMsg(null);

    const fd = new FormData();
    fd.append("exam_id", examId.trim());
    fd.append("roll_number", selected.roll_number);
    fd.append("question_number", String(detail.question_number));
    fd.append("marks_awarded", overrideMarks);

    try {
      const res = await fetch("/api/gradeai/teacher/update-marks", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Override failed");
      setOverrideMsg(`Q${detail.question_number} updated to ${overrideMarks}/${detail.total_marks} marks.`);
      // Refresh detail in-place
      setDetails((d) =>
        d.map((q) =>
          q.question_number === detail.question_number
            ? { ...q, marks_awarded: parseFloat(overrideMarks) }
            : q
        )
      );
      setOverrideQ(null);
    } catch (e: any) {
      setOverrideMsg("Error: " + (e.message || "Override failed"));
    } finally {
      setOverriding(false);
    }
  }

  async function publishResults() {
    const resolvedExamId = examId.trim();
    if (!resolvedExamId) return;

    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await fetch(`/api/gradeai/teacher/publish-results/${resolvedExamId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish results");

      setExams((prev) =>
        prev.map((exam) =>
          String(exam._id) === resolvedExamId
            ? { ...exam, results_published: true }
            : exam
        )
      );
      setPublishMsg("Results published. Students can now view this exam.");
    } catch (e: any) {
      setPublishMsg(e.message || "Could not publish results");
    } finally {
      setPublishing(false);
    }
  }

  const gradeColours: Record<string, string> = {
    A: "text-green-400",
    B: "text-blue-400",
    C: "text-yellow-400",
    D: "text-orange-400",
    F: "text-red-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Results Dashboard</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mt-2">
          Verification & Manual Override Centre
        </p>
      </header>

      {/* Exam ID Lookup */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] p-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Exam
          </label>
          {loadingExams ? (
            <div className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface-variant animate-pulse">
              Loading exams...
            </div>
          ) : exams.length > 0 ? (
            <select
              value={examId}
              onChange={(e) => {
                const nextExamId = e.target.value;
                setExamId(nextExamId);
                void fetchResults(nextExamId);
              }}
              className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
            >
              {exams.map((exam) => (
                <option key={String(exam._id)} value={String(exam._id)}>
                  {String(exam._id)} - {exam.exam_name || exam.subject || "Untitled Exam"}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface-variant">
              No exams found for your account.
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Exam ID
          </label>
          <input
            type="text"
            placeholder="Optional manual exam id"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void fetchResults()}
            className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => void fetchResults()}
          disabled={loading || !examId}
          className="bg-primary text-on-primary px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2 hover:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base">search</span>
          {loading ? "Loading..." : "Fetch Results"}
        </button>
      </div>

      {selectedExamMeta && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            <span className="px-2 py-1 rounded bg-surface-container">Questions: {selectedExamMeta.q_count ?? 0}</span>
            <span className="px-2 py-1 rounded bg-surface-container">Graded Students: {selectedExamMeta.student_count ?? 0}</span>
            <span className="px-2 py-1 rounded bg-surface-container">Pending Queue: {selectedExamMeta.pending_count ?? 0}</span>
            <span className="px-2 py-1 rounded bg-surface-container">
              Status: {selectedExamMeta.results_published ? "Published" : "Not Published"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void publishResults()}
              disabled={publishing || !examId || !!selectedExamMeta.results_published}
              className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              {publishing ? "Publishing..." : selectedExamMeta.results_published ? "Published" : "Publish Results"}
            </button>
            {publishMsg && (
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{publishMsg}</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      {!loading && !error && examId.trim() && students.length === 0 && (
        <div className="p-4 rounded-xl bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          No graded rows yet for exam {examId.trim()}. If uploads were just submitted, wait a few seconds and fetch again.
        </div>
      )}

      {/* Analytics Strip */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Students", value: analytics.total_students, icon: "group" },
            { label: "Avg Score", value: `${analytics.avg_score} / ${analytics.max_marks}`, icon: "bar_chart" },
            { label: "Pass Rate", value: `${Math.round((Object.entries(analytics.grade_distribution).filter(([g]) => g !== "F").reduce((s, [, v]) => s + v, 0) / analytics.total_students) * 100) || 0}%`, icon: "check_circle" },
            { label: "Max Marks", value: analytics.max_marks, icon: "stars" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-container border border-outline-variant/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">{stat.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                <p className="text-xl font-black text-on-surface">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade Distribution */}
      {analytics && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">Grade Distribution</p>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(analytics.grade_distribution).map(([g, count]) => (
              <div key={g} className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl">
                <GradeBadge grade={g} />
                <span className="text-sm font-black text-on-surface">{count}</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">students</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Table + Audit Drawer */}
      {students.length > 0 && (
        <div className="flex gap-6">
          {/* Table */}
          <div className={`bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] overflow-hidden ${selected ? "flex-1" : "w-full"}`}>
            <div className="p-6 border-b border-outline-variant/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {students.length} Graded Students
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    {["Roll No", "Name", "Score", "Percentage", "Grade", ""].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.roll_number}
                      onClick={() => openAudit(s)}
                      className={`border-b border-outline-variant/10 cursor-pointer transition-colors hover:bg-primary/5 ${selected?.roll_number === s.roll_number ? "bg-primary/10" : ""}`}
                    >
                      <td className="px-6 py-4 text-xs font-black uppercase text-on-surface">{s.roll_number}</td>
                      <td className="px-6 py-4 text-sm font-medium text-on-surface">{s.name || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-on-surface">{s.obtained}/{s.max}</p>
                          <ScoreBar pct={s.percentage} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface">{s.percentage}%</td>
                      <td className="px-6 py-4"><GradeBadge grade={s.grade} /></td>
                      <td className="px-6 py-4">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">chevron_right</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Drawer */}
          {selected && (
            <div className="w-[420px] shrink-0 bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] overflow-hidden flex flex-col">
              {/* Drawer header */}
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Student Audit</p>
                  <h3 className="text-xl font-black uppercase mt-1">{selected.roll_number}</h3>
                  <p className="text-sm text-on-surface-variant font-medium">{selected.name}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Score summary */}
              <div className="px-6 py-4 flex gap-4 border-b border-outline-variant/10">
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Total</p>
                  <p className="text-2xl font-black text-on-surface">{selected.obtained}/{selected.max}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Grade</p>
                  <p className={`text-2xl font-black ${gradeColours[selected.grade] ?? "text-on-surface"}`}>{selected.grade}</p>
                </div>
              </div>

              {overrideMsg && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-widest">
                  {overrideMsg}
                </div>
              )}

              {/* Per-question breakdown */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {detailsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-28 rounded-xl bg-surface-variant/20 animate-pulse" />
                    ))}
                  </div>
                ) : details.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-8">No question data available.</p>
                ) : (
                  details.map((d) => (
                    <div key={d.question_number} className="border border-outline-variant/20 rounded-2xl overflow-hidden">
                      {/* Q header */}
                      <div className="bg-surface-container px-4 py-3 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-on-surface">
                          Question {d.question_number}
                        </span>
                        <div className="flex items-center gap-2">
                          {d.grade && <GradeBadge grade={d.grade} />}
                          <span className="text-xs font-black text-on-surface">
                            {d.marks_awarded}/{d.total_marks}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Model Answer */}
                        {d.model_answer && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Model Answer</p>
                            <p className="text-xs text-on-surface leading-relaxed bg-primary/5 rounded-lg p-2">{d.model_answer}</p>
                          </div>
                        )}

                        {/* OCR Text */}
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">OCR Extracted Text</p>
                          <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-variant/30 rounded-lg p-2 font-mono">{d.extracted_ocr_text || "[OCR_UNREADABLE] No readable text extracted from image."}</p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Semantic Similarity</p>
                          <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-variant/20 rounded-lg p-2 font-mono">
                            {typeof d.similarity_score === "number" ? `${d.similarity_score}%` : "N/A"}
                          </p>
                        </div>

                        {/* AI Feedback */}
                        {d.feedback && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">AI Feedback</p>
                            <p className="text-xs text-on-surface-variant italic leading-relaxed">{d.feedback}</p>
                          </div>
                        )}

                        {/* Manual Override */}
                        {overrideQ === d.question_number ? (
                          <div className="flex gap-2 items-center pt-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={d.total_marks}
                              value={overrideMarks}
                              onChange={(e) => setOverrideMarks(e.target.value)}
                              className="flex-1 bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                              placeholder={`Max ${d.total_marks}`}
                            />
                            <button
                              onClick={() => submitOverride(d)}
                              disabled={overriding}
                              className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-50"
                            >
                              {overriding ? "..." : "Save"}
                            </button>
                            <button
                              onClick={() => setOverrideQ(null)}
                              className="text-on-surface-variant hover:text-on-surface transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setOverrideQ(d.question_number); setOverrideMarks(String(d.marks_awarded)); setOverrideMsg(null); }}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors pt-1"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            Override Marks
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
