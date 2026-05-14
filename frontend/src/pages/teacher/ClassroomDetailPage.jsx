// ============================================================
// ClassroomDetailPage — Teacher manages classroom members
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  ArrowLeft, UserCheck, UserX, Clock,
  Users, Mail, Calendar,
} from 'lucide-react';

function ClassroomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [classRes, membersRes] = await Promise.all([
        api.get(`/classrooms/${id}`), // Wait, I didn't add this route. Need to add GET /:id for classroom info.
        api.get(`/classrooms/${id}/members`)
      ]);
      setClassroom(classRes.data.classroom);
      setMembers(membersRes.data.members);
    } catch (err) {
      console.error(err);
      if (err.status === 404) navigate('/teacher/classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      await api.post(`/classrooms/${id}/members/${userId}/${action}`);
      fetchData(); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6">Loading classroom...</div>;
  if (!classroom) return <div className="p-6">Classroom not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/teacher/classrooms')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-display text-gray-900 dark:text-white">{classroom.name}</h1>
          <p className="text-sm text-gray-500">Classroom Code: {classroom.code}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-sky" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h2>
        </div>

        {members.length === 0 ? (
          <p className="text-gray-500">No members yet. Share the classroom code with parents.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky flex items-center justify-center text-white font-semibold">
                    {member.first_name[0]}{member.last_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">@{member.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      member.status === 'approved' ? 'text-green-600' :
                      member.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {member.status === 'approved' ? 'Approved' :
                       member.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(member.requested_at).toLocaleDateString()}
                    </p>
                  </div>

                  {member.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(member.user_id, 'approve')}
                        className="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                      >
                        <UserCheck size={16} />
                      </button>
                      <button
                        onClick={() => handleAction(member.user_id, 'reject')}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassroomDetailPage;