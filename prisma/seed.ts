// prisma/seed.ts
// Seeds a small but believable rural school: staff, ~60 pupils across five
// classes, four weeks of attendance history, and a live notice board.
//
// Every date is derived from "today" at run time, so a freshly seeded database
// never shows a notice board frozen in the past.

import { PrismaClient, type AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- date helpers -----------------------------------------------------------

function startOfToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isWeekend(date: Date): boolean {
  return date.getUTCDay() === 0; // Indian schools commonly run Monday–Saturday
}

/** The last `count` school days, oldest first. */
function recentSchoolDays(count: number): Date[] {
  const days: Date[] = [];
  let cursor = startOfToday();

  while (days.length < count) {
    if (!isWeekend(cursor)) days.unshift(new Date(cursor));
    cursor = addDays(cursor, -1);
  }

  return days;
}

// --- deterministic pseudo-randomness ---------------------------------------

/**
 * A seeded generator keeps the demo data stable between runs, so screenshots
 * and manual test steps stay reproducible.
 */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

const random = makeRandom(20260907);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

// --- source data ------------------------------------------------------------

const FIRST_NAMES = [
  "Aarav",
  "Ananya",
  "Advik",
  "Bhavna",
  "Chetan",
  "Divya",
  "Farhan",
  "Gauri",
  "Harsh",
  "Ishita",
  "Jatin",
  "Kavya",
  "Lakshmi",
  "Manish",
  "Neha",
  "Omkar",
  "Pooja",
  "Rahul",
  "Sanya",
  "Tanvi",
  "Uday",
  "Vikram",
  "Yash",
  "Zoya",
  "Rohan",
  "Priya",
  "Amit",
  "Meera",
  "Nitin",
  "Sneha",
  "Kiran",
  "Deepak",
];

const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Patil",
  "Reddy",
  "Kumar",
  "Singh",
  "Yadav",
  "Gowda",
  "Nair",
  "Das",
  "Joshi",
  "Chauhan",
  "Mishra",
  "Rathore",
  "Pawar",
  "Bhatt",
];

const CLASSES = [
  { grade: 5, section: "A", size: 14 },
  { grade: 6, section: "A", size: 13 },
  { grade: 7, section: "A", size: 12 },
  { grade: 7, section: "B", size: 11 },
  { grade: 8, section: "A", size: 12 },
];

const ATTENDANCE_WEIGHTS: { status: AttendanceStatus; weight: number }[] = [
  { status: "PRESENT", weight: 86 },
  { status: "ABSENT", weight: 7 },
  { status: "LATE", weight: 5 },
  { status: "EXCUSED", weight: 2 },
];

function weightedStatus(): AttendanceStatus {
  const roll = random() * 100;
  let cumulative = 0;

  for (const entry of ATTENDANCE_WEIGHTS) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.status;
  }

  return "PRESENT";
}

// --- seeding ----------------------------------------------------------------

async function seedStaff() {
  const [adminPassword, teacherPassword] = await Promise.all([
    bcrypt.hash("Admin@12345", 12),
    bcrypt.hash("Teacher@123", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ruraledu.in" },
    update: { password: adminPassword, role: "ADMIN", name: "R. Krishnan" },
    create: {
      email: "admin@ruraledu.in",
      name: "R. Krishnan",
      password: adminPassword,
      role: "ADMIN",
      phone: "9876500001",
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@ruraledu.in" },
    update: {
      password: teacherPassword,
      role: "TEACHER",
      name: "Sunita Deshmukh",
    },
    create: {
      email: "teacher@ruraledu.in",
      name: "Sunita Deshmukh",
      password: teacherPassword,
      role: "TEACHER",
      phone: "9876500002",
    },
  });

  return { admin, teacher };
}

async function seedStudents() {
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();

  const rows = CLASSES.flatMap((klass) =>
    Array.from({ length: klass.size }, (_, index) => {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      return {
        name,
        rollNumber: String(index + 1).padStart(2, "0"),
        grade: klass.grade,
        section: klass.section,
        guardianName: `${pick(FIRST_NAMES)} ${name.split(" ")[1]}`,
        guardianPhone: `98${Math.floor(random() * 90_000_000 + 10_000_000)}`,
        isActive: true,
      };
    })
  );

  await prisma.student.createMany({ data: rows });

  return prisma.student.findMany({ select: { id: true } });
}

async function seedAttendance(studentIds: number[], markedById: number) {
  // Four weeks of history gives the dashboard a trend to draw, and leaves
  // today's register deliberately empty so there is something to mark.
  const days = recentSchoolDays(21).slice(0, -1);

  const records = days.flatMap((date) =>
    studentIds.map((studentId) => ({
      studentId,
      date,
      status: weightedStatus(),
      markedById,
    }))
  );

  // Chunked so a large insert cannot exceed the parameter limit.
  for (let i = 0; i < records.length; i += 1_000) {
    await prisma.attendance.createMany({
      data: records.slice(i, i + 1_000),
      skipDuplicates: true,
    });
  }

  return records.length;
}

async function seedNotices(authorId: number) {
  await prisma.notice.deleteMany();

  const today = startOfToday();

  const notices = [
    {
      title: "Half-yearly examination timetable released",
      content:
        "The half-yearly examinations for Grades 5 to 8 begin on Monday next week and run for six working days. The detailed subject-wise timetable has been put up on the notice board outside the staff room and shared with every class teacher.\n\nStudents must carry their hall ticket and school identity card to each paper. Papers begin at 9:30 AM sharp; no student will be admitted to the examination hall after 9:45 AM. Bring your own geometry box, pens and pencils — sharing is not permitted during the examination.",
      category: "EXAM" as const,
      priority: "URGENT" as const,
      authorName: "Examination Cell",
      isPinned: true,
      publishedAt: addDays(today, -1),
      expiresAt: addDays(today, 21),
    },
    {
      title: "Parent-teacher meeting on Saturday",
      content:
        "The quarterly parent-teacher meeting is scheduled for this Saturday from 9:00 AM to 1:00 PM in the respective classrooms.\n\nParents can review their child's progress report, attendance record and classwork with the class teacher. Those who cannot attend in person may call the school office between 10:00 AM and 4:00 PM on any working day to arrange a phone conversation instead.",
      category: "MEETING" as const,
      priority: "HIGH" as const,
      authorName: "Academic Coordinator",
      isPinned: true,
      publishedAt: addDays(today, -2),
      expiresAt: addDays(today, 6),
    },
    {
      title: "Mid-day meal menu revised for this month",
      content:
        "Following the nutrition committee's review, the mid-day meal menu has been revised to add sprouts twice a week and seasonal fruit on Fridays.\n\nParents of children with any food allergy are requested to inform the class teacher in writing. The revised menu is displayed near the kitchen and in every classroom.",
      category: "FACILITY" as const,
      priority: "NORMAL" as const,
      authorName: "School Office",
      isPinned: false,
      publishedAt: addDays(today, -3),
      expiresAt: addDays(today, 30),
    },
    {
      title: "Inter-village kabaddi tournament — selection trials",
      content:
        "Selection trials for the inter-village kabaddi tournament will be held on the school ground from 3:30 PM on Thursday and Friday.\n\nBoys and girls from Grades 6 to 8 are eligible. Interested students should give their names to the physical education teacher by Wednesday afternoon and report in sports uniform. Bring a water bottle.",
      category: "SPORTS" as const,
      priority: "NORMAL" as const,
      authorName: "Physical Education Department",
      isPinned: false,
      publishedAt: addDays(today, -4),
      expiresAt: addDays(today, 10),
    },
    {
      title: "Free textbook distribution for Grades 5 to 8",
      content:
        "Textbooks supplied under the state free-textbook scheme will be distributed from the school library between 11:00 AM and 1:00 PM on Tuesday and Wednesday.\n\nStudents must collect their set in person and sign the register. Any student who has not received a complete set by Wednesday should report to the librarian the same day. Cover your books before use — they are to be returned in good condition at the end of the academic year.",
      category: "ACADEMIC" as const,
      priority: "HIGH" as const,
      authorName: "Librarian",
      isPinned: false,
      publishedAt: addDays(today, -6),
      expiresAt: addDays(today, 14),
    },
    {
      title: "School closed on account of local festival",
      content:
        "The school will remain closed next Monday on account of the local village festival. Classes resume as usual on Tuesday.\n\nThe day will be compensated by a working Saturday later in the term; the exact date will be announced separately.",
      category: "HOLIDAY" as const,
      priority: "HIGH" as const,
      authorName: "Principal's Office",
      isPinned: false,
      publishedAt: addDays(today, -8),
      expiresAt: addDays(today, 12),
    },
    {
      title: "Science exhibition — entries invited",
      content:
        "Entries are invited for the annual science exhibition to be held at the end of this month. Students may work individually or in teams of up to three.\n\nThis year's theme is 'Water in our village'. Working models, charts and survey projects are all welcome. Submit a one-page project outline to your science teacher within ten days. Materials for shortlisted projects will be provided by the school.",
      category: "EVENT" as const,
      priority: "NORMAL" as const,
      authorName: "Science Department",
      isPinned: false,
      publishedAt: addDays(today, -10),
      expiresAt: addDays(today, 20),
    },
    {
      title: "Health check-up camp completed",
      content:
        "The annual health check-up camp conducted with the primary health centre has been completed for all classes. Individual reports have been sent home with the students.\n\nParents of children advised follow-up care are requested to visit the primary health centre with the report. The school counsellor is available on Wednesdays for any questions.",
      category: "GENERAL" as const,
      priority: "LOW" as const,
      authorName: "School Office",
      isPinned: false,
      publishedAt: addDays(today, -15),
      expiresAt: null,
    },
  ];

  await prisma.notice.createMany({
    data: notices.map((notice) => ({ ...notice, authorId })),
  });

  return notices.length;
}

async function main() {
  console.log("Seeding RuralEdu…");

  const { admin, teacher } = await seedStaff();
  console.log(
    `  staff        : ${admin.email} (ADMIN), ${teacher.email} (TEACHER)`
  );

  const students = await seedStudents();
  console.log(
    `  students     : ${students.length} across ${CLASSES.length} classes`
  );

  const attendanceCount = await seedAttendance(
    students.map((student) => student.id),
    teacher.id
  );
  console.log(
    `  attendance   : ${attendanceCount} records (today left unmarked)`
  );

  const noticeCount = await seedNotices(admin.id);
  console.log(`  notices      : ${noticeCount} published`);

  console.log("\nDone. Sign in with:");
  console.log("  admin@ruraledu.in   / Admin@12345");
  console.log("  teacher@ruraledu.in / Teacher@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
