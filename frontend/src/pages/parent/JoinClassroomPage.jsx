// ============================================================
// JoinClassroomPage — Parent joins a classroom by code
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../utils/api';
import {
  BookOpen, Users, Key, CheckCircle,
  AlertCircle, ArrowRight,
} from 'lucide-react';

function JoinClassroomPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyClassrooms();
  }, []);

  const fetchMyClassrooms = async () => {
    try {
      const res = await api.get('/classrooms/my');
      setClassrooms(res.data.classrooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinClassroom = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    setMessage('');
    try {
      const res = await api.post('/classrooms/join', { code: code.trim() });
      setMessage('Successfully joined classroom!');
      setCode('');
      fetchMyClassrooms();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to join classroom');
    } finally {
      setJoining(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-gray-900 dark:text-white mb-2">Join Classroom</h1>
        <p className="text-gray-600 dark:text-gray-300">Enter the classroom code provided by your teacher to join.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <Key size={24} className="text-sky" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Join by Code</h2>
          </div>

          <form onSubmit={joinClassroom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Classroom Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white uppercase tracking-wider"
                maxLength={6}
                required
              />
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm ${
                message.includes('Successfully') 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                {message.includes('Successfully') ? <CheckCircle size={16} className="inline mr-2" /> : <AlertCircle size={16} className="inline mr-2" />}
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={joining || code.length !== 6}
              className="w-full btn-game bg-sky text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joining ? 'Joining...' : 'Join Classroom'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={24} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Classrooms</h2>
          </div>

          {classrooms.length === 0 ? (
            <p className="text-gray-500">No classrooms joined yet.</p>
          ) : (
            <div className="space-y-3">
              {classrooms.map((classroom) => (
                <div key={classroom.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{classroom.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(classroom.status)}`}>
                      {classroom.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Teacher: {classroom.teacher_first} {classroom.teacher_last}
                  </p>
                  <p className="text-xs text-gray-400">
                    Requested: {new Date(classroom.requested_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinClassroomPage;