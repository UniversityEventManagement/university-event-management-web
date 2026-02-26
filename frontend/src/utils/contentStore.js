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
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prog-ai-2',
    title: 'AI Product Studio',
    level: 'Intermediate',
    dept: 'IT',
    seats: 75,
    duration: '8 Weeks',
    summary: 'Prototype AI-first products from user research to launch plan.',
    image:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prog-ai-3',
    title: 'Data and Decision Intelligence',
    level: 'Beginner',
    dept: 'MBA',
    seats: 130,
    duration: '6 Weeks',
    summary: 'Use analytics and AI dashboards for strategic campus decisions.',
    image:
      'https://images.unsplash.com/photo-1551281044-8d8d0f67c3d1?auto=format&fit=crop&w=1200&q=80',
  },
];

const defaultInstructors = [
  {
    id: 'ins-1',
    name: 'Dr. Riya Sharma',
    dept: 'CSE',
    expertise: 'Machine Learning, NLP',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ins-2',
    name: 'Prof. Arjun Menon',
    dept: 'IT',
    expertise: 'AI Product Engineering',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ins-3',
    name: 'Prof. Mehul Patel',
    dept: 'MBA',
    expertise: 'Innovation Strategy, Leadership',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  },
];

function safeRead(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getPrograms() {
  return safeRead(programsKey, defaultPrograms);
}

export function savePrograms(programs) {
  localStorage.setItem(programsKey, JSON.stringify(programs));
}

export function getInstructors() {
  return safeRead(instructorsKey, defaultInstructors);
}

export function saveInstructors(instructors) {
  localStorage.setItem(instructorsKey, JSON.stringify(instructors));
}
