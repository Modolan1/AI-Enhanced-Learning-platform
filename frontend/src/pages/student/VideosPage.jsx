import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import Card from '../../components/common/Card';
import { studentService } from '../../services/studentService';

function getVideoUrl(item) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
  if (!item?.videoUrl) return '';
  if (item.videoUrl.startsWith('/uploads')) return `${baseUrl}${item.videoUrl}`;
  return item.videoUrl;
}

function isDirectVideoFile(url) {
  return /\.(mp4|webm|mov|mkv|avi)(\?.*)?$/i.test(url || '');
}

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const response = await studentService.getInstructorContent({ contentType: 'video' });
        setVideos(response.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load instructor videos.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <StudentLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Instructor Videos</h1>
        <p className="mt-1 text-sm text-slate-500">Watch all uploaded learning videos from instructors.</p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {loading && <div className="text-sm text-slate-500">Loading videos...</div>}

      {!loading && !videos.length && (
        <Card>
          <p className="text-sm text-slate-500">No instructor videos are available yet.</p>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {videos.map((item) => {
          const videoUrl = getVideoUrl(item);
          return (
            <Card key={item._id}>
              <div className="text-xs font-medium uppercase tracking-wide text-indigo-600">Video</div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <p className="mt-2 text-xs text-slate-500">By {item.instructor?.firstName} {item.instructor?.lastName}</p>

              {videoUrl && isDirectVideoFile(videoUrl) ? (
                <video className="mt-4 w-full rounded-xl" controls preload="metadata" src={videoUrl}>
                  Your browser does not support HTML video.
                </video>
              ) : (
                <a
                  className="mt-4 inline-block text-sm font-medium text-indigo-600"
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Video
                </a>
              )}
            </Card>
          );
        })}
      </div>
    </StudentLayout>
  );
}
