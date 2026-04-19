"use client";

import { useEffect, useState } from "react";

export default function StudentMidtermResultsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [emptyStateMessage, setEmptyStateMessage] = useState(
    "There are currently no digitized exam records active for your profile."
  );
  const [resultsMessage, setResultsMessage] = useState("");

  useEffect(() => {
    // 1. Fetch profile
    fetch("/api/auth/student-me")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) throw new Error("No profile");
        const student = data.student ?? data;
        setProfile(student);
        // 2. Fetch active exams for this roll using proxy
        return fetch(`/api/gradeai/student/active-exams/${student.rollNumber}`);
      })
      .then(res => res.ok ? res.json() : { exams: [] })
      .then(data => {
        const allExams = Array.isArray(data.exams) ? data.exams : [];
        const publishedExams = allExams.filter((ex: any) => Boolean(ex?.results_published));

        setExams(publishedExams);
        setResults(null);
        setResultsMessage("");

        if (publishedExams.length > 0) {
          setSelectedExamId(String(publishedExams[0]._id));
          return;
        }

        setSelectedExamId("");
        if (allExams.length > 0) {
          setEmptyStateMessage("Results are not published yet for your active exams.");
        } else {
          setEmptyStateMessage("There are currently no digitized exam records active for your profile.");
        }
      })
      .catch(err => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedExamId || !profile?.rollNumber) return;

    // Fetch results for the selected exam
    setLoadingResults(true);
    setResults(null);
    setResultsMessage("");

    fetch(`/api/gradeai/student/results/${selectedExamId}/${profile.rollNumber}`)
      .then(async (res) => {
        if (res.ok) {
          return res.json();
        }

        if (res.status === 403) {
          setResultsMessage("Results are not published for this exam yet.");
          return null;
        }

        if (res.status === 404) {
          setResultsMessage("No graded result is available for your roll number yet.");
          return null;
        }

        setResultsMessage("Unable to load results right now. Please try again.");
        return null;
      })
      .then(data => setResults(data))
      .catch(err => {
        console.error("Error fetching results", err);
        setResultsMessage("Unable to load results right now. Please try again.");
      })
      .finally(() => setLoadingResults(false));
  }, [selectedExamId, profile]);

  if (loading) {
    return <div className="p-10 animate-pulse bg-surface-variant/20 rounded-[2rem] h-64"></div>;
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Midterm Results</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mt-2 border-b border-outline-variant/20 pb-4 inline-block">
          GradeAI Automated Assessment
        </p>
      </header>

      {exams.length === 0 ? (
         <div className="p-12 text-center border-2 border-dashed border-outline-variant/40 rounded-[2rem]">
            <span className="material-symbols-outlined text-[4rem] text-on-surface-variant/30 mb-4">scan_delete</span>
            <h3 className="text-xl font-black uppercase text-on-surface">No Records Found</h3>
          <p className="text-sm text-on-surface-variant max-w-sm mx-auto font-medium">{emptyStateMessage}</p>
         </div>
      ) : (
         <div className="space-y-8">
            <div className="flex gap-2 overflow-x-auto pb-4">
               {exams.map(ex => (
                 <button
                   key={ex._id}
                   onClick={() => setSelectedExamId(ex._id)}
                   className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                     selectedExamId === ex._id
                       ? "bg-on-surface text-surface architectural-shadow"
                       : "bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant"
                   }`}
                 >
                   {ex.exam_name || `Exam ${ex._id}`}
                 </button>
               ))}
            </div>

            {loadingResults ? (
               <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem]">
                 <span className="material-symbols-outlined text-[3rem] text-on-surface-variant/40 mb-4 animate-spin">sync</span>
                 <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Synchronizing LEDGER...</p>
               </div>
            ) : results ? (
              <div className="space-y-6">
                <div className="bg-surface-container border border-outline-variant/30 rounded-[2rem] p-8 md:p-12 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10">
                   <div>
                      <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-2">Final Score</h3>
                      <div className="text-7xl font-black tracking-tighter text-on-surface">
                        {results.total_marks || 0}
                        <span className="text-3xl text-on-surface-variant ml-2">/ {results.total_possible || 0}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant px-2">Detailed Response Ledger</h4>
                   {(results.questions || []).map((q: any, i: number) => (
                      <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 flex flex-col md:flex-row gap-8">
                         <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                               <div className="w-10 h-10 bg-surface-variant text-on-surface font-black rounded-lg flex items-center justify-center">Q{q.question_number}</div>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Response Pattern</span>
                            </div>
                            <p className="text-sm font-medium text-on-surface-variant italic leading-relaxed border-l-2 border-primary/20 pl-4">{q.feedback || "No feedback generated"}</p>
                         </div>
                         <div className="w-full md:w-48 bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center border border-outline-variant/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Score Awarded</span>
                            <div className={`text-4xl font-black tracking-tight ${q.marks_awarded > 0 ? "text-primary" : "text-error"}`}>
                              {q.marks_awarded}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            ) : (
                <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem]">
                 <span className="material-symbols-outlined text-[3rem] text-on-surface-variant/40 mb-4">hourglass_empty</span>
                 <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  {resultsMessage || "No result record found for this exam yet."}
                 </p>
                </div>
            )}
         </div>
      )}
    </div>
  );
}
