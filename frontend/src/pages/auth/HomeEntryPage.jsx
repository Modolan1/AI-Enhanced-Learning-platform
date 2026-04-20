import { useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import heroStudentOnline from '../../assets/hero-student-online.svg';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '';
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  return `${apiOrigin}${thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`}`;
}

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const UPPERCASE_RE = /[A-Z]/;
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;
const INITIAL_VISIBLE_COURSES = 6;

const onboardingSteps = [
  {
    key: 'learningGoal',
    title: 'What is your main learning goal?',
    options: [
      'Get job-ready skills for my career',
      'Improve for school and exams',
      'Switch into a new tech field',
      'Learn for personal growth',
    ],
  },
  {
    key: 'preferredSubject',
    title: 'Which subject do you want to focus on first?',
    options: ['Web Development', 'Data Science', 'Math', 'Programming Fundamentals'],
  },
  {
    key: 'skillLevel',
    title: 'What is your current level?',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    key: 'preferredLearningStyle',
    title: 'How do you learn best?',
    options: ['Visual', 'Practice-based', 'Reading-first', 'Project-based'],
  },
  {
    key: 'weeklyLearningGoalHours',
    title: 'How many hours can you study weekly?',
    options: ['3', '5', '8', '12'],
  },
];

const instructorOnboardingSteps = [
  {
    key: 'preferredSubject',
    title: 'Which course area do you want to teach?',
    options: ['Web Development', 'Data Science', 'Math', 'Programming Fundamentals'],
  },
  {
    key: 'skillLevel',
    title: 'What is your teaching experience level?',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    key: 'preferredLearningStyle',
    title: 'How do you usually teach best?',
    options: ['Visual', 'Practice-based', 'Reading-first', 'Project-based'],
  },
  {
    key: 'weeklyLearningGoalHours',
    title: 'How many hours weekly can you dedicate to students?',
    options: ['3', '5', '8', '12'],
  },
];

function getPasswordChecks(password) {
  return [
    { label: `At least ${PASSWORD_MIN} characters`, met: password.length >= PASSWORD_MIN },
    { label: `No more than ${PASSWORD_MAX} characters`, met: password.length > 0 && password.length <= PASSWORD_MAX },
    { label: 'At least one uppercase letter', met: UPPERCASE_RE.test(password) },
    { label: 'At least one special character (!@#$%^&*…)', met: SPECIAL_RE.test(password) },
  ];
}

function buildRecommendation(answers) {
  const subject = answers.preferredSubject || 'your selected subject';
  const style = answers.preferredLearningStyle || 'project-based';
  const level = answers.skillLevel || 'Beginner';
  const weeklyHours = Number(answers.weeklyLearningGoalHours || 5);

  const pace = weeklyHours >= 8 ? 'accelerated path' : weeklyHours >= 5 ? 'balanced path' : 'steady path';

  return {
    title: `${level} ${subject} ${pace}`,
    points: [
      `Start with ${subject} modules tailored for ${level.toLowerCase()} learners.`,
      `Use a ${style.toLowerCase()} approach with hands-on checkpoints.`,
      `Follow a ${weeklyHours}-hour weekly schedule with AI review sessions.`,
    ],
  };
}

function buildCourseOutcomeLine(course) {
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  const projectCount = modules.filter((item) => item?.type === 'project').length;
  const lessonCount = modules.length;
  const levelText = (course?.level || 'Beginner').toLowerCase();

  const projectPhrase = `${projectCount || 1} ${projectCount === 1 ? 'project' : 'projects'}`;
  const lessonPhrase = `${lessonCount || 0} ${lessonCount === 1 ? 'lesson' : 'lessons'}`;

  return `Build ${projectPhrase} • ${lessonPhrase} • ${levelText} friendly`;
}

function Modal({ title, onClose, children, maxWidthClass = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className={`w-full ${maxWidthClass} rounded-2xl bg-white p-6 shadow-2xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function HomeEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [showInstructorQuestionnaire, setShowInstructorQuestionnaire] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showCourseEnrollment, setShowCourseEnrollment] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null); // { user, dashboardPath }
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const countdownRef = useRef(null);
  const coursesSectionRef = useRef(null);
  const coursesGridRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [stepIndex, setStepIndex] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState({
    learningGoal: '',
    preferredSubject: '',
    skillLevel: '',
    preferredLearningStyle: '',
    weeklyLearningGoalHours: '',
  });
  const [instructorStepIndex, setInstructorStepIndex] = useState(0);
  const [instructorOnboardingAnswers, setInstructorOnboardingAnswers] = useState({
    preferredSubject: '',
    skillLevel: '',
    preferredLearningStyle: '',
    weeklyLearningGoalHours: '',
  });

  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [registerError, setRegisterError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    if (location.pathname === '/login') {
      setShowLogin(true);
    }

    if (location.pathname === '/register') {
      setShowQuestionnaire(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!location.state?.returnToCourses) return;

    window.setTimeout(() => {
      coursesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.returnToCourses, location.pathname, navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const res = await authService.getPublishedCourses();
        setCourses(res.data || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const sections = ['home', 'courses', 'about', 'contact'];
    const elements = sections
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.45, 0.7],
        rootMargin: '-80px 0px -40% 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const passwordChecks = getPasswordChecks(registerForm.password);
  const allPasswordChecksMet = passwordChecks.every((check) => check.met);
  const recommendation = useMemo(() => buildRecommendation(onboardingAnswers), [onboardingAnswers]);

  const currentStep = onboardingSteps[stepIndex];
  const currentValue = onboardingAnswers[currentStep?.key] || '';
  const questionProgress = Math.round(((stepIndex + 1) / onboardingSteps.length) * 100);
  const currentInstructorStep = instructorOnboardingSteps[instructorStepIndex];
  const currentInstructorValue = instructorOnboardingAnswers[currentInstructorStep?.key] || '';
  const instructorQuestionProgress = Math.round(((instructorStepIndex + 1) / instructorOnboardingSteps.length) * 100);

  const openQuestionnaire = () => {
    setStepIndex(0);
    setOnboardingAnswers({
      learningGoal: '',
      preferredSubject: '',
      skillLevel: '',
      preferredLearningStyle: '',
      weeklyLearningGoalHours: '',
    });
    setShowQuestionnaire(true);
  };

  const openInstructorQuestionnaire = () => {
    setInstructorStepIndex(0);
    setInstructorOnboardingAnswers({
      preferredSubject: '',
      skillLevel: '',
      preferredLearningStyle: '',
      weeklyLearningGoalHours: '',
    });
    setShowInstructorQuestionnaire(true);
  };

  const handleSectionNav = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
    setMobileMenuOpen(false);
  };

  const completeQuestionnaire = () => {
    setShowQuestionnaire(false);
    setShowRegister(true);
  };

  const handleSelectCourseForEnrollment = (course) => {
    setSelectedCourseForEnrollment(course);
    setStepIndex(0);
    setOnboardingAnswers({
      learningGoal: '',
      preferredSubject: '',
      skillLevel: '',
      preferredLearningStyle: '',
      weeklyLearningGoalHours: '',
    });
    setShowCourseEnrollment(true);
  };

  const handleOpenCourseDetails = (course) => {
    if (!course?._id) return;
    navigate(`/courses/${course._id}`);
  };

  const toggleCourseVisibility = () => {
    if (showAllCourses) {
      setShowAllCourses(false);
      window.setTimeout(() => {
        coursesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 180);
      return;
    }

    setShowAllCourses(true);
  };

  const completeCourseQuestionnaire = () => {
    setShowCourseEnrollment(false);
    setShowRegister(true);
  };

  const completeInstructorQuestionnaire = () => {
    const weeklyHours = Number(instructorOnboardingAnswers.weeklyLearningGoalHours || 5);
    const preferredSubject = instructorOnboardingAnswers.preferredSubject || '';
    const skillLevel = instructorOnboardingAnswers.skillLevel || 'Advanced';

    setShowInstructorQuestionnaire(false);
    navigate('/instructor/register', {
      state: {
        instructorOnboarding: {
          preferredSubject,
          skillLevel,
          preferredLearningStyle: instructorOnboardingAnswers.preferredLearningStyle || 'Project-based',
          weeklyLearningGoalHours: weeklyHours,
          learningGoal: `Teach ${preferredSubject || 'students'} with ${skillLevel.toLowerCase()} instructor expertise`,
        },
      },
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const user = await login(loginForm.email, loginForm.password);
      setShowLogin(false);
      navigate(
        user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'instructor'
            ? '/instructor/dashboard'
            : '/student/dashboard'
      );
    } catch (error) {
      setLoginError(error?.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setPasswordTouched(true);

    if (!allPasswordChecksMet) return;

    const payload = {
      ...registerForm,
      ...onboardingAnswers,
      weeklyLearningGoalHours: Number(onboardingAnswers.weeklyLearningGoalHours || 5),
      recommendationOptIn: true,
    };

    try {
      const result = await register(payload);
      if (result?.pendingApproval) {
        setRegisterError(result.message || 'Registration submitted. Wait for admin approval.');
        return;
      }
      const user = result?.user;
      if (!user) {
        setRegisterError('Registration completed, but login session was not created. Please log in.');
        return;
      }
      const dashboardPath =
        user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'instructor'
            ? '/instructor/dashboard'
            : '/student/dashboard';
      setShowRegister(false);
      setRedirectCountdown(4);
      setRegistrationSuccess({ user, dashboardPath });
      countdownRef.current = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setRegistrationSuccess(null);
            navigate(dashboardPath);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setRegisterError(error?.response?.data?.message || 'Registration failed');
    }
  };

  // Cleanup countdown on unmount
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_45%,_#e2e8f0)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button type="button" onClick={() => handleSectionNav('home')} className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-indigo-700">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-900 shadow-sm">
              <BrainCircuit size={18} />
            </span>
            <span>EduSmartHub</span>
          </button>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <button type="button" onClick={() => handleSectionNav('courses')} className={`transition hover:text-indigo-700 ${activeSection === 'courses' ? 'text-indigo-700' : ''}`}>Enroll for Courses</button>
            <button type="button" onClick={() => handleSectionNav('about')} className={`transition hover:text-indigo-700 ${activeSection === 'about' ? 'text-indigo-700' : ''}`}>About</button>
            <button type="button" onClick={() => handleSectionNav('contact')} className={`transition hover:text-indigo-700 ${activeSection === 'contact' ? 'text-indigo-700' : ''}`}>Contact</button>
            <button type="button" onClick={openInstructorQuestionnaire} className="transition hover:text-indigo-700">Join as Instructor</button>
            <button type="button" onClick={() => setShowLogin(true)} className="hover:text-indigo-700">Login</button>
            <Button onClick={openQuestionnaire}>Get Started</Button>
          </nav>
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <button type="button" onClick={() => handleSectionNav('courses')} className={`rounded-lg px-3 py-2 text-left ${activeSection === 'courses' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>Enroll for Courses</button>
              <button type="button" onClick={() => handleSectionNav('about')} className={`rounded-lg px-3 py-2 text-left ${activeSection === 'about' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>About</button>
              <button type="button" onClick={() => handleSectionNav('contact')} className={`rounded-lg px-3 py-2 text-left ${activeSection === 'contact' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>Contact</button>
              <button
                type="button"
                onClick={() => {
                  openInstructorQuestionnaire();
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left hover:bg-slate-50"
              >
                Join as Instructor
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogin(true);
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left hover:bg-slate-50"
              >
                Login
              </button>
              <Button
                onClick={() => {
                  openQuestionnaire();
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      <main id="home" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <section className="relative isolate overflow-hidden rounded-3xl px-4 py-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
          <img
            src={heroStudentOnline}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-[-12%] z-0 hidden h-full max-h-[680px] w-auto opacity-70 md:block"
          />
          <div className="relative z-10">
            <div className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Smart Learning Platform
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Learn Smarter, Progress Faster.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600">
              An AI-enhanced learning platform with courses, quizzes, dashboards, and smart study guidance tailored to every learner.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={openQuestionnaire}>Get Started</Button>
              <Button variant="secondary" onClick={() => setShowLogin(true)}>Login</Button>
            </div>
          </div>
          <div className="relative z-10 rounded-3xl border border-white/60 bg-white/68 p-6 shadow-xl shadow-indigo-100 backdrop-blur-sm">
            <h2 className="text-lg font-semibold">How it works</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li>1. Complete a quick onboarding question series.</li>
              <li>2. Get AI recommendation profile based on your answers.</li>
              <li>3. Create account and enter your personalized dashboard.</li>
            </ol>
          </div>
        </section>

        <section id="courses" ref={coursesSectionRef} className="mt-20 scroll-mt-28">
          <h2 className="mb-8 text-3xl font-bold">Available Courses to Enroll</h2>
          <div
            ref={coursesGridRef}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300 ease-out"
          >
            {coursesLoading ? (
              <p className="col-span-full text-center text-slate-500">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="col-span-full text-center text-slate-500">No courses available yet.</p>
            ) : (
              courses.map((course, index) => {
                const isExtraCourse = index >= INITIAL_VISIBLE_COURSES;
                const isVisible = showAllCourses || !isExtraCourse;

                return (
                  <div
                    key={course._id}
                    className={`group overflow-hidden text-left transition-all duration-300 ease-out ${
                      isVisible ? 'max-h-[1000px] translate-y-0 opacity-100' : 'pointer-events-none max-h-0 -translate-y-1 opacity-0'
                    }`}
                    style={{ transitionDelay: isVisible && showAllCourses ? `${Math.min(index, 8) * 35}ms` : '0ms' }}
                  >
                  <div className="rounded-2xl bg-white p-5 shadow-md transition group-hover:shadow-xl">
                    {course.thumbnail && (
                      <img src={getThumbnailUrl(course.thumbnail)} alt={course.title} className="h-40 w-full rounded-lg object-cover" />
                    )}
                    <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-indigo-700">{course.title}</h3>
                    <p className="mb-3 mt-2 text-xs text-slate-500">{course.category?.name}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                    <p className="mt-2 text-xs font-medium text-indigo-700">{buildCourseOutcomeLine(course)}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{course.level} • {course.durationHours}h</span>
                      <div className="flex items-center gap-1">
                        {Number(course.rating || 0) > 0 ? (
                          <>
                            <span className="text-sm font-semibold text-amber-500">★ {Number(course.rating || 0).toFixed(1)}</span>
                            <span className="text-xs text-slate-400">({course.reviewCount || 0})</span>
                          </>
                        ) : (
                          <span className="text-xs italic text-slate-400">No ratings yet</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="secondary" className="w-full" onClick={() => handleOpenCourseDetails(course)}>View Details</Button>
                      <Button className="w-full" onClick={() => handleSelectCourseForEnrollment(course)}>Enroll Now</Button>
                    </div>
                  </div>
                  </div>
                );
              })
            )}
          </div>
          {!coursesLoading && courses.length > INITIAL_VISIBLE_COURSES && (
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" onClick={toggleCourseVisibility}>
                {showAllCourses ? 'See Less' : `View More (${courses.length - INITIAL_VISIBLE_COURSES} more)`}
              </Button>
            </div>
          )}
        </section>

        <section id="about" className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">About the Platform</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Built for modern learners</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500">Everything you need to learn, grow, and succeed — powered by AI and designed for simplicity.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold"> A smarter way to learn, practice, and grow</h3>
            <p className="mt-2 text-sm text-slate-600">This AI-based learning platform is designed to make online education
              more engaging, personalized, and easy to manage. Students can enroll
              in courses, access lesson materials, complete quizzes, and receive
              intelligent study guidance along the way.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">Document Intelligence</h3>
            <p className="mt-2 text-sm text-slate-600">Upload documents, extract key concepts, generate memory cards and quizzes instantly.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">Actionable Progress</h3>
            <p className="mt-2 text-sm text-slate-600"> With dedicated student dashboards, the platform supports
              both effective learning and simple course management in one modern system.</p>
          </div>
          </div>
        </section>

      </main>

      {/* ── Modern Footer ── */}
      <footer id="contact" className="mt-20 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">

            {/* Column 1 – Brand */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-xl font-bold text-white">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-900 shadow-sm">
                  <BrainCircuit size={18} />
                </span>
                EduSmartHub
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                An AI-powered learning platform designed to help students learn faster, practice smarter, and track real progress — all in one place.
              </p>
              <div className="mt-5 flex gap-3">
                <a href="mailto:support@learnai.local" className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition">support@learnai.local</a>
              </div>
            </div>

            {/* Column 2 – Quick Links */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Home', id: 'home' },
                  { label: 'Enroll for Courses', id: 'courses' },
                  { label: 'About the Platform', id: 'about' },
                  { label: 'Contact', id: 'contact' },
                ].map(({ label, id }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => handleSectionNav(id)}
                      className="flex items-center gap-1.5 text-slate-400 transition hover:text-white"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {label}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={openInstructorQuestionnaire} className="flex items-center gap-1.5 text-slate-400 transition hover:text-white">
                    <svg className="h-3.5 w-3.5 shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Join as Instructor
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3 – Contact & Get Started */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Get in Touch</h4>
              <p className="text-sm text-slate-400">Have questions or need support? We're here to help.</p>
              <a
                href="mailto:support@learnai.local"
                className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                support@learnai.local
              </a>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={openQuestionnaire}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <span>© {new Date().getFullYear()} EduSmartHub. All rights reserved.</span>
            <span>Built with AI-powered tools for modern learners.</span>
          </div>
        </div>
      </footer>

      {registrationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
            {/* Success icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Welcome aboard!</h2>
            <p className="mt-2 text-slate-500">
              Hi <span className="font-semibold text-slate-800">{registrationSuccess.user.firstName || registrationSuccess.user.email}</span>, your account has been created successfully.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              You'll be taken to your dashboard in <span className="font-bold text-indigo-600">{redirectCountdown}</span> second{redirectCountdown !== 1 ? 's' : ''}…
            </p>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                style={{ width: `${((4 - redirectCountdown) / 4) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                clearInterval(countdownRef.current);
                setRegistrationSuccess(null);
                navigate(registrationSuccess.dashboardPath);
              }}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Go to Dashboard Now
            </button>
          </div>
        </div>
      )}

      {showLogin && (
        <Modal title="Login" onClose={() => { setShowLogin(false); setLoginError(''); }} maxWidthClass="max-w-md">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email" type="email" value={loginForm.email} onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))} />
            <Input label="Password" type="password" value={loginForm.password} onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))} />
            {loginError && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loginError}</div>}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </Modal>
      )}

      {showInstructorQuestionnaire && (
        <Modal title="Instructor Onboarding" onClose={() => setShowInstructorQuestionnaire(false)}>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Step {instructorStepIndex + 1} of {instructorOnboardingSteps.length}</span>
              <span>{instructorQuestionProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${instructorQuestionProgress}%` }} />
            </div>
          </div>

          <h4 className="text-lg font-semibold text-slate-900">{currentInstructorStep.title}</h4>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {currentInstructorStep.options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setInstructorOnboardingAnswers((prev) => ({ ...prev, [currentInstructorStep.key]: option }))}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${currentInstructorValue === option ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => setInstructorStepIndex((prev) => Math.max(0, prev - 1))} disabled={instructorStepIndex === 0}>Previous</Button>
            {instructorStepIndex < instructorOnboardingSteps.length - 1 ? (
              <Button onClick={() => setInstructorStepIndex((prev) => Math.min(instructorOnboardingSteps.length - 1, prev + 1))} disabled={!currentInstructorValue}>Next</Button>
            ) : (
              <Button onClick={completeInstructorQuestionnaire} disabled={!currentInstructorValue}>Continue to Instructor Registration</Button>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Already have an instructor account?{' '}
            <Link to="/instructor/login" className="font-medium text-indigo-600" onClick={() => setShowInstructorQuestionnaire(false)}>
              Instructor Login
            </Link>
          </p>
        </Modal>
      )}

      {showQuestionnaire && (
        <Modal title="Get Started Questionnaire" onClose={() => setShowQuestionnaire(false)}>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Step {stepIndex + 1} of {onboardingSteps.length}</span>
              <span>{questionProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${questionProgress}%` }} />
            </div>
          </div>

          <h4 className="text-lg font-semibold text-slate-900">{currentStep.title}</h4>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {currentStep.options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setOnboardingAnswers((prev) => ({ ...prev, [currentStep.key]: option }))}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${currentValue === option ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))} disabled={stepIndex === 0}>Previous</Button>
            {stepIndex < onboardingSteps.length - 1 ? (
              <Button onClick={() => setStepIndex((prev) => Math.min(onboardingSteps.length - 1, prev + 1))} disabled={!currentValue}>Next</Button>
            ) : (
              <Button onClick={completeQuestionnaire} disabled={!currentValue}>Continue to Registration</Button>
            )}
          </div>
        </Modal>
      )}

      {showCourseEnrollment && (
        <Modal title={`Enroll in ${selectedCourseForEnrollment?.title}`} onClose={() => setShowCourseEnrollment(false)}>
          <div className="mb-6 rounded-xl bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Course Selected</p>
            <p className="mt-2 text-sm text-slate-700">Complete this quick questionnaire to personalize your learning experience for this course.</p>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Step {stepIndex + 1} of {onboardingSteps.length}</span>
              <span>{questionProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${questionProgress}%` }} />
            </div>
          </div>

          <h4 className="text-lg font-semibold text-slate-900">{currentStep.title}</h4>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {currentStep.options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setOnboardingAnswers((prev) => ({ ...prev, [currentStep.key]: option }))}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${currentValue === option ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))} disabled={stepIndex === 0}>Previous</Button>
            {stepIndex < onboardingSteps.length - 1 ? (
              <Button onClick={() => setStepIndex((prev) => Math.min(onboardingSteps.length - 1, prev + 1))} disabled={!currentValue}>Next</Button>
            ) : (
              <Button onClick={completeCourseQuestionnaire} disabled={!currentValue}>Continue to Registration</Button>
            )}
          </div>
        </Modal>
      )}

      {showRegister && (
        <Modal title="Create Your Account" onClose={() => setShowRegister(false)}>
          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Your AI Recommendation</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{recommendation.title}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {recommendation.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First Name" value={registerForm.firstName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, firstName: event.target.value }))} />
              <Input label="Last Name" value={registerForm.lastName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, lastName: event.target.value }))} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Account Type</label>
              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Student account</div>
              <p className="mt-1 text-xs text-slate-500">Instructor applications are available from the "Join as Instructor" menu.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" value={registerForm.email} onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))} />
              <div>
                <Input
                  label="Password"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => { setRegisterForm((prev) => ({ ...prev, password: event.target.value })); setPasswordTouched(true); }}
                />
                {passwordTouched && (
                  <ul className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <li key={check.label} className={`flex items-center gap-1.5 text-xs ${check.met ? 'text-emerald-600' : 'text-rose-500'}`}>
                        <span>{check.met ? '✓' : '✗'}</span>
                        {check.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {registerError && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{registerError}</div>}

            <Button type="submit" className="w-full" disabled={passwordTouched && !allPasswordChecksMet}>Create Account & Go to Dashboard</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
