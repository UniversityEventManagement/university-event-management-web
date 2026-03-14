const programsKey = 'campushub_programs_v1';
const instructorsKey = 'campushub_instructors_v1';

const defaultPrograms = [
  {
    id: 'prog-ai-1',
    title: 'Applied AI Systems',
    level: 'Advanced',
    dept: 'CSE',
    seats: 90,
    duration: '12 Weeks',
    summary: 'Build real-world ML pipelines and deploy LLM-powered tools.',
    image: '/img/technical.jpeg',
  },
  {
    id: 'prog-ai-2',
    title: 'AI Product Studio',
    level: 'Intermediate',
    dept: 'IT',
    seats: 75,
    duration: '8 Weeks',
    summary: 'Prototype AI-first products from user research to launch plan.',
    image: '/img/workshop.jpg',
  },
  {
    id: 'prog-ai-3',
    title: 'Data and Decision Intelligence',
    level: 'Beginner',
    dept: 'MBA',
    seats: 130,
    duration: '6 Weeks',
    summary: 'Use analytics and AI dashboards for strategic campus decisions.',
    image: '/img/cultural.jpg',
  },
];

const defaultInstructors = [
  {
    id: 'ins-1',
    name: 'Dr. Riya Sharma',
    dept: 'CSE',
    expertise: 'Machine Learning, NLP',
    rating: 4.9,
    image: '/img/annual-fest.jpg',
  },
  {
    id: 'ins-2',
    name: 'Prof. Arjun Menon',
    dept: 'IT',
    expertise: 'AI Product Engineering',
    rating: 4.8,
    image: '/img/workshop.jpg',
  },
  {
    id: 'ins-3',
    name: 'Prof. Mehul Patel',
    dept: 'MBA',
    expertise: 'Innovation Strategy, Leadership',
    rating: 4.8,
    image: '/img/other.jpg',
  },
];

const isRemoteImage = (value) => /^https?:\/\//i.test(String(value || '').trim());

const normalizeProgram = (program, index) => ({
  ...program,
  image: !isRemoteImage(program?.image)
    ? program?.image || defaultPrograms[index % defaultPrograms.length].image
    : defaultPrograms[index % defaultPrograms.length].image,
});

const normalizeInstructor = (instructor, index) => ({
  ...instructor,
  image: !isRemoteImage(instructor?.image)
    ? instructor?.image || defaultInstructors[index % defaultInstructors.length].image
    : defaultInstructors[index % defaultInstructors.length].image,
});

function safeRead(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getPrograms() {
  return safeRead(programsKey, defaultPrograms).map(normalizeProgram);
}

export function savePrograms(programs) {
  localStorage.setItem(programsKey, JSON.stringify(programs));
}

export function getInstructors() {
  return safeRead(instructorsKey, defaultInstructors).map(normalizeInstructor);
}

export function saveInstructors(instructors) {
  localStorage.setItem(instructorsKey, JSON.stringify(instructors));
}
