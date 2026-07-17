import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/student/library")({
  head: () => ({ meta: [{ title: "Library — Edureon" }] }),
  component: StudentLibrary,
});

const issued = [
  { title: "Hall & Knight — Higher Algebra", isbn: "978-8121928571", issued: "10 Nov 2025", due: "28 Nov 2025", overdue: false },
  { title: "NCERT Physics — Part II", isbn: "978-8174506931", issued: "14 Nov 2025", due: "02 Dec 2025", overdue: false },
];

const catalog = [
  { title: "RD Sharma — Class X Mathematics", author: "R.D. Sharma", category: "Mathematics", available: 4 },
  { title: "Pradeep's Fundamental Physics", author: "K.L. Gomber", category: "Physics", available: 0 },
  { title: "Concise Inorganic Chemistry", author: "J.D. Lee", category: "Chemistry", available: 2 },
  { title: "Wings of Fire", author: "A.P.J. Abdul Kalam", category: "Biography", available: 6 },
  { title: "Sapiens — A Brief History", author: "Yuval N. Harari", category: "History", available: 3 },
  { title: "The Diary of a Young Girl", author: "Anne Frank", category: "Literature", available: 5 },
];

const history = [
  { title: "Ignited Minds", returned: "12 Oct 2025", fine: 0 },
  { title: "Class IX NCERT — Beehive", returned: "20 Aug 2025", fine: 10 },
];

function StudentLibrary() {
  const [q, setQ] = useState("");
  const results = catalog.filter((c) => !q || (c.title + c.author).toLowerCase().includes(q.toLowerCase()));

  return (
    <PageContainer>
      <PageHeader eyebrow="Student Portal" title="Library" description="My issued books, catalogue search, and reading history." />

      <Tabs defaultValue="my" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my">My Books</TabsTrigger>
          <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="my">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-display text-base">Currently Issued</CardTitle><CardDescription>{issued.length} books</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {issued.map((b) => (
                <div key={b.isbn} className="flex items-center gap-3 p-3 border rounded-md">
                  <div className="h-10 w-10 rounded-md flex items-center justify-center bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{b.title}</div>
                    <div className="text-[11px] text-muted-foreground">ISBN {b.isbn} · Issued {b.issued}</div>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">Due {b.due}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="font-display text-base">Search Catalogue</CardTitle>
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or author…" className="pl-8 h-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Available</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {results.map((c) => (
                    <TableRow key={c.title}>
                      <TableCell className="text-sm font-medium">{c.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.author}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{c.category}</Badge></TableCell>
                      <TableCell className="text-right text-sm">{c.available > 0 ? <span className="text-success font-semibold">{c.available}</span> : <span className="text-destructive">0</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant={c.available > 0 ? "outline" : "ghost"} disabled={c.available === 0} onClick={() => toast.success(`Reserved: ${c.title}`)}>
                          {c.available > 0 ? "Reserve" : "Waitlist"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-display text-base">Reading History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {history.map((h) => (
                <div key={h.title} className="flex items-center gap-3 p-3 border rounded-md">
                  <div className="h-9 w-9 rounded-md flex items-center justify-center bg-muted"><BookOpen className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium">{h.title}</div><div className="text-[11px] text-muted-foreground">Returned {h.returned}</div></div>
                  {h.fine > 0 ? <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Fine ₹{h.fine}</Badge> : <Badge variant="outline" className="bg-success/10 text-success border-success/20">No fine</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
