export interface Video {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar: string;
  description: string;
  duration: string;
  lessons: number;
  category: string;
  level: string;
  rating: number;
  students: number;
  thumbnail: string;
  instructorId?: string;
  progress?: number;
  enrolled?: boolean;
  modules?: VideoModule[];
  objectives?: string[];
}

export interface VideoModule {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledVideos: string[];
  learningSchedule?: {
    time: string;
    days: string[];
    enabled: boolean;
  };
}

export interface LearningAlarm {
  id: string;
  time: string;
  days: string[];
  videoId?: string;
  enabled: boolean;
}

export const videos: Video[] = [
  {
    id: "1",
    title: "Introduction to Web Development",
    instructor: "Dr. Angela Yu",
    instructorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    description:
      "Learn the fundamentals of web development including HTML, CSS, and JavaScript from scratch.",
    duration: "3.5 hours",
    lessons: 24,
    category: "Development",
    level: "Beginner",
    rating: 4.9,
    students: 28500,
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
    progress: 45,
    enrolled: true,
  },
  {
    id: "2",
    title: "Descriptive Statistics",
    instructor: "Kirill Eremenko",
    instructorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    description:
      "Master descriptive statistics concepts including mean, median, mode, standard deviation, and data visualization.",
    duration: "3 hours",
    lessons: 20,
    category: "Data Science",
    level: "Intermediate",
    rating: 4.8,
    students: 18200,
    thumbnail:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=450&fit=crop",
    progress: 20,
    enrolled: true,
  },
  {
    id: "3",
    title: "Digital Marketing Essentials",
    instructor: "Phil Ebiner",
    instructorAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    description:
      "Learn social media marketing, SEO, email marketing, and analytics to grow any brand online.",
    duration: "4 hours",
    lessons: 28,
    category: "Marketing",
    level: "Beginner",
    rating: 4.7,
    students: 22000,
    thumbnail:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
  },
  {
    id: "4",
    title: "UI/UX Design Fundamentals",
    instructor: "Sarah Chen",
    instructorAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    description:
      "Learn modern UI/UX design principles and create stunning user interfaces using Figma and design thinking.",
    duration: "3.5 hours",
    lessons: 22,
    category: "Design",
    level: "Beginner",
    rating: 4.9,
    students: 19500,
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop",
  },
  {
    id: "5",
    title: "Introduction to Computing",
    instructor: "Stephen Grider",
    instructorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    description:
      "Understand the fundamentals of computing, algorithms, and problem-solving techniques.",
    duration: "4 hours",
    lessons: 30,
    category: "Development",
    level: "Beginner",
    rating: 4.8,
    students: 25000,
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    progress: 78,
    enrolled: true,
  },
  {
    id: "6",
    title: "Photography Masterclass",
    instructor: "Chris Parker",
    instructorAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    description:
      "Learn professional photography and photo editing to capture stunning images with any camera.",
    duration: "3 hours",
    lessons: 18,
    category: "Photography",
    level: "Beginner",
    rating: 4.6,
    students: 15000,
    thumbnail:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=450&fit=crop",
  },
  {
    id: "7",
    title: "Business Communication Skills",
    instructor: "Maria Santos",
    instructorAvatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
    description:
      "Develop effective communication skills for the workplace including presentations, emails, and negotiations.",
    duration: "3.5 hours",
    lessons: 25,
    category: "Business",
    level: "Beginner",
    rating: 4.7,
    students: 21000,
    thumbnail:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop",
  },
  {
    id: "8",
    title: "Financial Literacy & Investing",
    instructor: "James Okonkwo",
    instructorAvatar:
      "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=100&h=100&fit=crop",
    description:
      "Understand personal finance, budgeting, savings, and the basics of stock market investing.",
    duration: "4 hours",
    lessons: 26,
    category: "Business",
    level: "Beginner",
    rating: 4.8,
    students: 30200,
    thumbnail:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop",
  },
  {
    id: "9",
    title: "Creative Writing Workshop",
    instructor: "Aisha Bello",
    instructorAvatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop",
    description:
      "Explore fiction, poetry, and non-fiction writing techniques to express your ideas with clarity and creativity.",
    duration: "3 hours",
    lessons: 20,
    category: "Arts",
    level: "Beginner",
    rating: 4.6,
    students: 12500,
    thumbnail:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop",
  },
  {
    id: "10",
    title: "Computer Hardware Essentials",
    instructor: "David Osei",
    instructorAvatar:
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=100&h=100&fit=crop",
    description:
      "Learn about computer components, assembly, troubleshooting, and maintenance from the ground up.",
    duration: "3.5 hours",
    lessons: 22,
    category: "Development",
    level: "Beginner",
    rating: 4.5,
    students: 16800,
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop",
  },
  {
    id: "11",
    title: "Public Speaking & Confidence",
    instructor: "Nkechi Adeyemi",
    instructorAvatar:
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
    description:
      "Overcome stage fright and learn to deliver impactful speeches and presentations with confidence.",
    duration: "3 hours",
    lessons: 16,
    category: "Business",
    level: "Beginner",
    rating: 4.8,
    students: 19000,
    thumbnail:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop",
  },
  {
    id: "12",
    title: "Introduction to Psychology",
    instructor: "Dr. Funmi Adeola",
    instructorAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    description:
      "Explore the fundamentals of human behavior, cognition, emotions, and mental processes.",
    duration: "4 hours",
    lessons: 28,
    category: "Arts",
    level: "Beginner",
    rating: 4.7,
    students: 24000,
    thumbnail:
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=450&fit=crop",
  },
  {
    id: "13",
    title: "Graphic Design with Canva",
    instructor: "Tunde Bakare",
    instructorAvatar:
      "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop",
    description:
      "Create professional graphics, social media posts, and branding materials using Canva.",
    duration: "3 hours",
    lessons: 18,
    category: "Design",
    level: "Beginner",
    rating: 4.6,
    students: 20500,
    thumbnail:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=450&fit=crop",
  },
  {
    id: "14",
    title: "Project Management Basics",
    instructor: "Emeka Chukwu",
    instructorAvatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
    description:
      "Learn planning, scheduling, risk management, and team leadership for successful project delivery.",
    duration: "3.5 hours",
    lessons: 24,
    category: "Business",
    level: "Intermediate",
    rating: 4.7,
    students: 17500,
    thumbnail:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop",
  },
  {
    id: "15",
    title: "Physics 101: Mechanics",
    instructor: "Prof. Olu Adeniyi",
    instructorAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    description:
      "Understand Newton's laws, motion, energy, and the fundamental principles of classical mechanics.",
    duration: "4 hours",
    lessons: 30,
    category: "Data Science",
    level: "Intermediate",
    rating: 4.5,
    students: 14000,
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
  },
  {
    id: "16",
    title: "Physics Practical 107",
    instructor: "Dr. Bisi Afolabi",
    instructorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    description:
      "Hands-on physics experiments covering optics, electricity, and measurement techniques.",
    duration: "3 hours",
    lessons: 15,
    category: "Data Science",
    level: "Intermediate",
    rating: 4.4,
    students: 11000,
    thumbnail:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop",
  },
];

export const currentUser: User = {
  id: "user-1",
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  enrolledVideos: ["1", "2", "5"],
  learningSchedule: {
    time: "09:00",
    days: ["Monday", "Wednesday", "Friday"],
    enabled: true,
  },
};

export const learningAlarms: LearningAlarm[] = [
  {
    id: "alarm-1",
    time: "09:00",
    days: ["Monday", "Wednesday", "Friday"],
    courseId: "1",
    enabled: true,
  },
  {
    id: "alarm-2",
    time: "18:00",
    days: ["Tuesday", "Thursday"],
    courseId: "2",
    enabled: true,
  },
  {
    id: "alarm-3",
    time: "10:00",
    days: ["Saturday", "Sunday"],
    enabled: false,
  },
];

export const categories = [
  "All",
  "CHEM 102",
  "CHEM 108",
  "PHY 102",
  "PHY 108",
  "BIO 102",
  "BIO 108",
  "MTH 102",
  "French 102",
];
