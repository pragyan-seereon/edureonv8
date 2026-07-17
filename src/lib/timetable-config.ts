import { useEffect, useState } from "react";

export type SubjectCfg = { code: string; name: string; color: string };

export type TtConfig = {
  days: string[];
  periods: string[]; // time labels per period slot
  breakPeriods: number[]; // indices in `periods` that are breaks
  breakLabels: Record<number, string>;
  classes: string[];
  subjects: SubjectCfg[];
  teachers: string[];
  rooms: string[];
  blockedRooms: Record<string, number[]>; // room -> day indices blocked
  unavailableTeachers: Record<string, number[]>; // teacher -> day indices off
  teacherWeeklyCap: number;
  overloadThreshold: number;
};

export const SUBJECT_PALETTE = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
];

export const defaultTtConfig: TtConfig = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  periods: ["08:00", "08:50", "09:40", "10:50", "11:40", "12:30", "13:50", "14:40"],
  breakPeriods: [3, 6],
  breakLabels: { 3: "Short Break", 6: "Lunch" },
  classes: ["VI-A", "VII-B", "VIII-A", "IX-A", "X-B", "XI-C", "XII-A"],
  subjects: [
    { code: "MTH", name: "Mathematics", color: SUBJECT_PALETTE[0] },
    { code: "SCI", name: "Science", color: SUBJECT_PALETTE[1] },
    { code: "ENG", name: "English", color: SUBJECT_PALETTE[2] },
    { code: "SOC", name: "Social", color: SUBJECT_PALETTE[3] },
    { code: "HIN", name: "Hindi", color: SUBJECT_PALETTE[4] },
    { code: "CS", name: "Computer", color: SUBJECT_PALETTE[5] },
    { code: "PE", name: "PE", color: SUBJECT_PALETTE[6] },
    { code: "ART", name: "Arts", color: SUBJECT_PALETTE[7] },
  ],
  teachers: ["A. Mehta", "P. Iyer", "R. Khanna", "S. Bose", "V. Nair", "K. Das", "M. Joshi", "N. Patel"],
  rooms: ["R-101", "R-102", "Lab-1", "Lab-2", "Hall-A", "PE-Ground"],
  blockedRooms: { "Lab-2": [2] },
  unavailableTeachers: { "K. Das": [0] },
  teacherWeeklyCap: 40,
  overloadThreshold: 35,
};

const KEY = "tt-config-v1";

export function useTtConfig() {
  const [config, setConfig] = useState<TtConfig>(() => {
    if (typeof window === "undefined") return defaultTtConfig;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultTtConfig;
      return { ...defaultTtConfig, ...JSON.parse(raw) } as TtConfig;
    } catch {
      return defaultTtConfig;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(config)); } catch { /* ignore */ }
  }, [config]);

  const reset = () => setConfig(defaultTtConfig);

  return { config, setConfig, reset };
}
