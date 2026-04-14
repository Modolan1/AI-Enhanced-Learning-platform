import { useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { studentService } from '../../services/studentService';

export default function StudySmartPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseName, setCourseName] = useState('');
  const [topic, setTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await studentService.getDashboard();
      const enrolledCourses = (response.data?.progress || [])
        .map((item) => ({ id: item.course._id, title: item.course.title }))
        .filter((course, index, self) => self.findIndex((c) => c.id === course.id) === index);
      setCourses(enrolledCourses);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    setSelectedCourse(courseId);
    if (course) {
      setCourseName(course.title);
    }
  };

  const generateContent = async () => {
    if (!courseName.trim() || !topic.trim()) {
      setError('Please enter a course name and learning topic.');
      return;
    }

    try {
      setContentLoading(true);
      setError('');
      setGeneratedContent(null);

      const response = await studentService.generateStructuredContent({
        courseName: courseName.trim(),
        topic: topic.trim(),
        skillLevel,
      });

      setGeneratedContent(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate content. Please try again.');
    } finally {
      setContentLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Study Smart</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate AI-powered structured learning content tailored to your skill level.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-900">Content Generator</h3>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Your Courses</label>
              {!loading && courses.length > 0 && (
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={selectedCourse}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                >
                  <option value="">Select a course (optional)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              )}
              {courses.length === 0 && !loading && (
                <p className="mt-2 text-xs text-slate-500">No enrolled courses. Enter course name manually below.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Course Name</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Introduction to Biology"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">What do you want to learn?</label>
              <textarea
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Photosynthesis and cellular respiration"
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Your Learning Level</label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
              >
                <option value="Beginner">Beginner - New to this topic</option>
                <option value="Intermediate">Intermediate - Have some knowledge</option>
                <option value="Advanced">Advanced - Deep understanding</option>
              </select>
            </div>

            <Button
              className="w-full"
              onClick={generateContent}
              disabled={contentLoading || !courseName.trim() || !topic.trim()}
            >
              {contentLoading ? 'Generating...' : 'Generate Learning Content'}
            </Button>

            <button
              onClick={loadCourses}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Reload My Courses
            </button>
          </div>
        </Card>

        {/* Generated Content */}
        {generatedContent && (
          <Card className="space-y-6 lg:col-span-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">📚 Overview</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{generatedContent.overview}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">🎯 Key Concepts</h3>
              <ul className="mt-2 space-y-2">
                {(generatedContent.keyConcepts || []).map((concept, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700">{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">💡 Learning Approach</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{generatedContent.learningApproach}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">📝 Practice Exercises</h3>
              <ul className="mt-2 space-y-2">
                {(generatedContent.practiceExercises || []).map((exercise, idx) => (
                  <li key={idx} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700">
                    {exercise}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">🔍 Common Misconceptions</h3>
              <ul className="mt-2 space-y-2">
                {(generatedContent.misconceptions || []).map((misconception, idx) => (
                  <li key={idx} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-slate-700">
                    {misconception}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">✅ Assessment Questions</h3>
              <ol className="mt-2 space-y-3">
                {(generatedContent.assessmentQuestions || []).map((question, idx) => (
                  <li key={idx} className="text-sm text-slate-700">
                    <span className="font-semibold">{idx + 1}. {question}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">📚 Further Resources</h3>
              <ul className="mt-2 space-y-2">
                {(generatedContent.furtherResources || []).map((resource, idx) => (
                  <li key={idx} className="text-sm text-slate-700">
                    • {resource}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        {!generatedContent && !contentLoading && (
          <Card className="flex flex-col items-center justify-center lg:col-span-2">
            <div className="text-center">
              <div className="text-5xl">🧠</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Generate Your First Learning Content</h3>
              <p className="mt-2 text-sm text-slate-500">
                Fill in the form on the left and click "Generate Learning Content" to get started!
              </p>
            </div>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
