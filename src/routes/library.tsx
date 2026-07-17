import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Library, Plus, BookOpen, Clock, IndianRupee, Search, BookPlus } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { CrudDialog } from "@/components/crud-dialog";
import { useStudents } from "@/lib/store";
import { DataMigrationBar } from "@/components/data-migration-bar";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Library — Edureon ERP" }] }),
  component: LibraryPage,
});

type Book = { isbn: string; title: string; author: string; category: string; copies: number };
type Issue = {
  id: string; isbn: string; title: string;
  studentId: string; studentName: string;
  issuedOn: string; dueOn: string; returnedOn?: string;
  feePerDay: number; fineCollected: number;
};

const SEED_BOOKS: Book[] = [
  { isbn: "9780140328721", title: "The Diary of a Young Girl", author: "Anne Frank", category: "Biography", copies: 12 },
  { isbn: "9780553213119", title: "Wuthering Heights", author: "Emily Brontë", category: "Classic", copies: 8 },
  { isbn: "9788126415839", title: "Wings of Fire", author: "A.P.J. Abdul Kalam", category: "Biography", copies: 18 },
  { isbn: "9789386797339", title: "NCERT Maths Class X", author: "NCERT", category: "Textbook", copies: 240 },
  { isbn: "9780062315007", title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", copies: 14 },
  { isbn: "9780141321035", title: "Charlie and the Chocolate Factory", author: "Roald Dahl", category: "Children", copies: 10 },
];

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
const daysBetween = (a: string, b: string) => Math.floor((+new Date(b) - +new Date(a)) / 86400000);

const SEED_ISSUES: Issue[] = [
  { id: "C-2841", isbn: "9788126415839", title: "Wings of Fire", studentId: "STU1003", studentName: "Aarav Sharma", issuedOn: addDays(today(), -20), dueOn: addDays(today(), -6), feePerDay: 5, fineCollected: 0 },
  { id: "C-2840", isbn: "9780062315007", title: "The Alchemist", studentId: "STU1007", studentName: "Diya Verma", issuedOn: addDays(today(), -5), dueOn: addDays(today(), 9), feePerDay: 5, fineCollected: 0 },
  { id: "C-2838", isbn: "9780553213119", title: "Wuthering Heights", studentId: "STU1011", studentName: "Kiara Mehta", issuedOn: addDays(today(), -30), dueOn: addDays(today(), -16), returnedOn: addDays(today(), -10), feePerDay: 5, fineCollected: 30 },
];

function calcFine(iss: Issue, refDate = today()): number {
  if (iss.returnedOn) return iss.fineCollected;
  const overdue = daysBetween(iss.dueOn, refDate);
  return overdue > 0 ? overdue * iss.feePerDay : 0;
}

function LibraryPage() {
  const students = useStudents();
  const [books, setBooks] = useState<Book[]>(SEED_BOOKS);
  const [issues, setIssues] = useState<Issue[]>(SEED_ISSUES);
  const [addBook, setAddBook] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [query, setQuery] = useState("");

  const availableMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of books) m[b.isbn] = b.copies;
    for (const i of issues) if (!i.returnedOn) m[i.isbn] = (m[i.isbn] ?? 0) - 1;
    return m;
  }, [books, issues]);

  const active = issues.filter((i) => !i.returnedOn);
  const overdue = active.filter((i) => calcFine(i) > 0);
  const totalFines = issues.reduce((s, i) => s + calcFine(i), 0);
  const filtered = books.filter((b) => !query || (b.isbn + b.title + b.author).toLowerCase().includes(query.toLowerCase()));

  const handleReturn = (id: string) => {
    setIssues((p) => p.map((i) => {
      if (i.id !== id) return i;
      const fine = calcFine(i);
      toast.success(fine > 0 ? `Returned · Fine ₹${fine} collected` : "Returned");
      return { ...i, returnedOn: today(), fineCollected: fine };
    }));
  };

  return (
    <PageContainer>
      <PageHeader eyebrow="Operations" title="Library & Circulation"
        description="Catalog, issue books to students with due dates, and auto-calculate late fees for overdue returns."
        actions={<>
          <DataMigrationBar
            moduleName="Library Catalog"
            rows={books}
            columns={[
              { header: "ISBN", accessor: (b) => b.isbn },
              { header: "Title", accessor: (b) => b.title },
              { header: "Author", accessor: (b) => b.author },
              { header: "Category", accessor: (b) => b.category },
              { header: "Copies", accessor: (b) => b.copies },
            ]}
          />
          <Button variant="outline" size="sm" onClick={() => setAddBook(true)}><BookPlus className="h-4 w-4" />Add Book</Button>
          <Button size="sm" className="gradient-primary border-0" onClick={() => setIssueOpen(true)}><Plus className="h-4 w-4" />Issue Book</Button>
        </>}
      />

      <CrudDialog open={addBook} onOpenChange={setAddBook} title="Add Book"
        fields={[
          { name: "isbn", label: "ISBN" },
          { name: "title", label: "Title" },
          { name: "author", label: "Author" },
          { name: "category", label: "Category", type: "select", options: ["Fiction", "Biography", "Classic", "Textbook", "Children", "Reference", "Magazine"] },
          { name: "copies", label: "Copies", type: "number" },
        ]}
        submitLabel="Add Book"
        onSubmit={(d) => setBooks((p) => [{ isbn: String(d.isbn), title: String(d.title), author: String(d.author), category: String(d.category), copies: Number(d.copies) || 1 }, ...p])}
      />

      {issueOpen && (
        <IssueDialog books={books} availableMap={availableMap} students={students}
          onClose={() => setIssueOpen(false)}
          onIssue={(iss) => { setIssues((p) => [iss, ...p]); toast.success(`Issued "${iss.title}" to ${iss.studentName}`); setIssueOpen(false); }}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Catalog" value={books.length} icon={<Library className="h-5 w-5" />} tone="primary" />
        <KpiCard label="Issued" value={active.length} icon={<BookOpen className="h-5 w-5" />} tone="info" />
        <KpiCard label="Overdue" value={overdue.length} icon={<Clock className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Pending Fines" value={"₹" + totalFines.toLocaleString("en-IN")} icon={<IndianRupee className="h-5 w-5" />} tone="success" />
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="active">Active Issues</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div><CardTitle className="text-base">Book Catalog</CardTitle><CardDescription>{books.length} titles · click Issue Book to assign one to a student</CardDescription></div>
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="ISBN, title or author" className="pl-8 h-9" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>ISBN</TableHead><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Category</TableHead><TableHead>Copies</TableHead><TableHead>Available</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((b) => {
                    const av = availableMap[b.isbn] ?? b.copies;
                    return (
                      <TableRow key={b.isbn}>
                        <TableCell className="font-mono text-xs">{b.isbn}</TableCell>
                        <TableCell className="font-medium">{b.title}</TableCell>
                        <TableCell className="text-sm">{b.author}</TableCell>
                        <TableCell><Badge variant="secondary">{b.category}</Badge></TableCell>
                        <TableCell className="tabular-nums">{b.copies}</TableCell>
                        <TableCell><Badge variant={av <= 0 ? "destructive" : av < 3 ? "default" : "secondary"}>{av}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <IssuesTable issues={active} onReturn={handleReturn} />
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
          <IssuesTable issues={overdue} onReturn={handleReturn} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <IssuesTable issues={issues.filter((i) => i.returnedOn)} onReturn={handleReturn} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function IssuesTable({ issues, onReturn }: { issues: Issue[]; onReturn: (id: string) => void }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Book</TableHead><TableHead>Student</TableHead><TableHead>Issued</TableHead><TableHead>Due</TableHead><TableHead>Returned</TableHead><TableHead>Fee/day</TableHead><TableHead>Fine</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {issues.map((i) => {
              const fine = calcFine(i);
              const overdue = !i.returnedOn && fine > 0;
              return (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell className="text-sm font-medium">{i.title}</TableCell>
                  <TableCell className="text-sm">{i.studentName} <span className="font-mono text-[10px] text-muted-foreground">· {i.studentId}</span></TableCell>
                  <TableCell className="text-xs">{i.issuedOn}</TableCell>
                  <TableCell className="text-xs">{i.dueOn}{overdue && <Badge variant="destructive" className="ml-1 text-[9px]">Overdue</Badge>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{i.returnedOn ?? "—"}</TableCell>
                  <TableCell className="tabular-nums text-xs">₹{i.feePerDay}</TableCell>
                  <TableCell className={`tabular-nums text-sm ${fine > 0 && !i.returnedOn ? "text-destructive font-semibold" : ""}`}>{fine > 0 ? `₹${fine}` : "—"}</TableCell>
                  <TableCell>{!i.returnedOn && <Button size="sm" variant="outline" onClick={() => onReturn(i.id)}>Return</Button>}</TableCell>
                </TableRow>
              );
            })}
            {issues.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No records.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function IssueDialog({ books, availableMap, students, onClose, onIssue }: {
  books: Book[]; availableMap: Record<string, number>;
  students: Array<{ id: string; name: string }>;
  onClose: () => void; onIssue: (iss: Issue) => void;
}) {
  const availableBooks = books.filter((b) => (availableMap[b.isbn] ?? 0) > 0);
  const [isbn, setIsbn] = useState(availableBooks[0]?.isbn ?? "");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [studentQuery, setStudentQuery] = useState("");
  const [issuedOn, setIssuedOn] = useState(today());
  const [dueOn, setDueOn] = useState(addDays(today(), 14));
  const [feePerDay, setFeePerDay] = useState(5);

  const book = books.find((b) => b.isbn === isbn);
  const student = students.find((s) => s.id === studentId);
  const filteredStudents = students.filter((s) => !studentQuery || (s.name + s.id).toLowerCase().includes(studentQuery.toLowerCase())).slice(0, 50);

  const submit = () => {
    if (!book || !student) { toast.error("Pick a book and student"); return; }
    onIssue({
      id: "C-" + Math.floor(Math.random() * 9000 + 1000),
      isbn: book.isbn, title: book.title,
      studentId: student.id, studentName: student.name,
      issuedOn, dueOn, feePerDay, fineCollected: 0,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Issue Book to Student</DialogTitle>
          <DialogDescription>Set the return date and per-day late fee. Fines auto-calculate when overdue.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Book ({availableBooks.length} available)</Label>
            <Select value={isbn} onValueChange={setIsbn}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">{availableBooks.map((b) => <SelectItem key={b.isbn} value={b.isbn}>{b.title} — {b.author} ({availableMap[b.isbn]} left)</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Search Student</Label>
            <Input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Name or ID…" />
          </div>
          <div>
            <Label className="text-xs">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Pick student" /></SelectTrigger>
              <SelectContent className="max-h-72">{filteredStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Issued On</Label><Input type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} /></div>
            <div><Label className="text-xs">Return By</Label><Input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} /></div>
            <div><Label className="text-xs">Late Fee (₹/day)</Label><Input type="number" value={feePerDay} onChange={(e) => setFeePerDay(Number(e.target.value))} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gradient-primary border-0" onClick={submit} disabled={!book || !student}>Issue Book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
