## Scope

Frontend-only changes (no backend). All state persists via existing localStorage/store patterns.

## 1. Examinations Module (`src/routes/exams.tsx`)

- **Question Bank rework**: top filter row → Class, Subject, Exam Category dropdowns. Below: "Add Questions" panel that lets the admin add multiple questions in one form (repeatable rows: question text via rich textarea, marks, type, optional image upload). A "+ Add another question" button appends rows; single Save commits all.
- Keep existing OCR scan as an optional source.
- **Exam Schedule**: "Add Exam Schedule" button opens dialog (Category, Class, Section, Date, Time, Duration, Room). Schedule view groups by category (e.g. "Half Yearly", "Term 1") as collapsible cards showing the papers under each.

## 2. Attendance Module (`src/routes/attendance.tsx`)

Split into two top-level tabs: **Students** and **Staff**, each with its own sub-tabs:

- Students: Mark Attendance (filter by Class / Section / Subject), Leave Requests, Corrections, Chronic Absentees.
- Staff: Mark Staff Attendance (list of employees), Staff Leave Requests, Staff Corrections, Staff Chronic Absentees.

## 3. Hostel Module (`src/routes/hostel.tsx`)

- **Add Block** form gains: Block Name, Hostel Type (Boys/Girls/Mixed), Warden Name, **Number of Wardens** (numeric).
- **Allocation tab**: "Add Allocation" dialog → student list with Class/Section filters + multi-select checkboxes on one side, available rooms list with multi-select on the other. Submit performs bulk allocation (round-robin students into selected rooms respecting capacity).

## 4. Student Details Screen (`src/routes/students.$id.tsx`)

Rebuild as tabbed detail view:

1. **Overview** — Personal, Academic, Guardian/Family, Address, Services cards (pulled from admission record).
2. **Documents** — list of attached docs from admission.
3. **Attendance** — summary KPIs, daily records table, week/month filter, simple bar chart (recharts already in stack).
4. **Assignments** — assignment list w/ scores, subject + week/month filter.
5. **Results** — subject-wise marks grouped by exam type, summary, "Generate Report Card" button (print view).
6. **Fees** — totals (paid / pending / late), pending alert banner and admin can send a Fee Payment notification as well, payment history table.
7. **Transport** — route & vehicle details, route history, transport attendance toggle list.
8. **Hostel** — room details, hostel admission date, fooding history.
9. **Activity** — audit log entries for this student.

All data sourced from existing mock/store; missing fields surfaced as empty-state placeholders.

## Technical Notes

- Reuse shadcn `Tabs`, `Card`, `Table`, `Dialog`, `Checkbox`, `Select`.
- Charts via `recharts` (already installed).
- No new packages, no server functions, no schema changes beyond extending mock types where needed (hostel block warden count, student activity log array).
- Each route stays a single file; extract small sub-components inline to keep diff reviewable.

## Out of Scope

- No backend wiring, no auth changes, no new routes added beyond what already exists.
- Existing modules not listed remain untouched.