# My Institute LMS — Updated

A Flask + SQLite LMS with 3 login types:
- Institute Admin
- Trainer
- Student + Parent

## Updated role behavior

### Institute Admin
- Full institute management access.
- Courses, trainers, batches, students, parents/guardians.
- Attendance, announcements/materials, assessments, reports, payments.
- Live sessions: create/generate Jitsi links and add recordings.
- Discussion forum.
- PDF/Excel exports.

### Trainer
- Home page is available with the same quick-action layout.
- Only assigned courses, batches, students, guardians, attendance, assessments, materials, sessions and recordings are shown.
- No institute-wide trainer/student/course data is exposed.
- No Payments or Reports menu/access.
- Can add materials for assigned courses/batches.
- Can manage attendance, assessments, sessions and assigned student/guardian records.
- Can generate Jitsi live-session links and add recordings.
- Discussion forum.

### Student + Parent
- No Home, Parents/Guardian management, or institute management pages.
- Courses page shows only courses enrolled by the logged-in student.
- Attendance shows only that student's attendance.
- Payments show only that student's payments.
- Reports contain only that student's Attendance and Assessment reports.
- Assessments are filtered to the student's enrolled course/batch.
- Announcements/materials are limited to the student's learning scope.
- Live Sessions and Live Recordings are limited to the student's batch.
- Discussion forum is available.

## Run

1. Create a virtual environment.
2. Install dependencies:
   `pip install -r requirements.txt`
3. Run:
   `python app.py`
4. Open:
   `http://127.0.0.1:5000`

## Demo accounts

- Admin: `admin` / `admin123`
- Trainer: `trainer` / `trainer123`
- Student + Parent: `student` / `student123`

If an older `lms.db` exists from a previous version, delete it once before running this build so the seed data is recreated.

## Notes

- Live classes use Jitsi Meet links.
- SQLite is used for persistence.
- PDF exports use ReportLab.
- Excel exports use openpyxl.
