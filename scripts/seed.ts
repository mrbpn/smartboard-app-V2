/**
 * Seed script — run once to populate the database with demo data.
 * Usage: npm run db:seed
 *
 * Make sure DATABASE_URL is set in your .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/schema";

const sql = neon(process.env.DATABASE_URL!);
const db  = drizzle(sql, { schema });

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data     = encoder.encode(password);
  const buf      = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
  console.log("🌱 Seeding database…\n");

  // ── 1. Demo teacher ──────────────────────────────────────────
  console.log("👤 Creating demo teacher…");
  const password_hash = await hashPassword("password");
  const [teacher] = await db
    .insert(schema.users)
    .values({
      name:          "Ms. Sarah Chen",
      email:         "teacher@school.edu",
      role:          "teacher",
      password_hash,
    })
    .onConflictDoNothing()
    .returning();

  if (!teacher) {
    console.log("   ↳ Teacher already exists, skipping.");
  } else {
    console.log(`   ↳ Created teacher: ${teacher.email} (id: ${teacher.id})`);
  }

  // Fetch teacher id (in case already existed)
  const { eq } = await import("drizzle-orm");
  const [existingTeacher] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "teacher@school.edu"))
    .limit(1);

  const teacherId = teacher?.id ?? existingTeacher?.id;
  if (!teacherId) throw new Error("Could not find or create teacher");

  // ── 2. Built-in templates ────────────────────────────────────
  console.log("\n📚 Creating lesson templates…");
  const templateData = [
    {
      title: "Cell Biology Introduction", subject: "Biology", grade_level: "Grade 8",
      type: "lesson" as const, is_builtin: true,
      slides: [
        { title: "What is a Cell?",       content: "The cell is the basic unit of life. All living organisms are made of one or more cells.", type: "text" },
        { title: "Cell Types",            content: "There are two main types: prokaryotic (no nucleus) and eukaryotic (with nucleus).", type: "text" },
        { title: "Cell Organelles",       content: "Organelles are structures within the cell, each with a specific function. Examples: mitochondria, nucleus, ribosomes.", type: "text" },
        { title: "Cell Membrane",         content: "The cell membrane controls what enters and exits the cell — it is selectively permeable.", type: "text" },
        { title: "Summary",              content: "Cells are the building blocks of life. Understanding cell structure is fundamental to all biology.", type: "text" },
      ],
    },
    {
      title: "Newton's Laws of Motion", subject: "Physics", grade_level: "Grade 9",
      type: "lesson" as const, is_builtin: true,
      slides: [
        { title: "First Law — Inertia",   content: "An object at rest stays at rest; an object in motion stays in motion unless acted on by an external force.", type: "text" },
        { title: "Second Law — F=ma",     content: "Force equals mass times acceleration. A greater force produces greater acceleration.", type: "text" },
        { title: "Third Law — Action/Reaction", content: "For every action there is an equal and opposite reaction.", type: "text" },
        { title: "Real-World Examples",   content: "Rockets, car crashes, and sports all demonstrate Newton's three laws in action.", type: "text" },
        { title: "Summary",              content: "Newton's three laws describe how forces and motion are related — foundational to classical mechanics.", type: "text" },
      ],
    },
    {
      title: "Algebra Basics", subject: "Math", grade_level: "Grade 7",
      type: "lesson" as const, is_builtin: true,
      slides: [
        { title: "What is Algebra?",      content: "Algebra uses symbols (variables) to represent unknown numbers and express relationships between quantities.", type: "text" },
        { title: "Variables",             content: "A variable like x or y represents an unknown value we want to find.", type: "text" },
        { title: "Equations",             content: "An equation is a statement that two expressions are equal: 2x + 3 = 11.", type: "text" },
        { title: "Solving Equations",     content: "To solve for x, perform inverse operations on both sides: 2x = 8, so x = 4.", type: "text" },
        { title: "Summary",              content: "Algebra is the language of mathematics. Variables and equations help us model and solve real-world problems.", type: "text" },
      ],
    },
    {
      title: "The Water Cycle", subject: "Science", grade_level: "Grade 6",
      type: "simulation" as const, is_builtin: true,
      slides: [
        { title: "Evaporation",           content: "Water from oceans, lakes, and rivers evaporates into water vapour when heated by the sun.", type: "text" },
        { title: "Condensation",          content: "Water vapour cools and condenses to form clouds and fog.", type: "text" },
        { title: "Precipitation",         content: "Water falls back to Earth as rain, snow, sleet, or hail.", type: "text" },
        { title: "Collection",            content: "Water collects in oceans, rivers, lakes, and groundwater, restarting the cycle.", type: "text" },
        { title: "Summary",              content: "The water cycle continuously moves water through evaporation, condensation, precipitation, and collection.", type: "text" },
      ],
    },
    {
      title: "World War II Overview", subject: "History", grade_level: "Grade 10",
      type: "lesson" as const, is_builtin: true,
      slides: [
        { title: "Causes",               content: "WWII arose from the rise of fascism, economic depression, and the failure of the League of Nations.", type: "text" },
        { title: "Key Players",          content: "The Allies (UK, USA, USSR, France) vs the Axis powers (Germany, Italy, Japan).", type: "text" },
        { title: "Major Events",         content: "D-Day, Battle of Stalingrad, the Holocaust, and the atomic bombings of Hiroshima and Nagasaki.", type: "text" },
        { title: "Outcome",             content: "Allied victory in 1945; founding of the United Nations; beginning of the Cold War.", type: "text" },
        { title: "Legacy",              content: "WWII reshaped the world's political map and led to a new international order.", type: "text" },
      ],
    },
    {
      title: "Shakespeare Vocabulary Quiz", subject: "English", grade_level: "Grade 11",
      type: "quiz" as const, is_builtin: true,
      slides: [],
    },
  ];

  for (const t of templateData) {
    await db.insert(schema.templates).values(t).onConflictDoNothing();
  }
  console.log(`   ↳ Created ${templateData.length} templates`);

  // ── 3. Sample lessons ────────────────────────────────────────
  console.log("\n📖 Creating sample lessons…");
  const lessonData = [
    { title: "Photosynthesis & The Carbon Cycle", subject: "Biology",   status: "published" as const, ai_generated: true  },
    { title: "Newton's Laws of Motion",           subject: "Physics",   status: "published" as const, ai_generated: false },
    { title: "The French Revolution",             subject: "History",   status: "draft"     as const, ai_generated: true  },
    { title: "Quadratic Equations",               subject: "Math",      status: "published" as const, ai_generated: false },
    { title: "Shakespeare's Hamlet — Act III",    subject: "English",   status: "draft"     as const, ai_generated: false },
    { title: "Periodic Table & Chemical Bonds",   subject: "Chemistry", status: "published" as const, ai_generated: true  },
  ];

  const createdLessons = [];
  for (const l of lessonData) {
    const [lesson] = await db
      .insert(schema.lessons)
      .values({ ...l, teacher_id: teacherId })
      .onConflictDoNothing()
      .returning();
    if (lesson) {
      createdLessons.push(lesson);
      // Add 3 slides per lesson
      await db.insert(schema.slides).values([
        { lesson_id: lesson.id, order_index: 0, type: "text", content: { title: "Introduction",  text: `Welcome to ${lesson.title}. This lesson covers the core concepts you need to know.` } },
        { lesson_id: lesson.id, order_index: 1, type: "text", content: { title: "Key Concepts",  text: `The main topics we will explore in ${lesson.title} include the foundational theories and practical applications.` } },
        { lesson_id: lesson.id, order_index: 2, type: "text", content: { title: "Summary",       text: `Great work! You have completed ${lesson.title}. Review the key points and attempt the quiz.` } },
      ]);
    }
  }
  console.log(`   ↳ Created ${createdLessons.length} lessons with slides`);

  // ── 4. Sample quizzes ────────────────────────────────────────
  console.log("\n❓ Creating sample quizzes…");
  if (createdLessons[0]) {
    const [quiz] = await db
      .insert(schema.quizzes)
      .values({
        teacher_id:     teacherId,
        lesson_id:      createdLessons[0].id,
        title:          "Photosynthesis Quiz",
        time_limit_sec: 30,
        ai_generated:   true,
      })
      .onConflictDoNothing()
      .returning();

    if (quiz) {
      await db.insert(schema.questions).values([
        { quiz_id: quiz.id, order_index: 0, body: "What is the main pigment in photosynthesis?",        type: "mcq",       options: ["Chlorophyll", "Carotene", "Melanin", "Keratin"],          correct_answer: "Chlorophyll" },
        { quiz_id: quiz.id, order_index: 1, body: "Photosynthesis occurs in the mitochondria.",         type: "truefalse", options: ["True", "False"],                                         correct_answer: "False" },
        { quiz_id: quiz.id, order_index: 2, body: "What gas is released as a byproduct?",               type: "mcq",       options: ["CO₂", "Nitrogen", "Oxygen", "Hydrogen"],                 correct_answer: "Oxygen" },
        { quiz_id: quiz.id, order_index: 3, body: "Where does the Calvin cycle take place?",            type: "mcq",       options: ["Thylakoid", "Stroma", "Nucleus", "Cytoplasm"],            correct_answer: "Stroma" },
        { quiz_id: quiz.id, order_index: 4, body: "What is the chemical formula for glucose?",          type: "mcq",       options: ["CO₂", "H₂O", "C₆H₁₂O₆", "O₂"],                          correct_answer: "C₆H₁₂O₆" },
      ]);
      console.log(`   ↳ Created quiz: ${quiz.title} with 5 questions`);
    }
  }

  if (createdLessons[3]) {
    const [quiz2] = await db
      .insert(schema.quizzes)
      .values({
        teacher_id:     teacherId,
        lesson_id:      createdLessons[3].id,
        title:          "Quadratic Equations Quiz",
        time_limit_sec: 60,
        ai_generated:   false,
      })
      .onConflictDoNothing()
      .returning();

    if (quiz2) {
      await db.insert(schema.questions).values([
        { quiz_id: quiz2.id, order_index: 0, body: "What is the standard form of a quadratic equation?", type: "mcq", options: ["ax+b=0", "ax²+bx+c=0", "ax³+b=0", "a/x+b=0"], correct_answer: "ax²+bx+c=0" },
        { quiz_id: quiz2.id, order_index: 1, body: "The discriminant is b²-4ac.",                        type: "truefalse", options: ["True", "False"], correct_answer: "True" },
      ]);
      console.log(`   ↳ Created quiz: ${quiz2.title} with 2 questions`);
    }
  }

  // ── 5. Sample recording ──────────────────────────────────────
  console.log("\n🎥 Creating sample recording…");
  if (createdLessons[0]) {
    await db
      .insert(schema.session_recordings)
      .values({
        teacher_id:   teacherId,
        lesson_id:    createdLessons[0].id,
        title:        "Photosynthesis — Demo Recording",
        status:       "ready",
        duration_sec: 2847,
        is_public:    true,
      })
      .onConflictDoNothing();
    console.log("   ↳ Created sample recording");
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Email:    teacher@school.edu");
  console.log("  Password: password\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
