export interface Course {
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
  progress?: number;
  enrolled?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledCourses: string[];
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
  courseId?: string;
  enabled: boolean;
}

export const courses: Course[] = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    instructor: "Dr. Angela Yu",
    instructorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    description: "Become a full-stack web developer with just one course. HTML, CSS, JavaScript, Node, React, MongoDB, and more!",
    duration: "63 hours",
    lessons: 450,
    category: "Development",
    level: "Beginner",
    rating: 4.9,
    students: 250000,
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
    progress: 45,
    enrolled: true
  },
  {
    id: "2",
    title: "Machine Learning A-Z: AI, Python & R",
    instructor: "Kirill Eremenko",
    instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    description: "Learn to create Machine Learning Algorithms in Python and R. Covers regression, clustering, deep learning, and more.",
    duration: "44 hours",
    lessons: 320,
    category: "Data Science",
    level: "Intermediate",
    rating: 4.8,
    students: 180000,
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=450&fit=crop",
    progress: 20,
    enrolled: true
  },
  {
    id: "3",
    title: "Digital Marketing Masterclass",
    instructor: "Phil Ebiner",
    instructorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    description: "Master digital marketing strategy, social media marketing, SEO, YouTube, email marketing, and analytics.",
    duration: "35 hours",
    lessons: 280,
    category: "Marketing",
    level: "Beginner",
    rating: 4.7,
    students: 120000,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop"
  },
  {
    id: "4",
    title: "UI/UX Design Fundamentals",
    instructor: "Sarah Chen",
    instructorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    description: "Learn modern UI/UX design principles and create stunning user interfaces using Figma and design thinking.",
    duration: "28 hours",
    lessons: 195,
    category: "Design",
    level: "Beginner",
    rating: 4.9,
    students: 95000,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop"
  },
  {
    id: "5",
    title: "Advanced React and Redux",
    instructor: "Stephen Grider",
    instructorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    description: "Get a deep understanding of React, Redux, React Router, and modern React development patterns.",
    duration: "52 hours",
    lessons: 380,
    category: "Development",
    level: "Advanced",
    rating: 4.8,
    students: 145000,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    progress: 78,
    enrolled: true
  },
  {
    id: "6",
    title: "Photography Masterclass",
    instructor: "Chris Parker",
    instructorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    description: "Learn professional photography and photo editing to capture stunning images with any camera.",
    duration: "22 hours",
    lessons: 165,
    category: "Photography",
    level: "Beginner",
    rating: 4.6,
    students: 85000,
    thumbnail: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=450&fit=crop"
  }
];

export const currentUser: User = {
  id: "user-1",
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  enrolledCourses: ["1", "2", "5"],
  learningSchedule: {
    time: "09:00",
    days: ["Monday", "Wednesday", "Friday"],
    enabled: true
  }
};

export const learningAlarms: LearningAlarm[] = [
  {
    id: "alarm-1",
    time: "09:00",
    days: ["Monday", "Wednesday", "Friday"],
    courseId: "1",
    enabled: true
  },
  {
    id: "alarm-2",
    time: "18:00",
    days: ["Tuesday", "Thursday"],
    courseId: "2",
    enabled: true
  },
  {
    id: "alarm-3",
    time: "10:00",
    days: ["Saturday", "Sunday"],
    enabled: false
  }
];

export const categories = [
  "All",
  "Development",
  "Data Science",
  "Marketing",
  "Design",
  "Photography",
  "Business"
];
