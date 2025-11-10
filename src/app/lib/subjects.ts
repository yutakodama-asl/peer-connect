export type SubjectCategory = {
  label: string;
  tags?: string[];
  courses: string[];
};

export const sortSubjects = (subjects: string[]) =>
  Array.from(new Set(subjects)).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

const buildCategory = (label: string, courses: string[], tags: string[] = []): SubjectCategory => ({
  label,
  tags,
  courses: sortSubjects(courses),
});

export const SUBJECT_LIBRARY: SubjectCategory[] = [
  buildCategory(
    "English",
    [
      "English 9",
      "English 10",
      "American Literature",
      "British Literature",
      "Craft of Writing",
      "Dramatic Literature and Performance",
      "Gender in Literature",
      "Individual and Society in Literature",
      "Literary Non-fiction",
      "Literary Rule Breakers",
      "Literature and Art",
      "Literature and Film",
      "Literature of Migration",
      "Middle Eastern Literature",
      "Mythology",
      "Poetry",
      "Post-colonial Literature",
      "Shakespeare",
      "Special Topics in Literature",
    ],
    ["English Language Arts", "ELA", "Grade 9 English", "Grade 10 English", "Grades 11-12 English"]
  ),
  buildCategory(
    "Mathematics",
    [
      "Algebra I",
      "Geometry with Algebra",
      "Geometry with Proof",
      "Algebra II Foundations",
      "Algebra II",
      "Algebra II with Trigonometry",
      "Precalculus with Statistics",
      "Precalculus with Analysis",
      "Precalculus with Calculus",
      "Calculus",
      "AP Calculus AB",
      "AP Calculus BC",
      "AP Statistics",
      "Advanced Math Seminar",
      "Financial Mathematics",
    ],
    ["Math", "Mathematics", "STEM"]
  ),
  buildCategory(
    "Science",
    [
      "Integrated Science: The Universe from Atoms to Life",
      "Integrated Science: Life on a Changing Earth",
      "Advanced Independent Research Colloquium: Science",
      "AP Biology",
      "AP Chemistry",
      "AP Environmental Science",
      "AP Physics I",
      "AP Physics II",
      "AP Physics C",
      "Ecology Expeditions",
      "Anatomy & Physiology I",
      "Anatomy & Physiology II",
      "Organic Chemistry",
      "Inorganic Chemistry",
      "Astrophysics",
      "Physics & Engineering",
    ],
    ["STEM", "Lab Science", "Sciences"]
  ),
  buildCategory(
    "Social Studies",
    [
      "World Civilizations I",
      "World Civilizations II",
      "US History",
      "AP US History",
      "AP Economics",
      "AP Human Geography",
      "AP Psychology",
      "AP European History",
      "AP Art History",
      "Advanced Independent Research Colloquium: Social Studies",
      "Human Rights Seminar",
      "Contemporary Global History",
      "Global Issues",
      "Introduction to Philosophy",
      "Introduction to Ethics and Moral Philosophy",
      "Race and Culture",
      "Research in Social Studies: Countercultures",
      "Topics in Government and Law",
    ],
    ["History", "Humanities", "Social Science"]
  ),
  buildCategory(
    "World Languages — Arabic",
    ["Arabic I", "Arabic II", "Arabic III", "Arabic IV", "Arabic V", "Advanced Arabic"],
    ["World Languages", "Arabic"]
  ),
  buildCategory(
    "World Languages — Chinese",
    [
      "Chinese I",
      "Chinese II",
      "Chinese III",
      "Chinese IV",
      "Chinese V",
      "AP Chinese Language and Culture",
      "Chinese Language and Culture Seminar",
    ],
    ["World Languages", "Chinese", "Mandarin"]
  ),
  buildCategory(
    "World Languages — French",
    [
      "French I",
      "French II",
      "French III",
      "French IV",
      "French Culture and Language through Film and Media",
      "AP French Language and Culture",
      "Advanced French: Literature",
    ],
    ["World Languages", "French"]
  ),
  buildCategory(
    "World Languages — Spanish",
    [
      "Spanish I",
      "Spanish II",
      "Spanish III",
      "Spanish IV",
      "Spanish Culture and Language through Film and Media",
      "AP Spanish Language and Culture",
      "AP Spanish Literature and Culture",
    ],
    ["World Languages", "Spanish"]
  ),
  buildCategory(
    "Computer Science & Engineering",
    [
      "Integrated Science Coding Lab",
      "Introduction to Programming",
      "Computer Science Principles",
      "Art and Code",
      "Design and Engineering",
      "Robotics",
      "AP Computer Science A",
      "Data Science and Machine Learning",
      "Computational Circuits",
      "Software Engineering",
      "Modeling and Simulation",
      "Advanced Design Thinking Apprenticeship",
    ],
    ["Computer Science", "Engineering", "CSED"]
  ),
  buildCategory(
    "Performing Arts — Drama",
    [
      "Play Production",
      "Acting for TV & Film",
      "Technical Theater Design",
      "Advanced Acting: TV and Film",
      "Advanced Acting: Play Production",
    ],
    ["Performing Arts", "Drama", "Theater"]
  ),
  buildCategory("Performing Arts — Dance", ["Dance"], ["Performing Arts", "Dance"]),
  buildCategory(
    "Performing Arts — Music",
    ["Band", "Choir", "Orchestra", "Music Appreciation", "Digital Music", "AP Music Theory"],
    ["Performing Arts", "Music"]
  ),
  buildCategory(
    "Visual Arts",
    [
      "Foundations of Visual Arts",
      "Animating Images",
      "Art and Code",
      "Black and White Photography",
      "Ceramics",
      "Design and Engineering",
      "Digital Photography",
      "Digital Video Editing",
      "Drawing and Mixed Media",
      "Fashion Design",
      "Graphic Design",
      "Narrative Filmmaking",
      "Painting",
      "Sculpture",
      "Video Art",
      "Breaking Boundaries",
      "Meaning and Metaphor",
      "The Art of the Everyday",
      "Visual Storytelling",
      "Drawing and Painting Portfolio/AP",
      "Film and Video Portfolio",
      "Photography and Design Portfolio/AP",
      "Sculpture and Ceramics Portfolio/AP",
      "Independent Study",
    ],
    ["Art", "Fine Arts", "Visual Arts"]
  ),
  buildCategory(
    "Journalism & Publications",
    [
      "Foundations of Journalism",
      "Advanced Journalism",
      "Advanced Journalism: Editors",
      "Publications Design: Yearbook",
      "Publications Design: Advanced",
      "Publications Design: Editors",
    ],
    ["Journalism", "Publications", "Media"]
  ),
  buildCategory(
    "Experiential Education",
    [
      "Advanced Independent Research Colloquium",
      "Community Action Seminar",
      "Advanced Design Thinking Apprenticeship",
      "Peer Leadership",
      "Teaching Apprenticeship",
    ],
    ["Leadership", "Service Learning", "Experiential Learning"]
  ),
  buildCategory("Health", ["Health 9", "Health 10"], ["Wellness"]),
  buildCategory("Physical Education", ["Physical Education 9", "Physical Education 10", "Dance", "Lifetime Fitness", "Sports Leadership"], ["PE", "Athletics", "Sports"]),
];

export const filterCatalog = (library: SubjectCategory[], query: string): SubjectCategory[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return library;
  }

  return library
    .map((category) => {
      const matchesCategory =
        category.label.toLowerCase().includes(normalizedQuery) ||
        category.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      if (matchesCategory) {
        return category;
      }

      const matchingCourses = category.courses.filter((course) =>
        course.toLowerCase().includes(normalizedQuery)
      );

      if (matchingCourses.length > 0) {
        return {
          ...category,
          courses: matchingCourses,
        };
      }

      return null;
    })
    .filter((value): value is SubjectCategory => value !== null);
};
