export type MenuItem = {
  label: string;
  href?: string;
  external?: boolean;
  children?: MenuItem[];
};

export const menuItems: MenuItem[] = [
  {
    label: "About",
    children: [
      { label: "History", href: "/history" },
      { label: "Affirmation of Faith", href: "/affirmation-of-faith" },
      { label: "Philosophy", href: "/philosophy" },
      { label: "Core Values", href: "/core-values" },
      { label: "Leadership", href: "/leadership" },
      { label: "Faculty", href: "/faculty-landing-page" },
      { label: "News", href: "/news" },
      { label: "Visit Campus", href: "/visit-campus" },
    ],
  },
  {
    label: "Academics",
    children: [
      { label: "Explore Degrees", href: "/explore-degrees" },
      { label: "Catalogue", href: "/catalogue" },
      { label: "2025 Graduation", href: "/nbts-126th-graduation-ceremony" },
      { label: "Sandwich Timetable", external: true },
      { label: "Our Faculties", href: "/our-faculties" },
      { label: "Academic Calendar", external: true },
      { label: "Accreditation and Affiliation", href: "/accreditation-and-affliation" },
      { label: "Academic Transcript", href: "/transcript" },
      { label: "NBTS Essentials", external: true },
    ],
  },
  {
    label: "Admissions",
    children: [{ label: "Becoming a Student", href: "/becoming-a-student" }],
  },
  {
    label: "Students",
    children: [
      { label: "Library", href: "/library" },
      { label: "Student Portal", href: "/tportal" },
      { label: "Women Training Centre", href: "/women-training-centre-2" },
      { label: "Student Handbook", external: true },
      { label: "Download Help Video", external: true },
      { label: "Previous Registration", external: true },
    ],
  },
  {
    label: "News",
    children: [{ label: "Newsletter", href: "/newsletter" }],
  },
  { label: "Distance Learning", href: "/distance-learning-centre" },
  { label: "Give", href: "/support" },
];
