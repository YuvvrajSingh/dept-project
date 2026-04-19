"use client";

import { useEffect, useState } from "react";

type ActiveExam = {
  _id: string | number;
  exam_name?: string;
  subject: string;
  class_section: string;
  created_at?: string;
  total_marks?: number;
  year?: string;
  branch?: string;
  q_count?: number;
};

export default function TeacherMidtermPage() {
  const [activeExams, setActiveExams] = useState<ActiveExam[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Mode state
  const [isCreating, setIsCreating] = useState(false);
  const [setupPhase, setSetupPhase] = useState<"init" | "questions">("init");
  const [createdExamId, setCreatedExamId] = useState<number | null>(null);

  // Phase 1 Form
  const [examName, setExamName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [semester, setSemester] = useState("1");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [year, setYear] = useState("1");

  // Dropdown data
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Phase 2 Form
  const [qNumber, setQNumber] = useState(1);
  const [qMarks, setQMarks] = useState(10);
  const [qText, setQText] = useState("");
  const [qModelAnswer, setQModelAnswer] = useState("");
  const [qDiagram, setQDiagram] = useState<File | null>(null);
  const [addedQuestions, setAddedQuestions] = useState<any[]>([]);

  const [creating, setCreating] = useState(false);

  // Assembly Line
  const [selectedExam, setSelectedExam] = useState<ActiveExam | null>(null);
  const [rollNumber, setRollNumber] = useState("");
  const [questionNumbers, setQuestionNumbers] = useState<number[]>([1]);
  const [questionUploads, setQuestionUploads] = useState<Record<number, File[]>>({ 1: [] });
  const [uploading, setUploading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function parsePositiveIntOrFallback(raw: string, fallback: number) {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function resetAssemblyForm(exam: ActiveExam | null = selectedExam) {
    setRollNumber("");

    const parsedCount = Number(exam?.q_count ?? 0);
    const questionCount = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
    const slots = Array.from({ length: questionCount }, (_, i) => i + 1);
    setQuestionNumbers(slots);
    setQuestionUploads(Object.fromEntries(slots.map((q) => [q, []])));
  }

  function handleQuestionFilesChange(questionNumber: number, files: FileList | null) {
    setQuestionUploads((prev) => ({
      ...prev,
      [questionNumber]: files ? Array.from(files) : [],
    }));
  }

  useEffect(() => {
    fetchExams();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (branchId && semester) fetchSubjects(branchId, semester);
  }, [branchId, semester]);

  async function fetchBranches() {
    try {
      const res = await fetch("/api/public/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        if (data.length > 0) {
          setBranchId(data[0].id);
          setBranchName(data[0].name);
        }
      }
    } catch {}
  }

  async function fetchSubjects(bId: string, sem: string) {
    setLoadingSubjects(true);
    setSubjectCode("");
    setSubjectName("");
    try {
      const res = await fetch(`/api/public/subjects-for-class?branchId=${bId}&semester=${sem}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
        if (data.length > 0) { setSubjectCode(data[0].code); setSubjectName(data[0].name); }
      }
    } catch {} finally {
      setLoadingSubjects(false);
    }
  }


  async function fetchExams() {
    try {
      setLoading(true);
      const res = await fetch("/api/gradeai/teacher/active-exams");
      if (res.ok) {
        const data = await res.json();
        setActiveExams(data.exams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInitExam(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("exam_name", examName);
    formData.append("exam_type", "midterm");
    formData.append("branch", branchName);
    formData.append("semester", semester);
    formData.append("year", year);
    formData.append("subject", subjectCode);
    
    try {
      const res = await fetch("/api/gradeai/teacher/create-exam", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create exam");
      const data = await res.json();
      setCreatedExamId(data.exam_id);
      setSetupPhase("questions");
      setMessage({ type: "success", text: "Exam context established. Now add questions." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to initialize GradeAI assessment." });
    } finally {
      setCreating(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!createdExamId) return;
    if (!Number.isFinite(qNumber) || qNumber < 1 || !Number.isFinite(qMarks) || qMarks < 1) {
      setMessage({ type: "error", text: "Question number and total marks must be valid positive numbers." });
      return;
    }
    setCreating(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("exam_id", createdExamId.toString());
    formData.append("question_number", qNumber.toString());
    formData.append("total_marks", qMarks.toString());
    formData.append("question_text", qText);
    formData.append("model_answer", qModelAnswer);
    if (qDiagram) {
      formData.append("diagram_image", qDiagram);
    }

    try {
      const res = await fetch("/api/gradeai/teacher/add-question", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to add question");
      
      setAddedQuestions([...addedQuestions, { number: qNumber, marks: qMarks }]);
      setQNumber(qNumber + 1);
      setQText("");
      setQModelAnswer("");
      setQDiagram(null);
      setMessage({ type: "success", text: `Question ${qNumber} added successfully.` });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to add question." });
    } finally {
      setCreating(false);
    }
  }

  function handleFinishSetup() {
    setIsCreating(false);
    setSetupPhase("init");
    setCreatedExamId(null);
    setExamName("");
    setSubjectCode("");
    setSubjectName("");
    setAddedQuestions([]);
    setMessage({ type: "success", text: "Exam fully initialized and active." });
    fetchExams();
  }

  async function handleAssemblyUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExam || !rollNumber.trim()) {
       setMessage({ type: "error", text: "Roll number is required." });
       return;
    }

    const totalQuestionFiles = questionNumbers.reduce(
      (sum, q) => sum + (questionUploads[q]?.length ?? 0),
      0
    );

    if (totalQuestionFiles === 0) {
      setMessage({ type: "error", text: "Attach at least one question image." });
       return;
    }
    if (questionNumbers.length === 0) {
      setMessage({ type: "error", text: "This exam has no configured questions yet." });
      return;
    }
    setUploading(true);
    setMessage(null);

    const examIdRaw = String(selectedExam._id).trim();
    const examId = Number(examIdRaw);
    const normalizedRoll = rollNumber.toUpperCase().trim();

    try {
      if (!Number.isFinite(examId)) {
        throw new Error("Invalid exam ID for upload");
      }

      const verifyRes = await fetch("/api/gradeai/student/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: examId,
          roll_number: normalizedRoll,
        }),
      });
      if (!verifyRes.ok) {
        throw new Error("Failed to verify student profile for question-wise upload");
      }

      const verifyData = await verifyRes.json();
      if (verifyData?.error) {
        throw new Error(String(verifyData.error));
      }

      const formData = new FormData();
      formData.append("exam_id", examIdRaw);
      formData.append("roll_number", normalizedRoll);
      formData.append("student_name", String(verifyData.name ?? ""));
      formData.append("year", String(verifyData.year ?? ""));
      formData.append("branch", String(verifyData.branch ?? ""));
      formData.append("email", String(verifyData.email ?? ""));

      for (const q of questionNumbers) {
        const files = questionUploads[q] ?? [];
        for (const file of files) {
          formData.append(`q_${q}`, file, file.name);
        }
      }

      const res = await fetch("/api/gradeai/public/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      await res.json();
      setMessage({ type: "success", text: `Success: Evaluated ${normalizedRoll}` });
      setRollNumber("");
      setQuestionUploads(Object.fromEntries(questionNumbers.map((q) => [q, []])));
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Failed to process the answer sheet. Please try again.";
      setMessage({ type: "error", text: reason });
    } finally {
      setUploading(false);
    }
  }

  async function handleSkip() {
    if (!selectedExam || !rollNumber) {
      setMessage({ type: "error", text: "Roll number is required to mark absent." });
      return;
    }
    setSkipping(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("exam_id", String(selectedExam._id));
    formData.append("roll_number", rollNumber.toUpperCase());

    try {
      const res = await fetch("/api/gradeai/teacher/mark-absent", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to mark absent");
      setMessage({ type: "success", text: `Success: ${rollNumber.toUpperCase()} marked as absent.` });
      setRollNumber("");
    } catch (err) {
      setMessage({ type: "error", text: "Failed to mark absent." });
    } finally {
      setSkipping(false);
    }
  }

  if (loading) return <div className="p-10 animate-pulse bg-surface-variant/20 rounded-[2rem] h-64"></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">GradeAI Assessments</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mt-2">
            Automated Evaluation Pipeline
          </p>
        </div>
        {!selectedExam && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-base">add_task</span>
            Build New Exam
          </button>
        )}
      </header>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
          message.type === "success" ? "bg-primary-container text-on-primary-container" : "bg-error-container text-on-error-container"
        }`}>
          <span className="material-symbols-outlined">{message.type === "success" ? "check_circle" : "error"}</span>
          {message.text}
        </div>
      )}

      {isCreating ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] p-8 shadow-sm">
           <h2 className="text-xl font-black uppercase mb-6">
             {setupPhase === "init" ? "Step 1: Exam Metadata" : `Step 2: Add Questions (Exam ID: ${createdExamId})`}
           </h2>
           
           {setupPhase === "init" ? (
             <form onSubmit={handleInitExam} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Exam Name</label>
                  <input type="text" placeholder="e.g. Midterm 1" required value={examName} onChange={e => setExamName(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Subject</label>
                  {loadingSubjects ? (
                    <div className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface-variant animate-pulse">Loading subjects...</div>
                  ) : subjects.length === 0 ? (
                    <div className="w-full bg-surface border border-error/30 rounded-xl px-4 py-3 text-xs text-error font-bold">No subjects found for this branch & semester</div>
                  ) : (
                    <select required value={subjectCode}
                      onChange={e => {
                        setSubjectCode(e.target.value);
                        const s = subjects.find(s => s.code === e.target.value);
                        setSubjectName(s?.name ?? "");
                      }}
                      className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.code}>{s.code} — {s.name}</option>
                      ))}
                    </select>
                  )}
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Branch</label>
                  <select required value={branchId}
                    onChange={e => {
                      setBranchId(e.target.value);
                      const b = branches.find(b => b.id === e.target.value);
                      setBranchName(b?.name ?? "");
                    }}
                    className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Semester</label>
                  <input type="number" min="1" max="8" required value={semester} onChange={e => {
                    setSemester(e.target.value);
                    setYear(Math.ceil(parseInt(e.target.value || "1") / 2).toString());
                  }}
                    className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Year</label>
                  <input type="text" required value={year} disabled
                    className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none opacity-60"
                  />
               </div>
               <div className="md:col-span-2 flex gap-4 md:col-start-2 justify-end mt-4">
                  <button type="button" onClick={() => setIsCreating(false)} className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface">Cancel</button>
                  <button type="submit" disabled={creating} className="bg-primary text-on-primary px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50">
                    {creating ? "Saving..." : "Create & Next"}
                  </button>
               </div>
             </form>
           ) : (
             <div className="space-y-8">
                {/* Visualizer for added questions */}
                {addedQuestions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {addedQuestions.map((q, i) => (
                      <div key={i} className="bg-primary-container text-on-primary-container px-3 py-1 rounded-lg text-xs font-bold">
                        Q{q.number}: {q.marks}M
                      </div>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleAddQuestion} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Question Number</label>
                     <input type="number" min="1" required value={qNumber} onChange={e => setQNumber(parsePositiveIntOrFallback(e.target.value, qNumber))}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Total Marks</label>
                     <input type="number" min="1" required value={qMarks} onChange={e => setQMarks(parsePositiveIntOrFallback(e.target.value, qMarks))}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                      />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Question Text (Optional but tracking)</label>
                      <textarea placeholder="Write question here..." value={qText} onChange={e => setQText(e.target.value)}
                        className="w-full h-20 resize-none bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                      />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Model Answer (Reference)</label>
                      <textarea required placeholder="Write the definitive model answer..." value={qModelAnswer} onChange={e => setQModelAnswer(e.target.value)}
                        className="w-full h-32 resize-none bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                      />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Reference Diagram (Optional Image)</label>
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={e => setQDiagram(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="border border-outline-variant/30 bg-surface-container-lowest rounded-xl py-3 px-4 flex items-center gap-3 text-sm text-on-surface-variant transition-colors hover:bg-surface-variant/30">
                           <span className="material-symbols-outlined text-xl">image</span>
                           <span className="font-bold uppercase tracking-widest text-[10px]">{qDiagram ? qDiagram.name : "Attach Reference Visual"}</span>
                        </div>
                      </div>
                   </div>
                   <div className="md:col-span-2 flex justify-end mt-2">
                      <button type="submit" disabled={creating} className="bg-secondary text-on-secondary px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined">add</span> {creating ? "Saving..." : "Add Question"}
                      </button>
                   </div>
                </form>
                
                <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Added {addedQuestions.length} Questions</p>
                   <button type="button" onClick={handleFinishSetup} className="bg-primary text-on-primary px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest">
                     Finish Setup
                   </button>
                </div>
             </div>
           )}
        </div>
      ) : selectedExam ? (
        <div className="space-y-6">
           <div className="flex gap-4 mb-4">
              <button 
                onClick={() => {
                  resetAssemblyForm(null);
                  setSelectedExam(null);
                }} 
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span> Return to Assessment Registry
              </button>
           </div>
           
           <div className="bg-surface-container border border-outline-variant/30 rounded-[2rem] p-8 shadow-sm">
             <div className="flex justify-between items-center mb-8 border-b border-outline-variant/20 pb-6">
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tight text-on-surface">{selectedExam.exam_name || selectedExam.subject}</h2>
                 <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-1.5">{selectedExam.subject} • Active Grading Queue</p>
               </div>
               <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                 <span className="material-symbols-outlined text-2xl font-black">robot_2</span>
               </div>
             </div>

             <form onSubmit={handleAssemblyUpload} className="space-y-6">
                <div className="flex flex-wrap gap-2 border-b border-outline-variant/10 pb-4">
                  <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-on-primary">
                    Question-Wise Images
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant self-center">
                    {`${Number(selectedExam.q_count ?? 0)} questions configured`}
                  </span>
                </div>

                <div className="grid gap-6 items-end grid-cols-1 md:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Student Roll Number</label>
                    <input type="text" placeholder="e.g. 25UCSE3001" required value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-4 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button type="submit" disabled={uploading || skipping} className="bg-secondary text-on-secondary px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 flex-1 h-[54px]">
                      {uploading ? <span className="material-symbols-outlined animate-spin-slow">sync</span> : <span className="material-symbols-outlined">send</span>}
                      {uploading ? "Evaluating..." : "Evaluate"}
                    </button>
                    <button type="button" onClick={handleSkip} disabled={uploading || skipping} className="bg-surface-variant text-on-surface-variant px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-error hover:text-on-error transition-colors disabled:opacity-50 flex items-center justify-center gap-2 h-[54px]" title="Mark Absent & Skip">
                      {skipping ? <span className="material-symbols-outlined animate-spin-slow">sync</span> : <span className="material-symbols-outlined">person_off</span>}
                      Skip
                    </button>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-outline-variant/20 p-4 bg-surface-container-lowest">
                  {questionNumbers.length === 0 && (
                    <p className="text-xs font-bold text-error">
                      Question count unavailable for this exam. Add exam questions first.
                    </p>
                  )}
                  {questionNumbers.map((q) => (
                    <div key={q} className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-3">
                      <div className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Q{q}</div>
                      <label className="relative border border-outline-variant/30 rounded-lg bg-surface px-3 py-2 cursor-pointer hover:bg-surface-variant/20 transition-colors">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={(e) => handleQuestionFilesChange(q, e.target.files)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-on-surface-variant">
                          {questionUploads[q]?.length ? `${questionUploads[q].length} file(s) selected` : "Attach image(s)/PDF for this question"}
                        </span>
                      </label>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {questionNumbers.reduce((sum, q) => sum + (questionUploads[q]?.length ?? 0), 0)} files selected
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Fixed to {questionNumbers.length} question slot(s)
                    </p>
                  </div>
                </div>
             </form>

             <div className="mt-8 p-4 rounded-xl bg-outline-variant/5 border border-outline-variant/10">
                <p className="text-[10px] font-medium leading-relaxed text-on-surface-variant max-w-2xl">
                  <strong>Assembly Line Operation:</strong> Input the student's roll number and attach answer images/PDF per question slot. Do not reload the page between submissions. The AI engine will correlate answers against the established master key and register the score directly into the student ledger.
                </p>
             </div>
           </div>
        </div>
      ) : activeExams.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-outline-variant/40 rounded-[2rem]">
          <h3 className="text-xl font-black uppercase text-on-surface">Registry Empty</h3>
          <p className="text-sm text-on-surface-variant font-medium mt-2">Build a new exam to begin operations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeExams.map(ex => (
            <div key={ex._id} onClick={() => { setSelectedExam(ex); resetAssemblyForm(ex); }} className="bg-surface-container border border-outline-variant/30 rounded-[2rem] p-6 shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-surface-container-highest text-on-surface-variant rounded-xl flex items-center justify-center group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                     <span className="material-symbols-outlined text-lg">assignment</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">Active</span>
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight text-on-surface leading-none">{ex.exam_name || ex.subject}</h3>
               <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-2 border-b border-outline-variant/20 pb-4">{ex.subject} • M</p>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                 <span className="material-symbols-outlined text-xs">open_in_new</span> Enter Assembly Line
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
