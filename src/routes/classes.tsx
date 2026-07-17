import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  School,
  Plus,
  Users,
  BookOpen,
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Trophy,
} from "lucide-react";

import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import { CrudDialog, type CrudRecord } from "@/components/crud-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  useSections,
  useSubjects,
  sectionsApi,
  subjectsApi,
  useSubjectMappings,
  useAcademicCalendar,
  subjectMappingsApi,
  academicCalendarApi,
  useStudents,
  studentsApi,
  useEmployees,
  useClasses,
  classesApi,
  useRooms,
  walletApi,
  useSectionChangeRequests,
  sectionChangeApi,
  useDepartments,
  departmentsApi,
  SUBJECT_TYPES,
  type Section,
  type Subject,
  type SubjectMapping,
  type CalendarEvent,
  type ClassDef,
  type ClassSubjectOffering,
  type Department,
} from "@/lib/store";
import type { Student } from "@/lib/mock";


import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DataMigrationBar } from "@/components/data-migration-bar";
import { DataHealth } from "@/components/data-health";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "Classes & Sections — Edureon ERP" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const nav = useNavigate();
  const sections = useSections();
  const subjects = useSubjects();
  const mappings = useSubjectMappings();
  const calendar = useAcademicCalendar();
  const students = useStudents();
  const employees = useEmployees();
  const teacherOptions = useMemo(
    () =>
      employees
        .filter((e) => e.type === "Academic" || /teacher|principal|hod|faculty/i.test(e.role))
        .map((e) => e.name),
    [employees],
  );
  const rooms = useRooms();
  const roomLabels = useMemo(
    () => rooms.map((r) => `${r.no} — ${r.floor} · ${r.building}`),
    [rooms],
  );

  const [secOpen, setSecOpen] = useState(false);
  const [secEdit, setSecEdit] = useState<Section | null>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [subEdit, setSubEdit] = useState<Subject | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapEdit, setMapEdit] = useState<SubjectMapping | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [calEdit, setCalEdit] = useState<CalendarEvent | null>(null);
  // Students tab state
  const [stuQ, setStuQ] = useState("");
  const [stuClass, setStuClass] = useState<string>("all");
  const [stuSection, setStuSection] = useState<string>("all");
  const [stuSelected, setStuSelected] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTo, setAssignTo] = useState({
    class: "",
    section: "",
    session: String(new Date().getFullYear()) + "-" + String(new Date().getFullYear() + 1).slice(-2),
  });

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.class))).sort(),
    [students],
  );
  const sectionOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.section))).sort(),
    [students],
  );

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        if (stuClass !== "all" && s.class !== stuClass) return false;
        if (stuSection !== "all" && s.section !== stuSection) return false;
        if (
          stuQ &&
          !(
            s.name.toLowerCase().includes(stuQ.toLowerCase()) ||
            s.admissionNo.toLowerCase().includes(stuQ.toLowerCase()) ||
            s.parent.toLowerCase().includes(stuQ.toLowerCase())
          )
        )
          return false;
        return true;
      }),
    [students, stuQ, stuClass, stuSection],
  );

  const allStuSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => stuSelected.has(s.id));
  const toggleAllStu = () =>
    setStuSelected((p) => {
      const n = new Set(p);
      if (allStuSelected) filteredStudents.forEach((s) => n.delete(s.id));
      else filteredStudents.forEach((s) => n.add(s.id));
      return n;
    });
  const toggleStu = (id: string) =>
    setStuSelected((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const performAssign = () => {
    if (!assignTo.class || !assignTo.section) {
      toast.error("Pick a class and section to assign");
      return;
    }
    stuSelected.forEach((id) =>
      studentsApi.update(id, {
        class: assignTo.class,
        section: assignTo.section,
        session: assignTo.session,
      }),
    );
    toast.success(
      `Assigned ${stuSelected.size} student(s) to ${assignTo.class}-${assignTo.section} · ${assignTo.session}`,
    );
    setStuSelected(new Set());
    setAssignOpen(false);
  };



  const submitMapping = (d: CrudRecord) => {
    const section = sections.find((s) => s.name === String(d.section)) ?? sections[0];
    const subject = subjects.find((s) => s.name === String(d.subject)) ?? subjects[0];
    if (!section || !subject)
      return toast.error("Create at least one section and one subject first");
    const payload = {
      sectionId: section.id,
      subjectId: subject.id,
      teacher: String(d.teacher),
      periods: Number(d.periods) || 1,
      room: String(d.room),
      assessment: (d.assessment as SubjectMapping["assessment"]) || "Theory",
    };
    if (mapEdit) subjectMappingsApi.update(mapEdit.id, payload);
    else subjectMappingsApi.add(payload);
    toast.success(mapEdit ? "Subject mapping updated" : "Subject mapped to section");
  };
  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? id;
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Academic"
        title="Classes, Sections & Subjects"
        description="Define academic structure — streams, departments, classes, sections, batches and subject mapping."
        actions={
          <>
            <DataMigrationBar
              moduleName="Sections"
              rows={sections}
              columns={[
                { header: "Section", accessor: (s) => s.name },
                { header: "Class", accessor: (s) => s.class },
                { header: "Class Teacher", accessor: (s) => s.teacher },
                { header: "Students", accessor: (s) => s.students },
                { header: "Capacity", accessor: (s) => s.cap },
                { header: "Subjects", accessor: (s) => s.subjects },
                { header: "Room", accessor: (s) => s.room },
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubEdit(null);
                setSubOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Subject
            </Button>
            <Button
              size="sm"
              className="gradient-primary border-0"
              onClick={() => {
                setSecEdit(null);
                setSecOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Section
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Sections"
          value={sections.length.toString()}
          icon={<School className="h-5 w-5" />}
          tone="primary"
        />
        <KpiCard
          label="Students"
          value={sections.reduce((s, x) => s + x.students, 0).toString()}
          icon={<Users className="h-5 w-5" />}
          tone="info"
        />
        <KpiCard
          label="Subjects"
          value={subjects.length.toString()}
          icon={<BookOpen className="h-5 w-5" />}
          tone="success"
        />
        <KpiCard
          label="At Capacity"
          value={sections.filter((s) => s.students >= s.cap).length.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      <Tabs defaultValue="classes">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="mapping">Subject Mapping</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="calendar">Academic Calendar</TabsTrigger>

          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="promote">Promotions</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="health">Data Health</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-4">
          <ClassesTab />
        </TabsContent>


        <TabsContent value="sections" className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => {
            const pct = Math.round((s.students / s.cap) * 100);
            return (
              <Card key={s.id} className="border-border/60 hover:border-primary/40 cursor-pointer" onClick={() => nav({ to: "/classes/$id", params: { id: s.id } })}>
                <CardHeader className="pb-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg">{s.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={pct >= 100 ? "destructive" : pct > 90 ? "default" : "secondary"}
                      >
                        {pct}% full
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info(
                                `Class Teacher: ${s.teacher} · Room ${s.room} · ${s.students}/${s.cap}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSecEdit(s);
                              setSecOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              sectionsApi.remove(s.id);
                              toast.success("Section removed");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    Class Teacher: {s.teacher} · Room {s.room}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-semibold">
                        {s.students}/{s.cap}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subjects</span>
                    <span>{s.subjects}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Subjects</CardTitle>
                <CardDescription>Catalog of subjects offered across classes.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gradient-primary border-0"
                onClick={() => {
                  setSubEdit(null);
                  setSubOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                New Subject
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => nav({ to: "/subjects/$id", params: { id: s.id } })}>
                      <TableCell className="font-mono text-xs">{s.code}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.dept}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.type === "Core"
                              ? "default"
                              : s.type === "Elective"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.classes}</TableCell>
                      <TableCell>{s.faculty}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(
                                  `${s.name} · ${s.classes} classes · ${s.faculty} faculty`,
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSubEdit(s);
                                setSubOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                subjectsApi.remove(s.id);
                                toast.success("Subject removed");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Subject Mapping</CardTitle>
                <CardDescription>
                  Map each subject to a section, teacher, room, periods per week and assessment
                  type.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gradient-primary border-0"
                onClick={() => {
                  setMapEdit(null);
                  setMapOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Map Subject
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Periods</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge variant="secondary">{sectionName(m.sectionId)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{subjectName(m.subjectId)}</TableCell>
                      <TableCell>{m.teacher}</TableCell>
                      <TableCell>{m.periods}/week</TableCell>
                      <TableCell>{m.room}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.assessment}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(
                                  `${subjectName(m.subjectId)} mapped to ${sectionName(m.sectionId)} with ${m.teacher}`,
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setMapEdit(m);
                                setMapOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                subjectMappingsApi.remove(m.id);
                                toast.success("Mapping removed");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab />
        </TabsContent>



        <TabsContent value="calendar" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Academic Calendar</CardTitle>
                <CardDescription>
                  Add holidays, exams, PTMs and events with full edit/delete control.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gradient-primary border-0"
                onClick={() => {
                  setCalEdit(null);
                  setCalOpen(true);
                }}
              >
                <CalendarDays className="h-4 w-4" />
                Add Event
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {calendar.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="text-xs text-muted-foreground">{e.date}</div>
                    <div className="text-sm font-medium">{e.event}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {e.audience} · {e.notes}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        e.type === "Holiday"
                          ? "secondary"
                          : e.type === "Exam"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {e.type === "Other" ? e.customType || "Other" : e.type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`${e.event} · ${e.audience}`)}>
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCalEdit(e);
                            setCalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            academicCalendarApi.remove(e.id);
                            toast.success("Calendar event deleted");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
              <div>
                <CardTitle className="text-base">Students</CardTitle>
                <CardDescription>
                  Filter, multi-select students and bulk-assign them to a Class, Section and Session.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    value={stuQ}
                    onChange={(e) => setStuQ(e.target.value)}
                    placeholder="Search name / admission / parent…"
                    className="pl-8 h-9 w-64"
                  />
                </div>
                <Select value={stuClass} onValueChange={setStuClass}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        Class {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stuSection} onValueChange={setStuSection}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sections</SelectItem>
                    {sectionOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        Section {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="gradient-primary border-0"
                  disabled={stuSelected.size === 0}
                  onClick={() => {
                    setAssignTo((a) => ({
                      ...a,
                      class: a.class || (stuClass !== "all" ? stuClass : ""),
                      section: a.section || (stuSection !== "all" ? stuSection : ""),
                    }));
                    setAssignOpen(true);
                  }}
                >
                  Assign{stuSelected.size > 0 ? ` (${stuSelected.size})` : ""}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox checked={allStuSelected} onCheckedChange={toggleAllStu} />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Session</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground py-10"
                      >
                        No students match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredStudents.slice(0, 200).map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => toggleStu(s.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={stuSelected.has(s.id)}
                          onCheckedChange={() => toggleStu(s.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {s.class}-{s.section}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.rollNo}</TableCell>
                      <TableCell className="text-sm">{s.parent}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.phone}</TableCell>
                      <TableCell className="text-xs">{s.session ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredStudents.length > 200 && (
                <div className="p-3 text-xs text-muted-foreground border-t">
                  Showing first 200 of {filteredStudents.length}. Refine filters to narrow down.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promote" className="mt-4">
          <PromotionsTab />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <TransfersTab />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <DataHealth />
        </TabsContent>
      </Tabs>


      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Assign Students</DialogTitle>
            <DialogDescription>
              {stuSelected.size} student(s) selected. Choose the target Class, Section and Session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Class</Label>
              <Select
                value={assignTo.class}
                onValueChange={(v) => setAssignTo((a) => ({ ...a, class: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {["Pre-KG", "KG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"].map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        Class {c}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Section</Label>
              <Select
                value={assignTo.section}
                onValueChange={(v) => setAssignTo((a) => ({ ...a, section: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D", "E", "F"].map((c) => (
                    <SelectItem key={c} value={c}>
                      Section {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Session (Year)</Label>
              <Select
                value={assignTo.session}
                onValueChange={(v) => setAssignTo((a) => ({ ...a, session: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const y = new Date().getFullYear();
                    return [y - 1, y, y + 1].map((yr) => {
                      const label = `${yr}-${String(yr + 1).slice(-2)}`;
                      return (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={performAssign} className="gradient-primary border-0">
              Assign {stuSelected.size} Student{stuSelected.size === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionDialog
        open={secOpen}
        onOpenChange={setSecOpen}
        edit={secEdit}
        teacherOptions={teacherOptions}
        rooms={rooms}
        onSubmit={(payload) => {
          if (secEdit) sectionsApi.update(secEdit.id, payload);
          else sectionsApi.add(payload);
          toast.success(secEdit ? "Section updated" : "Section created");
          setSecOpen(false);
        }}
      />

      <SubjectDialog
        open={subOpen}
        onOpenChange={setSubOpen}
        edit={subEdit}
        teacherOptions={teacherOptions}
        onSubmit={(payload) => {
          if (subEdit) subjectsApi.update(subEdit.id, payload);
          else subjectsApi.add(payload);
          toast.success(subEdit ? "Subject updated" : "Subject created");
          setSubOpen(false);
        }}
      />


      <CrudDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        title={mapEdit ? "Edit Subject Mapping" : "Create Subject Mapping"}
        description="Assign a subject to a section with the responsible teacher, weekly load and room."
        initial={
          mapEdit
            ? {
                section: sectionName(mapEdit.sectionId),
                subject: subjectName(mapEdit.subjectId),
                teacher: mapEdit.teacher,
                periods: mapEdit.periods,
                room: mapEdit.room,
                assessment: mapEdit.assessment,
              }
            : undefined
        }
        fields={[
          {
            name: "section",
            label: "Section",
            type: "select",
            options: sections.map((s) => s.name),
          },
          {
            name: "subject",
            label: "Subject",
            type: "select",
            options: subjects.map((s) => s.name),
          },
          { name: "teacher", label: "Teacher", type: "select", options: teacherOptions.length ? teacherOptions : ["—"] },
          { name: "periods", label: "Periods per week", type: "number" },
          { name: "room", label: "Room / Lab" },
          {
            name: "assessment",
            label: "Assessment Type",
            type: "select",
            options: ["Theory", "Practical", "Both"],
          },
        ]}
        submitLabel={mapEdit ? "Save Mapping" : "Map Subject"}
        onSubmit={submitMapping}
      />

      <CalendarEventDialog
        open={calOpen}
        onOpenChange={setCalOpen}
        edit={calEdit}
        onSubmit={(payload) => {
          if (calEdit) academicCalendarApi.update(calEdit.id, payload);
          else academicCalendarApi.add(payload);
          toast.success(calEdit ? "Calendar event updated" : "Calendar event added");
          setCalOpen(false);
        }}
      />
    </PageContainer>
  );
}

type CalDraft = Omit<CalendarEvent, "id" | "archived">;

function CalendarEventDialog({
  open,
  onOpenChange,
  edit,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  edit: CalendarEvent | null;
  onSubmit: (payload: CalDraft) => void;
}) {
  const parseRange = (s: string): { from?: Date; to?: Date } => {
    if (!s) return {};
    const parts = s.split(/\s*(?:→|to|-)\s*/);
    const a = parts[0] ? new Date(parts[0]) : undefined;
    const b = parts[1] ? new Date(parts[1]) : undefined;
    return { from: a && !isNaN(+a) ? a : undefined, to: b && !isNaN(+b) ? b : undefined };
  };
  const init = edit ? parseRange(edit.date) : {};
  const [from, setFrom] = useState<Date | undefined>(init.from);
  const [to, setTo] = useState<Date | undefined>(init.to);
  const [event, setEvent] = useState(edit?.event ?? "");
  const [type, setType] = useState<CalendarEvent["type"]>(edit?.type ?? "Event");
  const [customType, setCustomType] = useState(edit?.customType ?? "");
  const [audience, setAudience] = useState(edit?.audience ?? "All");
  const [notes, setNotes] = useState(edit?.notes ?? "");

  useEffect(() => {
    if (!open) return;
    const r = edit ? parseRange(edit.date) : {};
    setFrom(r.from);
    setTo(r.to);
    setEvent(edit?.event ?? "");
    setType(edit?.type ?? "Event");
    setCustomType(edit?.customType ?? "");
    setAudience(edit?.audience ?? "All");
    setNotes(edit?.notes ?? "");
  }, [open, edit]);

  const submit = () => {
    if (!from) return toast.error("Pick a start date");
    if (!event.trim()) return toast.error("Event name is required");
    if (type === "Other" && !customType.trim()) return toast.error("Specify the custom type");
    const dateStr = to && +to !== +from
      ? `${format(from, "yyyy-MM-dd")} → ${format(to, "yyyy-MM-dd")}`
      : format(from, "yyyy-MM-dd");
    onSubmit({
      date: dateStr,
      event: event.trim(),
      type,
      customType: type === "Other" ? customType.trim() : undefined,
      audience,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {edit ? "Edit Calendar Event" : "Add Calendar Event"}
          </DialogTitle>
          <DialogDescription>
            Pick a date range, choose the event type and the audience it applies to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !from && "text-muted-foreground",
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  {from
                    ? to && +to !== +from
                      ? `${format(from, "PPP")} → ${format(to, "PPP")}`
                      : format(from, "PPP")
                    : "Pick a date or range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from, to }}
                  onSelect={(r) => {
                    setFrom(r?.from);
                    setTo(r?.to);
                  }}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Event name</Label>
            <Input value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. Mid-term exam" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CalendarEvent["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Event", "Exam", "Holiday", "PTM", "Activity", "Other"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["All", "Employee", "Student", "Parents"].map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {type === "Other" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Custom type</Label>
              <Input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g. Workshop, Sports Day"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="gradient-primary border-0" onClick={submit}>
            {edit ? "Save Event" : "Add Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ================= Classes Tab =================
const STREAMS: ClassDef["stream"][] = ["Science", "Commerce", "Arts", "Vocational", "Other"];
function ClassesTab() {
  const list = useClasses();
  const employees = useEmployees();
  const teacherOptions = useMemo(
    () =>
      employees
        .filter((e) => e.type === "Academic" || /teacher|principal|hod|faculty/i.test(e.role))
        .map((e) => e.name),
    [employees],
  );
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<ClassDef | null>(null);
  const [form, setForm] = useState<Omit<ClassDef, "id">>({
    name: "",
    stream: "Science",
    streamNotes: "",
    status: "Active",
    subjectsOffered: [],
  });

  const openNew = () => {
    setEdit(null);
    setForm({ name: "", stream: "Science", streamNotes: "", status: "Active", subjectsOffered: [] });
    setOpen(true);
  };
  const openEdit = (c: ClassDef) => {
    setEdit(c);
    setForm({
      name: c.name,
      stream: c.stream,
      streamNotes: c.streamNotes ?? "",
      status: c.status,
      annualFee: c.annualFee,
      subjectsOffered: c.subjectsOffered ?? [],
    });
    setOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) return toast.error("Class name is required");
    if (edit) {
      classesApi.update(edit.id, form);
      toast.success("Class updated");
    } else {
      classesApi.add(form);
      toast.success("Class created");
    }
    setOpen(false);
  };

  const addSubjectRow = () =>
    setForm((f) => ({ ...f, subjectsOffered: [...(f.subjectsOffered ?? []), { subject: "", teacher: "" }] }));
  const updateSubjectRow = (i: number, patch: Partial<ClassSubjectOffering>) =>
    setForm((f) => ({
      ...f,
      subjectsOffered: (f.subjectsOffered ?? []).map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  const removeSubjectRow = (i: number) =>
    setForm((f) => ({ ...f, subjectsOffered: (f.subjectsOffered ?? []).filter((_, idx) => idx !== i) }));

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
        <div>
          <CardTitle className="text-base">Classes</CardTitle>
          <CardDescription>
            Define classes with stream, subjects offered and status. Fees are managed in the Fee Structure module.
          </CardDescription>
        </div>
        <Button size="sm" className="gradient-primary border-0" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add New Class
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead>Subjects Offered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{c.stream}</Badge>
                  {c.streamNotes && <div className="text-xs text-muted-foreground mt-0.5">{c.streamNotes}</div>}
                </TableCell>
                <TableCell className="text-xs">
                  {c.subjectsOffered && c.subjectsOffered.length > 0
                    ? c.subjectsOffered.map((s, i) => (
                        <div key={i} className="whitespace-nowrap">
                          <span className="font-medium">{s.subject}</span>
                          {s.teacher && <span className="text-muted-foreground"> — {s.teacher}</span>}
                        </div>
                      ))
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={c.status === "Active" ? "default" : "outline"}>{c.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => {
                      classesApi.remove(c.id);
                      toast.success("Class removed");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit ? "Edit Class" : "Add New Class"}</DialogTitle>
            <DialogDescription>
              Set class name, stream, subjects offered (with responsible teacher) and status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Class Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. XI" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stream</Label>
                <Select value={form.stream} onValueChange={(v) => setForm({ ...form, stream: v as ClassDef["stream"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STREAMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.stream === "Other" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Stream Notes / Details</Label>
                <Textarea
                  value={form.streamNotes}
                  onChange={(e) => setForm({ ...form, streamNotes: e.target.value })}
                  placeholder="Describe the stream / vocational track"
                  rows={2}
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Subjects Offered</Label>
                <Button type="button" size="sm" variant="outline" onClick={addSubjectRow}>
                  <Plus className="h-3.5 w-3.5" /> Add More Subject
                </Button>
              </div>
              {(form.subjectsOffered ?? []).length === 0 && (
                <div className="text-xs text-muted-foreground border border-dashed rounded-md p-3 text-center">
                  No subjects added yet.
                </div>
              )}
              {(form.subjectsOffered ?? []).map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Subject</Label>
                    <Input
                      value={row.subject}
                      onChange={(e) => updateSubjectRow(i, { subject: e.target.value })}
                      placeholder="e.g. Physics"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Teacher</Label>
                    <Select value={row.teacher} onValueChange={(v) => updateSubjectRow(i, { teacher: v })}>
                      <SelectTrigger><SelectValue placeholder="Pick teacher" /></SelectTrigger>
                      <SelectContent>
                        {(teacherOptions.length ? teacherOptions : ["—"]).map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() => removeSubjectRow(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ClassDef["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={save}>{edit ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


// ================= Promotions Tab =================
const ROMAN_ORDER = ["Pre-KG", "KG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
function nextClass(c: string) {
  const i = ROMAN_ORDER.indexOf(c);
  return i >= 0 && i < ROMAN_ORDER.length - 1 ? ROMAN_ORDER[i + 1] : c;
}
function PromotionsTab() {
  const students = useStudents();
  const [fromClass, setFromClass] = useState<string>("XI");
  const [fromSection, setFromSection] = useState<string>("all");
  const [toClass, setToClass] = useState<string>("XII");
  const [toSection, setToSection] = useState<string>("same");
  const [session, setSession] = useState<string>(() => {
    const y = new Date().getFullYear() + 1;
    return `${y}-${String(y + 1).slice(-2)}`;
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class))).sort(), [students]);
  const sections = useMemo(
    () => Array.from(new Set(students.filter((s) => s.class === fromClass).map((s) => s.section))).sort(),
    [students, fromClass],
  );
  const candidates = useMemo(
    () =>
      students.filter(
        (s) => !s.archived && s.class === fromClass && (fromSection === "all" || s.section === fromSection),
      ),
    [students, fromClass, fromSection],
  );

  // Auto-select all candidates whenever the filter changes
  useEffect(() => {
    setSelected(new Set(candidates.map((s) => s.id)));
  }, [candidates]);

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allSelected = candidates.length > 0 && candidates.every((s) => selected.has(s.id));
  const toggleAll = () =>
    setSelected((p) => {
      const n = new Set(p);
      if (allSelected) candidates.forEach((s) => n.delete(s.id));
      else candidates.forEach((s) => n.add(s.id));
      return n;
    });

  const promote = () => {
    const list = candidates.filter((s) => selected.has(s.id));
    if (list.length === 0) return toast.error("Select at least one student to promote");
    list.forEach((s) =>
      studentsApi.update(s.id, {
        class: toClass,
        section: toSection === "same" ? s.section : toSection,
        session,
      }),
    );
    toast.success(
      `Promoted ${list.length} student(s) → ${toClass}-${toSection === "same" ? "(same)" : toSection} · ${session}`,
    );
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Year-End Promotions</CardTitle>
        <CardDescription>
          Filter by class/section, then deselect students who failed and should not be promoted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 rounded-md border p-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">From</div>
            <div className="space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select value={fromClass} onValueChange={(v) => { setFromClass(v); setToClass(nextClass(v)); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <Select value={fromSection} onValueChange={setFromSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {sections.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3 rounded-md border p-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">To</div>
            <div className="space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select value={toClass} onValueChange={setToClass}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROMAN_ORDER.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <Select value={toSection} onValueChange={setToSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="same">Keep same section</SelectItem>
                  {["A", "B", "C", "D", "E"].map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New Session</Label>
              <Input value={session} onChange={(e) => setSession(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="flex items-center justify-between p-2 bg-muted/40 border-b">
            <div className="text-xs">
              <span className="font-semibold">{selected.size}</span> of {candidates.length} selected
            </div>
            <div className="text-[11px] text-muted-foreground">Uncheck any student who should not be promoted (e.g. failed).</div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Adm. No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No students in the selected class/section.
                    </TableCell>
                  </TableRow>
                )}
                {candidates.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => toggle(s.id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-mono">{s.class}-{s.section}</Badge></TableCell>
                    <TableCell>{s.rollNo}</TableCell>
                    <TableCell className="text-xs">{s.attendance}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 bg-muted/30">
          <div className="text-sm">
            <span className="font-semibold">{selected.size}</span> student(s) will be promoted from{" "}
            <Badge variant="secondary">{fromClass}{fromSection !== "all" ? `-${fromSection}` : ""}</Badge> to{" "}
            <Badge variant="default">{toClass}{toSection !== "same" ? `-${toSection}` : ""}</Badge>
          </div>
          <Button className="gradient-primary border-0" onClick={promote}>
            <Trophy className="h-4 w-4" /> Promote Selected
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ================= Transfers Tab (Section + Stream + Archive + Requests) =================
function TransfersTab() {
  const students = useStudents();
  const classes = useClasses();
  const requests = useSectionChangeRequests();
  const activeStudents = useMemo(() => students.filter((s) => !s.archived), [students]);

  // ----- Section change (multi-select) -----
  const [secQ, setSecQ] = useState("");
  const [secSelected, setSecSelected] = useState<Set<string>>(new Set());
  const [secNewClass, setSecNewClass] = useState<string>("");
  const [secNewSection, setSecNewSection] = useState<string>("");
  const [secReason, setSecReason] = useState<string>("");

  const secFiltered = useMemo(
    () =>
      activeStudents.filter(
        (s) =>
          !secQ ||
          s.name.toLowerCase().includes(secQ.toLowerCase()) ||
          s.admissionNo.toLowerCase().includes(secQ.toLowerCase()) ||
          `${s.class}-${s.section}`.toLowerCase().includes(secQ.toLowerCase()),
      ),
    [activeStudents, secQ],
  );

  const toggleSec = (id: string) =>
    setSecSelected((p) => {
      const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
    });

  const moveSectionBulk = () => {
    if (secSelected.size === 0) return toast.error("Select at least one student");
    if (!secNewSection && !secNewClass) return toast.error("Choose a new class or section");
    let count = 0;
    secSelected.forEach((id) => {
      const s = students.find((x) => x.id === id);
      if (!s) return;
      const targetClass = secNewClass || s.class;
      const targetSection = secNewSection || s.section;
      studentsApi.update(s.id, { class: targetClass, section: targetSection });
      sectionChangeApi.add({
        studentId: s.id,
        studentName: s.name,
        fromClass: s.class,
        fromSection: s.section,
        toClass: targetClass,
        toSection: targetSection,
        reason: secReason || "Admin transfer",
        status: "Approved",
      });
      count++;
    });
    toast.success(`${count} student(s) moved`);
    setSecSelected(new Set());
    setSecNewClass(""); setSecNewSection(""); setSecReason("");
  };

  // ----- Stream change (multi-select) -----
  const [strQ, setStrQ] = useState("");
  const [strSelected, setStrSelected] = useState<Set<string>>(new Set());
  const [strNew, setStrNew] = useState<ClassDef["stream"]>("Commerce");
  const strFiltered = useMemo(
    () =>
      activeStudents.filter(
        (s) =>
          !strQ ||
          s.name.toLowerCase().includes(strQ.toLowerCase()) ||
          s.admissionNo.toLowerCase().includes(strQ.toLowerCase()),
      ),
    [activeStudents, strQ],
  );
  const toggleStr = (id: string) =>
    setStrSelected((p) => {
      const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
    });

  const changeStreamBulk = () => {
    if (strSelected.size === 0) return toast.error("Select at least one student");
    let credits = 0, debits = 0, done = 0;
    strSelected.forEach((id) => {
      const s = students.find((x) => x.id === id);
      if (!s) return;
      const oldFee = classesApi.feeFor(s.class, s.stream);
      const newFee = classesApi.feeFor(s.class, strNew);
      if (!newFee) return;
      studentsApi.update(s.id, { stream: strNew });
      const diff = oldFee - newFee;
      if (diff > 0) {
        walletApi.add({ studentId: s.id, type: "Credit", amount: diff, reason: `Stream change ${s.stream ?? "—"} → ${strNew}` });
        credits += diff;
      } else if (diff < 0) {
        walletApi.add({ studentId: s.id, type: "Debit", amount: -diff, reason: `Stream change ${s.stream ?? "—"} → ${strNew}` });
        debits += -diff;
      }
      done++;
    });
    if (done === 0) return toast.error(`No fee mapping for target ${strNew}. Add it in Classes tab.`);
    toast.success(
      `${done} switched to ${strNew}. Credits ₹${credits.toLocaleString("en-IN")}, Additional dues ₹${debits.toLocaleString("en-IN")}.`,
    );
    setStrSelected(new Set());
  };

  // ----- Archive student -----
  const [archOpen, setArchOpen] = useState(false);
  const [archStu, setArchStu] = useState<string>("");
  const [archType, setArchType] = useState<NonNullable<Student["archiveType"]>>("Left");
  const [archReason, setArchReason] = useState("");
  const [archBranch, setArchBranch] = useState("");

  const submitArchive = () => {
    const s = students.find((x) => x.id === archStu);
    if (!s) return toast.error("Pick a student");
    if (!archReason.trim()) return toast.error("Reason is required");
    studentsApi.archive(s.id, {
      archiveType: archType,
      archiveReason: archReason,
      archiveTargetBranch: archType === "Transferred" ? archBranch : undefined,
    });
    toast.success(`${s.name} archived (${archType})`);
    setArchOpen(false);
    setArchStu(""); setArchReason(""); setArchBranch(""); setArchType("Left");
  };

  const archivedList = useMemo(() => students.filter((s) => s.archived), [students]);

  const sectionOptions = ["A", "B", "C", "D", "E"];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Section Change */}
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Section Change</CardTitle>
            <CardDescription>Move one or many students to a different class/section.</CardDescription>
          </div>
          <Badge variant="secondary">{secSelected.size} selected</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={secQ} onChange={(e) => setSecQ(e.target.value)} placeholder="Search student…" className="pl-8" />
          </div>
          <div className="max-h-[240px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Current Class</TableHead>
                  <TableHead>Stream</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secFiltered.slice(0, 100).map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleSec(s.id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={secSelected.has(s.id)} onCheckedChange={() => toggleSec(s.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">{s.class}-{s.section}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{s.stream ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">New Class (optional)</Label>
              <Select value={secNewClass} onValueChange={setSecNewClass}>
                <SelectTrigger><SelectValue placeholder="Keep same" /></SelectTrigger>
                <SelectContent>{ROMAN_ORDER.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New Section</Label>
              <Select value={secNewSection} onValueChange={setSecNewSection}>
                <SelectTrigger><SelectValue placeholder="Pick section" /></SelectTrigger>
                <SelectContent>{sectionOptions.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason (optional)</Label>
            <Textarea value={secReason} onChange={(e) => setSecReason(e.target.value)} rows={2} />
          </div>
          <Button className="gradient-primary border-0 w-full" onClick={moveSectionBulk}>
            Move {secSelected.size} Student{secSelected.size === 1 ? "" : "s"}
          </Button>
        </CardContent>
      </Card>

      {/* Stream Change */}
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Stream Change</CardTitle>
            <CardDescription>Bulk stream switch. Fee differential is auto-credited to each student's wallet.</CardDescription>
          </div>
          <Badge variant="secondary">{strSelected.size} selected</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={strQ} onChange={(e) => setStrQ(e.target.value)} placeholder="Search student…" className="pl-8" />
          </div>
          <div className="max-h-[240px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Current Stream</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strFiltered.slice(0, 100).map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleStr(s.id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={strSelected.has(s.id)} onCheckedChange={() => toggleStr(s.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">{s.class}-{s.section}</Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline">{s.stream ?? "—"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">New Stream</Label>
            <Select value={strNew} onValueChange={(v) => setStrNew(v as ClassDef["stream"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STREAMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="gradient-primary border-0 w-full" onClick={changeStreamBulk}>
            Apply Stream Change ({strSelected.size})
          </Button>
          <div className="text-[11px] text-muted-foreground">
            Available streams in Classes: {Array.from(new Set(classes.map((c) => c.stream))).join(", ")}
          </div>
        </CardContent>
      </Card>

      {/* Archive Students */}
      <Card className="border-border/60 lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Archived Students</CardTitle>
            <CardDescription>Mark students as left the school or transferred to another branch. Archived students are hidden from active lists.</CardDescription>
          </div>
          <Button size="sm" className="gradient-primary border-0" onClick={() => setArchOpen(true)}>
            <Plus className="h-4 w-4" /> Archive Student
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Target Branch</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedList.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No archived students.</TableCell></TableRow>
              )}
              {archivedList.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono">{s.class}-{s.section}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{s.archiveType ?? "—"}</Badge></TableCell>
                  <TableCell className="text-xs max-w-xs truncate" title={s.archiveReason}>{s.archiveReason ?? "—"}</TableCell>
                  <TableCell className="text-xs">{s.archiveTargetBranch ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.archiveDate ?? "—"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => { studentsApi.restore(s.id); toast.success(`${s.name} restored`); }}>Restore</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Requests */}
      <Card className="border-border/60 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Student Requests</CardTitle>
          <CardDescription>Section change requests raised from the student portal.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-44">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.filter((r) => r.source === "portal").length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No portal requests yet.</TableCell></TableRow>
              )}
              {requests.filter((r) => r.source === "portal").map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.studentName}
                    <div className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()} · {r.requestType ?? "Section"} change</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.fromClass}-{r.fromSection}</Badge>
                    {r.fromStream && <div className="text-[10px] text-muted-foreground mt-0.5">Stream: {r.fromStream}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge>{r.toClass}-{r.toSection}</Badge>
                    {r.toStream && <div className="text-[10px] text-muted-foreground mt-0.5">Stream: {r.toStream}</div>}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate" title={r.reason}>{r.reason}</TableCell>
                  <TableCell><Badge variant={r.status === "Approved" ? "default" : r.status === "Rejected" ? "destructive" : "outline"}>{r.status}</Badge></TableCell>
                  <TableCell>
                    {r.status === "Pending" ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => {
                          sectionChangeApi.approve(r.id);
                          toast.success(`Approved ${r.studentName}'s ${r.requestType ?? "section"} request`);
                        }}>Approve</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                          sectionChangeApi.reject(r.id);
                          toast.success("Request rejected");
                        }}>Reject</Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </CardContent>
      </Card>

      {/* Archive Dialog */}
      <Dialog open={archOpen} onOpenChange={setArchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Student</DialogTitle>
            <DialogDescription>Mark this student as left the school or transferred to another branch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Student</Label>
              <Select value={archStu} onValueChange={setArchStu}>
                <SelectTrigger><SelectValue placeholder="Pick student" /></SelectTrigger>
                <SelectContent>
                  {activeStudents.slice(0, 200).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.class}-{s.section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Archive Type</Label>
              <Select value={archType} onValueChange={(v) => setArchType(v as NonNullable<Student["archiveType"]>)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Left", "Transferred", "Graduated", "Expelled", "Other"] as const).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {archType === "Transferred" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Target Branch</Label>
                <Input value={archBranch} onChange={(e) => setArchBranch(e.target.value)} placeholder="e.g. DPS Bangalore" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea value={archReason} onChange={(e) => setArchReason(e.target.value)} rows={3} placeholder="Reason for archiving" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={submitArchive}>Archive Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= Section Dialog =================
function SectionDialog({
  open, onOpenChange, edit, teacherOptions, rooms, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  edit: Section | null;
  teacherOptions: string[];
  rooms: ReturnType<typeof useRooms>;
  onSubmit: (payload: Omit<Section, "id">) => void;
}) {
  const classes = useClasses();
  const classOptions = useMemo(
    () => Array.from(new Set(classes.map((c) => c.name))),
    [classes],
  );
  const [name, setName] = useState("");
  const [klass, setKlass] = useState("");
  const [teacher, setTeacher] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [present, setPresent] = useState<number>(0);
  const [total, setTotal] = useState<number>(40);

  useEffect(() => {
    if (!open) return;
    setName(edit?.name ?? "");
    setKlass(edit?.class ?? "");
    setTeacher(edit?.teacher ?? "");
    setRoomNo(edit?.room ?? "");
    setPresent(edit?.students ?? 0);
    setTotal(edit?.cap ?? 40);
  }, [open, edit]);

  const submit = () => {
    if (!name.trim()) return toast.error("Section name is required");
    if (!klass) return toast.error("Select a class");
    if (total <= 0) return toast.error("Total capacity must be positive");
    if (present > total) return toast.error("Present capacity cannot exceed total capacity");
    onSubmit({
      name: name.trim(),
      class: klass,
      teacher: teacher || "—",
      room: roomNo,
      students: present,
      cap: total,
      subjects: edit?.subjects ?? 8,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{edit ? "Edit Section" : "Create New Section"}</DialogTitle>
          <DialogDescription>Define section name, class, class teacher, room and capacity.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Section Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. X-B" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Class</Label>
            <Select value={klass} onValueChange={setKlass}>
              <SelectTrigger><SelectValue placeholder="Pick class" /></SelectTrigger>
              <SelectContent>
                {(classOptions.length ? classOptions : ROMAN_ORDER).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Class Teacher</Label>
            <Select value={teacher} onValueChange={setTeacher}>
              <SelectTrigger><SelectValue placeholder="Pick teacher" /></SelectTrigger>
              <SelectContent>
                {(teacherOptions.length ? teacherOptions : ["—"]).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Room</Label>
            <Select value={roomNo} onValueChange={setRoomNo}>
              <SelectTrigger><SelectValue placeholder="Pick room" /></SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.no}>
                    {r.no} — {r.floor} · {r.building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Present Capacity</Label>
              <Input type="number" value={present} onChange={(e) => setPresent(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Capacity</Label>
              <Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={submit}>{edit ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ================= Subject Dialog =================
function SubjectDialog({
  open, onOpenChange, edit, teacherOptions, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  edit: Subject | null;
  teacherOptions: string[];
  onSubmit: (payload: Omit<Subject, "id">) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [type, setType] = useState<string>("Core");
  const [facultyCount, setFacultyCount] = useState<number>(1);
  const [faculties, setFaculties] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setCode(edit?.code ?? "");
    setName(edit?.name ?? "");
    setDept(edit?.dept ?? "");
    setType(edit?.type ?? "Core");
    setFacultyCount(edit?.faculty ?? (edit?.faculties?.length ?? 1));
    setFaculties(edit?.faculties ?? []);
  }, [open, edit]);

  const toggleFaculty = (t: string) =>
    setFaculties((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = () => {
    if (!code.trim()) return toast.error("Subject code is required");
    if (!name.trim()) return toast.error("Subject name is required");
    onSubmit({
      code: code.trim(),
      name: name.trim(),
      dept: dept.trim() || "General",
      type,
      classes: edit?.classes ?? 0,
      faculty: Math.max(facultyCount, faculties.length),
      faculties,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{edit ? "Edit Subject" : "Create New Subject"}</DialogTitle>
          <DialogDescription>Subject code, name, department, type and faculty.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Subject Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MTH101" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="e.g. Science, Humanities, Engineering" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Faculty Count</Label>
              <Input
                type="number"
                min={0}
                value={facultyCount}
                onChange={(e) => setFacultyCount(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Choose Faculties (multiple)</Label>
            <div className="rounded-md border max-h-48 overflow-y-auto p-2 space-y-1">
              {teacherOptions.length === 0 && (
                <div className="text-xs text-muted-foreground py-2 text-center">No teachers available.</div>
              )}
              {teacherOptions.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1">
                  <Checkbox checked={faculties.includes(t)} onCheckedChange={() => toggleFaculty(t)} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            {faculties.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {faculties.map((f) => <Badge key={f} variant="secondary">{f}</Badge>)}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={submit}>{edit ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



// ================= Departments Tab =================
function DepartmentsTab() {
  const departments = useDepartments();
  const subjects = useSubjects();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [head, setHead] = useState("");
  const [description, setDescription] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);

  const reset = () => { setName(""); setHead(""); setDescription(""); setSubjectIds([]); setEdit(null); };
  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (d: Department) => {
    setEdit(d);
    setName(d.name);
    setHead(d.head ?? "");
    setDescription(d.description ?? "");
    setSubjectIds(d.subjectIds ?? []);
    setOpen(true);
  };
  const toggleSubject = (id: string) =>
    setSubjectIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const save = () => {
    if (!name.trim()) return toast.error("Department name is required");
    if (edit) {
      departmentsApi.update(edit.id, { name, head, description, subjectIds });
      toast.success(`${name} updated`);
    } else {
      departmentsApi.add({ name, head, description, subjectIds });
      toast.success(`${name} created`);
    }
    setOpen(false);
    reset();
  };

  // Subjects mapped to a department either by explicit id OR by matching dept name.
  const subjectsForDept = (d: Department) => {
    const byId = subjects.filter((s) => (d.subjectIds ?? []).includes(s.id));
    if (byId.length > 0) return byId;
    return subjects.filter((s) => s.dept === d.name);
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Departments</CardTitle>
            <CardDescription>Group subjects and faculty under academic departments. One department can own many subjects.</CardDescription>
          </div>
          <Button size="sm" className="gradient-primary border-0" onClick={openNew}>
            <Plus className="h-4 w-4" /> New Department
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No departments yet.</TableCell></TableRow>
              )}
              {departments.filter((d) => !d.archived).map((d) => {
                const subs = subjectsForDept(d);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-sm">{d.head || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {subs.length === 0 && <span className="text-xs text-muted-foreground">No subjects assigned</span>}
                        {subs.slice(0, 6).map((s) => (
                          <Badge key={s.id} variant="secondary" className="text-[10px]">{s.name}</Badge>
                        ))}
                        {subs.length > 6 && <Badge variant="outline" className="text-[10px]">+{subs.length - 6} more</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={d.description}>{d.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { departmentsApi.remove(d.id); toast.success(`${d.name} removed`); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit ? "Edit Department" : "New Department"}</DialogTitle>
            <DialogDescription>Assign one or many subjects to this department.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Department Head</Label>
                <Input value={head} onChange={(e) => setHead(e.target.value)} placeholder="e.g. Mr. R. Verma" />
              </div>
              <div>
                <Label className="text-xs">Subjects selected</Label>
                <Input disabled value={`${subjectIds.length} subject${subjectIds.length === 1 ? "" : "s"}`} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Assign Subjects</Label>
              <div className="rounded-md border max-h-56 overflow-y-auto p-2 space-y-1">
                {subjects.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">No subjects available. Add subjects first.</div>}
                {subjects.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1">
                    <Checkbox checked={subjectIds.includes(s.id)} onCheckedChange={() => toggleSubject(s.id)} />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{s.code}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="gradient-primary border-0" onClick={save}>{edit ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
