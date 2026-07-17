import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/student/timetable")({
  head: () => ({ meta: [{ title: "My Timetable — Edureon" }] }),
  component: StudentTimetable,
});

const periods = ["08:00", "08:45", "09:30", "10:00", "10:45", "11:30", "12:15", "13:00"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SUBJECTS = ["Maths", "Physics", "Chem", "English", "Hindi", "Bio", "PE", "Lib"];
const TEACHERS = ["Mrs. Sharma", "Mr. Joshi", "Mr. Khanna", "Ms. Bose", "Mrs. Iyer", "Mr. Reddy", "Coach Patil", "—"];

function StudentTimetable() {
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <PageContainer>
      <PageHeader eyebrow="Student Portal" title="My Weekly Timetable" description="Class X-B · 2025-26 · Read-only" />
      <Card className="border-border/60">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left text-muted-foreground font-medium">Period</th>
                {days.map((d, i) => (
                  <th key={d} className={`px-3 py-2 text-left font-medium ${i === todayIdx ? "text-primary" : ""}`}>{d}{i === todayIdx && <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Today</span>}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p} className="border-b hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{p}</td>
                  {days.map((d, j) => {
                    const idx = (i + j) % SUBJECTS.length;
                    const subject = i === 3 ? "Break" : SUBJECTS[idx];
                    if (subject === "Break") return <td key={d} className="px-3 py-2 text-center text-[11px] text-muted-foreground italic">Recess</td>;
                    return (
                      <td key={d} className={`px-3 py-2 align-top ${j === todayIdx ? "bg-primary/5" : ""}`}>
                        <div className="font-semibold text-foreground">{subject}</div>
                        <div className="text-[10px] text-muted-foreground">{TEACHERS[idx]}</div>
                        <div className="text-[10px] text-muted-foreground">Room {String.fromCharCode(70 + (idx % 3))}-{10 + idx}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
