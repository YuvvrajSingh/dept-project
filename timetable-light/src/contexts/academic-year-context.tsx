"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AcademicYear } from "@/lib/types";
import { academicYearApi } from "@/lib/api";

interface AcademicYearContextType {
  academicYears: AcademicYear[];
  activeYear: AcademicYear | null;
  selectedYear: AcademicYear | null;
  selectedSemesterHalf: "ODD" | "EVEN";
  isArchived: boolean;
  setSelectedYear: (year: AcademicYear) => void;
  setSelectedSemesterHalf: (half: "ODD" | "EVEN") => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

const STORAGE_KEY_YEAR = "timetable-selected-year-id";
const STORAGE_KEY_SEM = "timetable-selected-semester-half";

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYearState] = useState<AcademicYear | null>(null);
  const [selectedSemesterHalf, setSelectedSemesterHalfState] = useState<"ODD" | "EVEN">("ODD");
  const [loading, setLoading] = useState(true);

  const activeYear = academicYears.find((y) => y.isActive) ?? null;

  const isArchived = selectedYear?.status === "ARCHIVED";

  const fetchYears = useCallback(async () => {
    try {
      setLoading(true);
      const years = await academicYearApi.list();
      setAcademicYears(years);

      // Restore from localStorage or default to active year
      const savedYearId = localStorage.getItem(STORAGE_KEY_YEAR);
      const savedSemHalf = localStorage.getItem(STORAGE_KEY_SEM) as "ODD" | "EVEN" | null;

      if (savedSemHalf === "ODD" || savedSemHalf === "EVEN") {
        setSelectedSemesterHalfState(savedSemHalf);
      }

      if (savedYearId) {
        const found = years.find((y) => y.id === Number(savedYearId));
        if (found) {
          setSelectedYearState(found);
          setLoading(false);
          return;
        }
      }

      // Default to active year
      const active = years.find((y) => y.isActive);
      if (active) {
        setSelectedYearState(active);
        localStorage.setItem(STORAGE_KEY_YEAR, String(active.id));
      } else if (years.length > 0) {
        setSelectedYearState(years[0]);
        localStorage.setItem(STORAGE_KEY_YEAR, String(years[0].id));
      }
    } catch (err) {
      console.error("[AcademicYearContext] Failed to fetch academic years:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const setSelectedYear = useCallback((year: AcademicYear) => {
    setSelectedYearState(year);
    localStorage.setItem(STORAGE_KEY_YEAR, String(year.id));
  }, []);

  const setSelectedSemesterHalf = useCallback((half: "ODD" | "EVEN") => {
    setSelectedSemesterHalfState(half);
    localStorage.setItem(STORAGE_KEY_SEM, half);
  }, []);

  return (
    <AcademicYearContext.Provider
      value={{
        academicYears,
        activeYear,
        selectedYear,
        selectedSemesterHalf,
        isArchived,
        setSelectedYear,
        setSelectedSemesterHalf,
        loading,
        refresh: fetchYears,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) {
    throw new Error("useAcademicYear must be used within an AcademicYearProvider");
  }
  return ctx;
}
