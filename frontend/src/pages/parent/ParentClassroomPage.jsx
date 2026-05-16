import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function ParentClassroomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/classrooms/${id}/activities`);
        setClassroom(res.data.classroom || null);
        setActivities(res.data.activities || []);
      } catch (err) {
        console.error('[ParentClassroom] Failed to load activities:', err);
        setError(err.response?.data?.error || 'Failed to load classroom activities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="py-12 text-center text-slate-600">Loading classroom…</div>;
  if (error) return <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700">{error}</div>;

  return (
    <div>
      <button onClick={() => navigate('/parent/join-classroom')} className="text-sky font-medium mb-4">← Back to Classrooms</button>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
        <h1 className="text-2xl font-bold">{classroom?.name || 'Classroom'}</h1>
        <p className="text-sm text-slate-500">Code: {classroom?.code || '—'}</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Assigned Activities</h2>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-600">There is no activity yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((a) => (
              <div key={a.id} className="p-4 border rounded-lg hover:bg-sky/5">
                <div className="font-semibold text-slate-900">{a.title}</div>
                {a.description && <div className="text-sm text-slate-600 mt-1">{a.description}</div>}
                <div className="text-xs text-slate-400 mt-2">Published: {new Date(a.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
