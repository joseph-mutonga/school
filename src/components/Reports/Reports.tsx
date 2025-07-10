import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter } from 'lucide-react';
import { mockStudents, mockAcademicRecords, mockFeePayments, mockAttendance } from '../../utils/mockData';

export const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('academic');
  const [selectedPeriod, setSelectedPeriod] = useState('term1-2024');

  const reportTypes = [
    { id: 'academic', label: 'Academic Performance', icon: BarChart3 },
    { id: 'financial', label: 'Financial Report', icon: TrendingUp },
    { id: 'attendance', label: 'Attendance Report', icon: Calendar },
    { id: 'enrollment', label: 'Enrollment Statistics', icon: PieChart }
  ];

  const getAcademicReport = () => {
    const subjects = ['Mathematics', 'English', 'History'];
    const data = subjects.map(subject => {
      const records = mockAcademicRecords.filter(r => r.subject === subject);
      const averageScore = records.length > 0 
        ? records.reduce((sum, r) => sum + r.totalScore, 0) / records.length 
        : 0;
      const passRate = records.length > 0
        ? (records.filter(r => r.totalScore >= 50).length / records.length) * 100
        : 0;
      
      return { subject, averageScore: Math.round(averageScore), passRate: Math.round(passRate) };
    });
    
    return data;
  };

  const getFinancialReport = () => {
    const totalCollection = mockFeePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalOutstanding = mockStudents.reduce((sum, student) => sum + student.feeBalance, 0);
    const collectionRate = ((totalCollection / (totalCollection + totalOutstanding)) * 100).toFixed(1);
    
    return {
      totalCollection,
      totalOutstanding,
      collectionRate: parseFloat(collectionRate),
      totalStudents: mockStudents.length,
      paidStudents: mockStudents.filter(s => s.feeBalance === 0).length
    };
  };

  const getAttendanceReport = () => {
    const classes = Array.from(new Set(mockStudents.map(s => `${s.class} ${s.stream}`)));
    const data = classes.map(className => {
      const studentsInClass = mockStudents.filter(s => `${s.class} ${s.stream}` === className);
      const attendanceRecords = mockAttendance.filter(r => r.class === className);
      const attendanceRate = studentsInClass.length > 0 
        ? (attendanceRecords.filter(r => r.status === 'present').length / studentsInClass.length) * 100
        : 0;
      
      return { 
        class: className, 
        totalStudents: studentsInClass.length,
        attendanceRate: Math.round(attendanceRate)
      };
    });
    
    return data;
  };

  const getEnrollmentReport = () => {
    const maleCount = mockStudents.filter(s => s.gender === 'male').length;
    const femaleCount = mockStudents.filter(s => s.gender === 'female').length;
    const classCounts = mockStudents.reduce((acc, student) => {
      acc[student.class] = (acc[student.class] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      gender: { male: maleCount, female: femaleCount },
      classes: classCounts,
      totalStudents: mockStudents.length
    };
  };

  const academicData = getAcademicReport();
  const financialData = getFinancialReport();
  const attendanceData = getAttendanceReport();
  const enrollmentData = getEnrollmentReport();

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'academic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Overall Average</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(academicData.reduce((sum, d) => sum + d.averageScore, 0) / academicData.length)}%
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Best Subject</h4>
                <p className="text-lg font-bold text-green-600">
                  {academicData.reduce((best, current) => 
                    current.averageScore > best.averageScore ? current : best
                  ).subject}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Average Pass Rate</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(academicData.reduce((sum, d) => sum + d.passRate, 0) / academicData.length)}%
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Subject Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {academicData.map((subject) => (
                      <tr key={subject.subject}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.averageScore}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.passRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${subject.averageScore}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Collection</h4>
                <p className="text-xl font-bold text-green-600">
                  KES {financialData.totalCollection.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Outstanding</h4>
                <p className="text-xl font-bold text-red-600">
                  KES {financialData.totalOutstanding.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Collection Rate</h4>
                <p className="text-xl font-bold text-blue-600">{financialData.collectionRate}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Fully Paid</h4>
                <p className="text-xl font-bold text-purple-600">
                  {financialData.paidStudents}/{financialData.totalStudents}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Collection Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Collected Fees</span>
                  <span className="text-lg font-bold text-green-600">
                    KES {financialData.totalCollection.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Outstanding Fees</span>
                  <span className="text-lg font-bold text-red-600">
                    KES {financialData.totalOutstanding.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Total Expected</span>
                  <span className="text-lg font-bold text-blue-600">
                    KES {(financialData.totalCollection + financialData.totalOutstanding).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Classes</h4>
                <p className="text-2xl font-bold text-blue-600">{attendanceData.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Average Attendance</h4>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(attendanceData.reduce((sum, d) => sum + d.attendanceRate, 0) / attendanceData.length)}%
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Students</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {attendanceData.reduce((sum, d) => sum + d.totalStudents, 0)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Class-wise Attendance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceData.map((classData) => (
                      <tr key={classData.class}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {classData.class}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.totalStudents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.attendanceRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${classData.attendanceRate}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'enrollment':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Students</h4>
                <p className="text-2xl font-bold text-blue-600">{enrollmentData.totalStudents}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Male Students</h4>
                <p className="text-2xl font-bold text-blue-600">{enrollmentData.gender.male}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Female Students</h4>
                <p className="text-2xl font-bold text-pink-600">{enrollmentData.gender.female}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gender Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Male</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(enrollmentData.gender.male / enrollmentData.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{enrollmentData.gender.male}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Female</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-pink-600 h-2 rounded-full" 
                          style={{ width: `${(enrollmentData.gender.female / enrollmentData.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{enrollmentData.gender.female}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Class Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(enrollmentData.classes).map(([className, count]) => (
                    <div key={className} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{className}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / enrollmentData.totalStudents) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="term1-2024">Term 1, 2024</option>
            <option value="term2-2024">Term 2, 2024</option>
            <option value="term3-2024">Term 3, 2024</option>
          </select>
          <button className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedReport === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-2 mx-auto" />
                <p className="text-sm font-medium">{type.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};