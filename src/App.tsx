import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Auth/Login';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { StudentManagement } from './components/Students/StudentManagement';
import { AcademicRecords } from './components/Academic/AcademicRecords';
import { FeeManagement } from './components/Finance/FeeManagement';
import { AttendanceTracking } from './components/Attendance/AttendanceTracking';
import { LibraryManagement } from './components/Library/LibraryManagement';
import { Reports } from './components/Reports/Reports';

function App() {
  const { user, login, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'students':
        return <StudentManagement />;
      case 'academic':
        return <AcademicRecords />;
      case 'fees':
        return <FeeManagement />;
      case 'attendance':
        return <AttendanceTracking />;
      case 'library':
        return <LibraryManagement />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Settings panel would be implemented here with system configuration options.</p>
          </div>
        );
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <Layout
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={logout}
    >
      {renderCurrentView()}
    </Layout>
  );
}

export default App;