import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

const courseData = [
  {
    id: 'ai-101',
    title: 'AI Foundations',
    level: 'Beginner',
    category: 'technical',
    instructor: 'Dr. Riya Sharma',
    department: 'CSE',
    lessons: ['Intro to AI', 'Prompting Basics', 'Mini Project'],
    quiz: { question: 'Which model is best for text classification?', options: ['CNN', 'Transformer', 'KNN'], answer: 'Transformer' },
  },
  {
    id: 'fs-201',
    title: 'Full Stack Delivery',
    level: 'Intermediate',
    category: 'technical',
    instructor: 'Prof. Arjun Menon',
    department: 'IT',
    lessons: ['API Design', 'React Patterns', 'Deployment Playbook'],
    quiz: { question: 'Which status code indicates success with no response body?', options: ['200', '204', '404'], answer: '204' },
  },
  {
    id: 'lead-110',
    title: 'Leadership Studio',
    level: 'All Levels',
    category: 'career',
    instructor: 'Prof. Mehul Patel',
    department: 'MBA',
    lessons: ['Personal Leadership', 'Team Dynamics', 'Pitch Practicum'],
    quiz: { question: 'Best first step in conflict resolution?', options: ['Escalate', 'Listen', 'Ignore'], answer: 'Listen' },
  },
];

function readState(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function writeState(key, next) {
  localStorage.setItem(key, JSON.stringify(next));
}

export default function LearningCenterPage() {
  const { user } = useOutletContext() || {};
  const isStudent = user?.role === 'student';
  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';
  const learnerStorageKey = `campushub_learning_state_student_${user?.id || 'guest'}`;

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [category, setCategory] = useState('all');
  const [department, setDepartment] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState(courseData[0].id);
  const [discussion, setDiscussion] = useState('');
  const [state, setState] = useState(() => readState(learnerStorageKey));

  useEffect(() => {
    if (isStudent) {
      setState(readState(learnerStorageKey));
    } else {
      setState({});
    }
  }, [isStudent, learnerStorageKey]);

  const selectedCourse = courseData.find((c) => c.id === selectedCourseId) || courseData[0];

  const filteredCourses = useMemo(
    () =>
      courseData.filter((course) => {
        const matchesQuery =
          course.title.toLowerCase().includes(query.toLowerCase()) ||
          course.instructor.toLowerCase().includes(query.toLowerCase());
        const matchesLevel = level === 'all' || course.level === level;
        const matchesCategory = category === 'all' || course.category === category;
        const matchesDept = department === 'all' || course.department === department;
        return matchesQuery && matchesLevel && matchesCategory && matchesDept;
      }),
    [query, level, category, department]
  );

  const courseState = state[selectedCourse.id] || { completedLessons: [], quizPassed: false, comments: [] };
  const progress = Math.round(((courseState.completedLessons.length + (courseState.quizPassed ? 1 : 0)) / (selectedCourse.lessons.length + 1)) * 100);

  const updateCourseState = (nextCourseState) => {
    const next = { ...state, [selectedCourse.id]: nextCourseState };
    setState(next);
    writeState(learnerStorageKey, next);
  };

  const toggleLesson = (lesson) => {
    const has = courseState.completedLessons.includes(lesson);
    const completedLessons = has
      ? courseState.completedLessons.filter((l) => l !== lesson)
      : [...courseState.completedLessons, lesson];
    updateCourseState({ ...courseState, completedLessons });
  };

  const submitQuiz = (answer) => {
    if (answer === selectedCourse.quiz.answer) {
      updateCourseState({ ...courseState, quizPassed: true });
      toast.success('Quiz passed. Certificate unlocked.');
    } else {
      toast.error('Incorrect answer. Try again.');
    }
  };

  const downloadCertificate = () => {
    if (!courseState.quizPassed) {
      toast.error('Complete and pass quiz first.');
      return;
    }
    const content = `CampusHub Certificate\n\nCourse: ${selectedCourse.title}\nStatus: Completed`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCourse.title.replace(/\s+/g, '_')}_certificate.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addComment = () => {
    if (!discussion.trim()) return;
    updateCourseState({
      ...courseState,
      comments: [{ text: discussion.trim(), createdAt: new Date().toISOString() }, ...courseState.comments],
    });
    setDiscussion('');
  };

  if (!isStudent && !isFacultyOrAdmin) {
    return (
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Learning Center</h1>
        <p className="mt-2 text-gray-600">Learning progress is available for logged-in students.</p>
        <div className="mt-6 dashboard-surface p-6">
          <p className="text-gray-700">Please sign in as a student to track course progress, quiz completion, and certificates.</p>
        </div>
      </main>
    );
  }

  if (isFacultyOrAdmin) {
    return (
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Learning Catalog</h1>
        <p className="mt-2 text-gray-600">Faculty/Admin view: review included courses and structure.</p>

        <section className="mt-6 dashboard-surface p-4 grid md:grid-cols-4 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title/instructor"
            className="px-3 py-2 rounded-lg border border-gray-200"
          />
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200">
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="All Levels">All Levels</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200">
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="career">Career</option>
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200">
            <option value="all">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="MBA">MBA</option>
          </select>
        </section>

        <section className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <article key={course.id} className="dashboard-surface p-5">
              <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{course.instructor} • {course.department}</p>
              <p className="text-sm text-gray-600 mt-2">{course.level} • {course.category}</p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900">Lessons Included</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {course.lessons.map((lesson) => (
                    <li key={lesson}>• {lesson}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Learning Center</h1>
      <p className="mt-2 text-gray-600">Student view: your progress is saved per student account on this device.</p>

      <section className="mt-6 dashboard-surface p-4 grid md:grid-cols-4 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title/instructor"
          className="px-3 py-2 rounded-lg border border-gray-200"
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200">
          <option value="all">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="All Levels">All Levels</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200">
          <option value="all">All Categories</option>
          <option value="technical">Technical</option>
          <option value="career">Career</option>
        </select>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200">
          <option value="all">All Departments</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="MBA">MBA</option>
        </select>
      </section>

      <section className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {filteredCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`w-full text-left dashboard-surface p-4 transition-colors ${selectedCourse.id === course.id ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <p className="font-semibold text-gray-900">{course.title}</p>
              <p className="text-sm text-gray-600 mt-1">{course.instructor} • {course.department}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 dashboard-surface p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedCourse.level} • {selectedCourse.category}</p>
            </div>
            <button onClick={downloadCertificate} className="px-4 py-2 rounded-lg bg-indigo-900 text-white text-sm font-semibold">
              Download Certificate
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span className="font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-indigo-900" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900">Lessons</h3>
            <div className="mt-3 space-y-2">
              {selectedCourse.lessons.map((lesson) => (
                <label key={lesson} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={courseState.completedLessons.includes(lesson)}
                    onChange={() => toggleLesson(lesson)}
                  />
                  <span className="text-sm text-gray-700">{lesson}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900">Quiz</h3>
            <p className="text-sm text-gray-600 mt-1">{selectedCourse.quiz.question}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCourse.quiz.options.map((option) => (
                <button
                  key={option}
                  onClick={() => submitQuiz(option)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900">Discussion (Q&A)</h3>
            <div className="mt-3 flex gap-2">
              <input
                value={discussion}
                onChange={(e) => setDiscussion(e.target.value)}
                placeholder="Ask a question or share notes"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
              />
              <button onClick={addComment} className="px-4 py-2 rounded-lg bg-indigo-900 text-white text-sm font-semibold">
                Post
              </button>
            </div>
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto scroll-container">
              {courseState.comments.length === 0 && <p className="text-sm text-gray-500">No discussion yet.</p>}
              {courseState.comments.map((comment, idx) => (
                <div key={`${comment.createdAt}-${idx}`} className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-sm text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
