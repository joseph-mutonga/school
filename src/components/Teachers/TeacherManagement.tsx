import React, { useState } from 'react';
import { Search, Plus, Edit3, Eye, Trash2, Filter, BookOpen, Users, Calendar, FileText } from 'lucide-react';
import { Teacher } from '../../types';
import { mockTeachers } from '../../utils/mockData';

export const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || teacher.subject.toLowerCase().includes(selectedDepartment.toLowerCase());
    
    return matchesSearch && matchesDepartment;
  });

  const departments = ['all', 'Mathematics', 'Computer Studies', 'History', 'Business Studies', 'Academics'];

  const handleAddTeacher = (teacherData: Partial<Teacher>) => {
    const newTeacher: Teacher = {
      id: Date.now().toString(),
      employeeNumber: `MAMT${String(teachers.length + 1).padStart(3, '0')}`,
      ...teacherData as Teacher
    };
    setTeachers([...teachers, newTeacher]);
    setShowAddModal(false);
  };

  const handleEditTeacher = (teacherData: Teacher) => {
    setTeachers(teachers.map(t => t.id === teacherData.id ? teacherData : t));
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm('Are you sure you want to remove this teacher?')) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const getTeacherRole = (subject: string) => {
    if (subject.includes('Head of Academics')) return 'Head of Academics';
    if (subject.includes('Computer')) return 'Computer Teacher';
    if (subject.includes('Mathematics')) return 'Mathematics Teacher';
    if (subject.includes('History') && subject.includes('Business')) return 'History & Business Teacher';
    return 'Teacher';
  };

  const getRoleColor = (subject: string) => {
    if (subject.includes('Head of Academics')) return 'bg-purple-100 text-purple-800';
    if (subject.includes('Computer')) return 'bg-blue-100 text-blue-800';
    if (subject.includes('Mathematics')) return 'bg-green-100 text-green-800';
    if (subject.includes('History') && subject.includes('Business')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {teacher.firstName} {teacher.lastName}
                </h3>
                <p className="text-sm text-gray-600">{teacher.employeeNumber}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleColor(teacher.subject)}`}>
                  {getTeacherRole(teacher.subject)}
                </span>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setSelectedTeacher(teacher)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setEditingTeacher(teacher)}
                  className="text-green-600 hover:text-green-900"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{teacher.subject}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{teacher.classes.length} Classes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  Joined {new Date(teacher.dateJoined).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="flex-1 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                  View Schedule
                </button>
                <button className="flex-1 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors">
                  Enter Marks
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Teachers</h3>
          <p className="text-2xl font-bold text-gray-900">{filteredTeachers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active Teachers</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredTeachers.filter(t => t.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Classes</h3>
          <p className="text-2xl font-bold text-blue-600">
            {filteredTeachers.reduce((sum, t) => sum + t.classes.length, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Departments</h3>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(filteredTeachers.map(t => t.subject.split(' ')[0])).size}
          </p>
        </div>
      </div>

      {/* Teacher Details Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </h2>
                  <p className="text-gray-600">{selectedTeacher.employeeNumber}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleColor(selectedTeacher.subject)}`}>
                    {getTeacherRole(selectedTeacher.subject)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Email:</span> {selectedTeacher.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedTeacher.phone}</p>
                    <p><span className="font-medium">Date Joined:</span> {new Date(selectedTeacher.dateJoined).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Teaching Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Subject(s):</span> {selectedTeacher.subject}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedTeacher.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedTeacher.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Classes Assigned</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedTeacher.classes.map((className, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">
                      {className}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setEditingTeacher(selectedTeacher);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {(showAddModal || editingTeacher) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <p className="text-gray-600 mb-4">
                {editingTeacher ? 'Update teacher information' : 'Teacher registration form would be implemented here with proper validation and form handling.'}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (editingTeacher) {
                      setEditingTeacher(null);
                    } else {
                      setShowAddModal(false);
                    }
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  {editingTeacher ? 'Update' : 'Add'} Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};