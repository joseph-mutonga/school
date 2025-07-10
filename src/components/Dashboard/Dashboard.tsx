import React from 'react';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Calendar, 
  Library, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { User, DashboardStats } from '../../types';
import { mockStudents, mockTeachers, mockBooks, mockFeePayments, mockAttendance, mockBookIssues } from '../../utils/mockData';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Calculate dashboard statistics
  const stats: DashboardStats = {
    totalStudents: mockStudents.length,
    totalTeachers: mockTeachers.length,
    totalBooks: mockBooks.reduce((sum, book) => sum + book.totalCopies, 0),
    feeCollection: mockFeePayments.reduce((sum, payment) => sum + payment.amount, 0),
    presentToday: mockAttendance.filter(record => 
      record.date === new Date().toISOString().split('T')[0] && record.status === 'present'
    ).length,
    absentToday: mockAttendance.filter(record => 
      record.date === new Date().toISOString().split('T')[0] && record.status === 'absent'
    ).length,
    booksIssued: mockBookIssues.filter(issue => issue.status === 'issued').length,
    overdueBooks: mockBookIssues.filter(issue => 
      issue.status === 'issued' && new Date(issue.dueDate) < new Date()
    ).length,
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    else if (hour >= 18) greeting = 'Good evening';
    
    return `${greeting}, ${user.name}!`;
  };

  const getStatsCards = () => {
    const baseCards = [
      {
        title: 'Total Students',
        value: stats.totalStudents,
        icon: Users,
        color: 'bg-blue-500',
        change: '+5.2%'
      }
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseCards,
          {
            title: 'Total Teachers',
            value: stats.totalTeachers,
            icon: BookOpen,
            color: 'bg-green-500',
            change: '+2.1%'
          },
          {
            title: 'Fee Collection',
            value: `KES ${stats.feeCollection.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-yellow-500',
            change: '+12.5%'
          },
          {
            title: 'Books in Library',
            value: stats.totalBooks,
            icon: Library,
            color: 'bg-purple-500',
            change: '+8.3%'
          }
        ];
      case 'teacher':
        return [
          ...baseCards,
          {
            title: 'Present Today',
            value: stats.presentToday,
            icon: CheckCircle,
            color: 'bg-green-500',
            change: '85%'
          },
          {
            title: 'Absent Today',
            value: stats.absentToday,
            icon: AlertCircle,
            color: 'bg-red-500',
            change: '15%'
          }
        ];
      case 'finance':
        return [
          ...baseCards,
          {
            title: 'Fee Collection',
            value: `KES ${stats.feeCollection.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-yellow-500',
            change: '+12.5%'
          },
          {
            title: 'Outstanding Fees',
            value: `KES ${mockStudents.reduce((sum, student) => sum + student.feeBalance, 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-orange-500',
            change: '-3.2%'
          }
        ];
      case 'librarian':
        return [
          ...baseCards,
          {
            title: 'Books Issued',
            value: stats.booksIssued,
            icon: Library,
            color: 'bg-purple-500',
            change: '+4.7%'
          },
          {
            title: 'Overdue Books',
            value: stats.overdueBooks,
            icon: AlertCircle,
            color: 'bg-red-500',
            change: '-1.2%'
          }
        ];
      default:
        return baseCards;
    }
  };

  const statsCards = getStatsCards();

  const getRecentActivity = () => {
    switch (user.role) {
      case 'admin':
        return [
          { action: 'New student admission', detail: 'James Mwangi - Form 4 East', time: '2 hours ago' },
          { action: 'Fee payment received', detail: 'KES 20,000 from Sarah Njeri', time: '4 hours ago' },
          { action: 'New teacher registered', detail: 'Mary Wanjiku - Mathematics', time: '1 day ago' },
          { action: 'Library book issued', detail: 'Advanced Mathematics to David Kipchoge', time: '2 days ago' },
          { action: 'Principal meeting scheduled', detail: 'Staff meeting with Joseph Maina', time: '3 days ago' }
        ];
      case 'teacher':
        return [
          { action: 'Marks entered', detail: 'Mathematics Form 4 East - 25 students', time: '1 hour ago' },
          { action: 'Attendance taken', detail: 'Form 4 East - 23/25 present', time: '3 hours ago' },
          { action: 'Assignment created', detail: 'Algebra Chapter 5 exercises', time: '1 day ago' }
        ];
      case 'finance':
        return [
          { action: 'Fee payment received', detail: 'KES 20,000 from Sarah Njeri', time: '2 hours ago' },
          { action: 'Receipt generated', detail: 'MAG-001-2024 for James Mwangi', time: '4 hours ago' },
          { action: 'Fee reminder sent', detail: 'To 15 students with balances', time: '1 day ago' }
        ];
      case 'librarian':
        return [
          { action: 'Book issued', detail: 'Advanced Mathematics to David Kipchoge', time: '1 hour ago' },
          { action: 'Book returned', detail: 'English Grammar from Sarah Njeri', time: '3 hours ago' },
          { action: 'New books added', detail: '25 copies of Kenya History', time: '2 days ago' }
        ];
      default:
        return [];
    }
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}</h1>
        <p className="text-blue-100">
          Welcome to the Magereza Mixed Secondary School Management System
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-green-600">{card.change}</span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.detail}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {user.role === 'admin' && (
              <>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Add Student</p>
                </button>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookOpen className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Add Teacher</p>
                </button>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <DollarSign className="w-5 h-5 text-yellow-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Record Payment</p>
                </button>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Library className="w-5 h-5 text-purple-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Issue Book</p>
                </button>
              </>
            )}
            {user.role === 'teacher' && (
              <>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Take Attendance</p>
                </button>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookOpen className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Enter Marks</p>
                </button>
              </>
            )}
            {user.role === 'finance' && (
              <>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <DollarSign className="w-5 h-5 text-yellow-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Record Payment</p>
                </button>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookOpen className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Generate Receipt</p>
                </button>
              </>
            )}
            {user.role === 'librarian' && (
              <>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Library className="w-5 h-5 text-purple-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Issue Book</p>
                </button>
                <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookOpen className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Return Book</p>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};