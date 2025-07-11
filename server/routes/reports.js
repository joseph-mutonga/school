const express = require('express');
const { getQuery, allQuery } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get academic performance report
router.get('/academic', authenticateToken, async (req, res) => {
  try {
    const { term, year, class: classFilter, subject } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (term) {
      whereClause += ' AND ar.term = ?';
      params.push(term);
    }

    if (year) {
      whereClause += ' AND ar.year = ?';
      params.push(year);
    }

    if (classFilter) {
      whereClause += ' AND s.class = ?';
      params.push(classFilter);
    }

    if (subject) {
      whereClause += ' AND ar.subject = ?';
      params.push(subject);
    }

    const [overallStats, subjectPerformance, classPerformance, gradeDistribution] = await Promise.all([
      getQuery(`
        SELECT 
          COUNT(*) as totalRecords,
          AVG(ar.total_score) as averageScore,
          COUNT(CASE WHEN ar.total_score >= 50 THEN 1 END) as passCount,
          COUNT(CASE WHEN ar.grade IN ('A', 'A-') THEN 1 END) as excellentCount
        FROM academic_records ar
        JOIN students s ON ar.student_id = s.id
        ${whereClause}
      `, params),

      allQuery(`
        SELECT 
          ar.subject,
          COUNT(*) as totalStudents,
          AVG(ar.total_score) as averageScore,
          COUNT(CASE WHEN ar.total_score >= 50 THEN 1 END) as passCount,
          COUNT(CASE WHEN ar.grade IN ('A', 'A-') THEN 1 END) as excellentCount
        FROM academic_records ar
        JOIN students s ON ar.student_id = s.id
        ${whereClause}
        GROUP BY ar.subject
        ORDER BY averageScore DESC
      `, params),

      allQuery(`
        SELECT 
          s.class,
          COUNT(*) as totalStudents,
          AVG(ar.total_score) as averageScore,
          COUNT(CASE WHEN ar.total_score >= 50 THEN 1 END) as passCount
        FROM academic_records ar
        JOIN students s ON ar.student_id = s.id
        ${whereClause}
        GROUP BY s.class
        ORDER BY averageScore DESC
      `, params),

      allQuery(`
        SELECT 
          ar.grade,
          COUNT(*) as count
        FROM academic_records ar
        JOIN students s ON ar.student_id = s.id
        ${whereClause}
        GROUP BY ar.grade
        ORDER BY 
          CASE ar.grade 
            WHEN 'A' THEN 1 WHEN 'A-' THEN 2 WHEN 'B+' THEN 3 WHEN 'B' THEN 4 
            WHEN 'B-' THEN 5 WHEN 'C+' THEN 6 WHEN 'C' THEN 7 WHEN 'C-' THEN 8 
            WHEN 'D+' THEN 9 WHEN 'D' THEN 10 WHEN 'D-' THEN 11 ELSE 12 
          END
      `, params)
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRecords: overallStats.totalRecords,
          averageScore: Math.round(overallStats.averageScore || 0),
          passRate: overallStats.totalRecords > 0 ? Math.round((overallStats.passCount / overallStats.totalRecords) * 100) : 0,
          excellenceRate: overallStats.totalRecords > 0 ? Math.round((overallStats.excellentCount / overallStats.totalRecords) * 100) : 0
        },
        subjectPerformance: subjectPerformance.map(subject => ({
          ...subject,
          averageScore: Math.round(subject.averageScore),
          passRate: Math.round((subject.passCount / subject.totalStudents) * 100),
          excellenceRate: Math.round((subject.excellentCount / subject.totalStudents) * 100)
        })),
        classPerformance: classPerformance.map(cls => ({
          ...cls,
          averageScore: Math.round(cls.averageScore),
          passRate: Math.round((cls.passCount / cls.totalStudents) * 100)
        })),
        gradeDistribution
      }
    });
  } catch (error) {
    logger.error('Get academic report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate academic report'
    });
  }
});

// Get financial report
router.get('/financial', authenticateToken, async (req, res) => {
  try {
    const { term, year, class: classFilter } = req.query;
    
    let paymentWhereClause = 'WHERE 1=1';
    let studentWhereClause = 'WHERE s.status = "active"';
    const paymentParams = [];
    const studentParams = [];

    if (term) {
      paymentWhereClause += ' AND fp.term = ?';
      paymentParams.push(term);
    }

    if (year) {
      paymentWhereClause += ' AND fp.year = ?';
      paymentParams.push(year);
    }

    if (classFilter) {
      paymentWhereClause += ' AND s.class = ?';
      studentWhereClause += ' AND s.class = ?';
      paymentParams.push(classFilter);
      studentParams.push(classFilter);
    }

    const [collectionStats, outstandingStats, paymentMethods, classBreakdown] = await Promise.all([
      getQuery(`
        SELECT 
          COUNT(*) as totalPayments,
          SUM(fp.amount) as totalCollection,
          AVG(fp.amount) as averagePayment
        FROM fee_payments fp
        JOIN students s ON fp.student_id = s.id
        ${paymentWhereClause}
      `, paymentParams),

      getQuery(`
        SELECT 
          COUNT(*) as studentsWithBalance,
          SUM(s.fee_balance) as totalOutstanding,
          AVG(s.fee_balance) as averageBalance
        FROM students s
        ${studentWhereClause} AND s.fee_balance > 0
      `, studentParams),

      allQuery(`
        SELECT 
          fp.payment_method,
          COUNT(*) as count,
          SUM(fp.amount) as total
        FROM fee_payments fp
        JOIN students s ON fp.student_id = s.id
        ${paymentWhereClause}
        GROUP BY fp.payment_method
        ORDER BY total DESC
      `, paymentParams),

      allQuery(`
        SELECT 
          s.class,
          COUNT(DISTINCT s.id) as totalStudents,
          COUNT(DISTINCT fp.student_id) as paidStudents,
          SUM(COALESCE(fp.amount, 0)) as totalCollection,
          SUM(s.fee_balance) as totalOutstanding
        FROM students s
        LEFT JOIN fee_payments fp ON s.id = fp.student_id ${term ? 'AND fp.term = ?' : ''} ${year ? 'AND fp.year = ?' : ''}
        WHERE s.status = "active" ${classFilter ? 'AND s.class = ?' : ''}
        GROUP BY s.class
        ORDER BY totalCollection DESC
      `, classFilter ? [classFilter] : [])
    ]);

    const totalStudents = await getQuery(`
      SELECT COUNT(*) as total FROM students s ${studentWhereClause}
    `, studentParams);

    res.json({
      success: true,
      data: {
        summary: {
          totalCollection: collectionStats.totalCollection || 0,
          totalOutstanding: outstandingStats.totalOutstanding || 0,
          totalPayments: collectionStats.totalPayments,
          studentsWithBalance: outstandingStats.studentsWithBalance,
          totalStudents: totalStudents.total,
          collectionRate: (collectionStats.totalCollection && outstandingStats.totalOutstanding) 
            ? Math.round((collectionStats.totalCollection / (collectionStats.totalCollection + outstandingStats.totalOutstanding)) * 100)
            : 0
        },
        paymentMethods,
        classBreakdown: classBreakdown.map(cls => ({
          ...cls,
          paymentRate: cls.totalStudents > 0 ? Math.round((cls.paidStudents / cls.totalStudents) * 100) : 0
        }))
      }
    });
  } catch (error) {
    logger.error('Get financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report'
    });
  }
});

// Get attendance report
router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    const { date, class: classFilter, startDate, endDate } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date) {
      whereClause += ' AND ar.date = ?';
      params.push(date);
    } else if (startDate && endDate) {
      whereClause += ' AND ar.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (classFilter) {
      whereClause += ' AND ar.class = ?';
      params.push(classFilter);
    }

    const [overallStats, classStats, dailyStats, statusDistribution] = await Promise.all([
      getQuery(`
        SELECT 
          COUNT(*) as totalRecords,
          COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as presentCount,
          COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absentCount,
          COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as lateCount
        FROM attendance_records ar
        ${whereClause}
      `, params),

      allQuery(`
        SELECT 
          ar.class,
          COUNT(*) as totalRecords,
          COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as presentCount,
          COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absentCount,
          COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as lateCount
        FROM attendance_records ar
        ${whereClause}
        GROUP BY ar.class
        ORDER BY ar.class
      `, params),

      allQuery(`
        SELECT 
          ar.date,
          COUNT(*) as totalRecords,
          COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as presentCount,
          COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absentCount
        FROM attendance_records ar
        ${whereClause}
        GROUP BY ar.date
        ORDER BY ar.date DESC
        LIMIT 30
      `, params),

      allQuery(`
        SELECT 
          ar.status,
          COUNT(*) as count
        FROM attendance_records ar
        ${whereClause}
        GROUP BY ar.status
      `, params)
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRecords: overallStats.totalRecords,
          presentCount: overallStats.presentCount,
          absentCount: overallStats.absentCount,
          lateCount: overallStats.lateCount,
          attendanceRate: overallStats.totalRecords > 0 ? Math.round((overallStats.presentCount / overallStats.totalRecords) * 100) : 0
        },
        classBreakdown: classStats.map(cls => ({
          ...cls,
          attendanceRate: cls.totalRecords > 0 ? Math.round((cls.presentCount / cls.totalRecords) * 100) : 0
        })),
        dailyTrends: dailyStats.map(day => ({
          ...day,
          attendanceRate: day.totalRecords > 0 ? Math.round((day.presentCount / day.totalRecords) * 100) : 0
        })),
        statusDistribution
      }
    });
  } catch (error) {
    logger.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance report'
    });
  }
});

// Get enrollment report
router.get('/enrollment', authenticateToken, async (req, res) => {
  try {
    const [genderStats, classStats, admissionTrends, statusStats] = await Promise.all([
      allQuery(`
        SELECT 
          gender,
          COUNT(*) as count
        FROM students 
        WHERE status = 'active'
        GROUP BY gender
      `),

      allQuery(`
        SELECT 
          class,
          stream,
          COUNT(*) as count,
          COUNT(CASE WHEN gender = 'male' THEN 1 END) as maleCount,
          COUNT(CASE WHEN gender = 'female' THEN 1 END) as femaleCount
        FROM students 
        WHERE status = 'active'
        GROUP BY class, stream
        ORDER BY class, stream
      `),

      allQuery(`
        SELECT 
          strftime('%Y-%m', admission_date) as month,
          COUNT(*) as admissions
        FROM students 
        WHERE admission_date >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', admission_date)
        ORDER BY month
      `),

      allQuery(`
        SELECT 
          status,
          COUNT(*) as count
        FROM students
        GROUP BY status
      `)
    ]);

    const totalStudents = await getQuery('SELECT COUNT(*) as total FROM students WHERE status = "active"');

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents: totalStudents.total,
          maleStudents: genderStats.find(g => g.gender === 'male')?.count || 0,
          femaleStudents: genderStats.find(g => g.gender === 'female')?.count || 0
        },
        genderDistribution: genderStats,
        classDistribution: classStats,
        admissionTrends,
        statusDistribution: statusStats
      }
    });
  } catch (error) {
    logger.error('Get enrollment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enrollment report'
    });
  }
});

// Get library report
router.get('/library', authenticateToken, async (req, res) => {
  try {
    const [bookStats, issueStats, categoryStats, overdueBooks] = await Promise.all([
      getQuery(`
        SELECT 
          COUNT(*) as totalBooks,
          SUM(total_copies) as totalCopies,
          SUM(available_copies) as availableCopies
        FROM books
      `),

      getQuery(`
        SELECT 
          COUNT(*) as totalIssues,
          COUNT(CASE WHEN status = 'issued' THEN 1 END) as activeIssues,
          COUNT(CASE WHEN status = 'returned' THEN 1 END) as returnedBooks,
          COUNT(CASE WHEN status = 'issued' AND due_date < date('now') THEN 1 END) as overdueBooks
        FROM book_issues
      `),

      allQuery(`
        SELECT 
          category,
          COUNT(*) as bookCount,
          SUM(total_copies) as totalCopies,
          SUM(available_copies) as availableCopies
        FROM books
        GROUP BY category
        ORDER BY bookCount DESC
      `),

      allQuery(`
        SELECT 
          b.title,
          b.author,
          s.first_name,
          s.last_name,
          s.admission_number,
          bi.issue_date,
          bi.due_date,
          julianday('now') - julianday(bi.due_date) as days_overdue
        FROM book_issues bi
        JOIN books b ON bi.book_id = b.id
        JOIN students s ON bi.student_id = s.id
        WHERE bi.status = 'issued' AND bi.due_date < date('now')
        ORDER BY days_overdue DESC
      `)
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalBooks: bookStats.totalBooks,
          totalCopies: bookStats.totalCopies || 0,
          availableCopies: bookStats.availableCopies || 0,
          issuedCopies: (bookStats.totalCopies || 0) - (bookStats.availableCopies || 0),
          totalIssues: issueStats.totalIssues,
          activeIssues: issueStats.activeIssues,
          overdueBooks: issueStats.overdueBooks,
          utilizationRate: bookStats.totalCopies > 0 ? Math.round(((bookStats.totalCopies - bookStats.availableCopies) / bookStats.totalCopies) * 100) : 0
        },
        categoryBreakdown: categoryStats.map(cat => ({
          ...cat,
          utilizationRate: cat.totalCopies > 0 ? Math.round(((cat.totalCopies - cat.availableCopies) / cat.totalCopies) * 100) : 0
        })),
        overdueBooks: overdueBooks.map(book => ({
          ...book,
          days_overdue: Math.floor(book.days_overdue)
        }))
      }
    });
  } catch (error) {
    logger.error('Get library report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate library report'
    });
  }
});

// Get dashboard summary for different user roles
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    let dashboardData = {};

    // Common stats for all users
    const commonStats = await Promise.all([
      getQuery('SELECT COUNT(*) as total FROM students WHERE status = "active"'),
      getQuery('SELECT COUNT(*) as total FROM teachers WHERE status = "active"')
    ]);

    dashboardData.totalStudents = commonStats[0].total;
    dashboardData.totalTeachers = commonStats[1].total;

    // Role-specific stats
    switch (userRole) {
      case 'admin':
        const adminStats = await Promise.all([
          getQuery('SELECT SUM(amount) as total FROM fee_payments WHERE date(created_at) = date("now")'),
          getQuery('SELECT COUNT(*) as total FROM attendance_records WHERE date = date("now") AND status = "present"'),
          getQuery('SELECT COUNT(*) as total FROM attendance_records WHERE date = date("now") AND status = "absent"'),
          getQuery('SELECT COUNT(*) as total FROM book_issues WHERE status = "issued"'),
          getQuery('SELECT COUNT(*) as total FROM book_issues WHERE status = "issued" AND due_date < date("now")')
        ]);

        dashboardData.todayCollection = adminStats[0].total || 0;
        dashboardData.todayPresent = adminStats[1].total;
        dashboardData.todayAbsent = adminStats[2].total;
        dashboardData.booksIssued = adminStats[3].total;
        dashboardData.overdueBooks = adminStats[4].total;
        break;

      case 'teacher':
        const teacherStats = await Promise.all([
          getQuery('SELECT COUNT(*) as total FROM attendance_records WHERE date = date("now") AND status = "present"'),
          getQuery('SELECT COUNT(*) as total FROM attendance_records WHERE date = date("now") AND status = "absent"'),
          getQuery('SELECT COUNT(*) as total FROM academic_records WHERE created_at >= date("now", "-7 days")')
        ]);

        dashboardData.todayPresent = teacherStats[0].total;
        dashboardData.todayAbsent = teacherStats[1].total;
        dashboardData.recentRecords = teacherStats[2].total;
        break;

      case 'finance':
        const financeStats = await Promise.all([
          getQuery('SELECT SUM(amount) as total FROM fee_payments WHERE date(created_at) = date("now")'),
          getQuery('SELECT SUM(amount) as total FROM fee_payments WHERE date(created_at) >= date("now", "-30 days")'),
          getQuery('SELECT SUM(fee_balance) as total FROM students WHERE status = "active"'),
          getQuery('SELECT COUNT(*) as total FROM students WHERE status = "active" AND fee_balance > 0')
        ]);

        dashboardData.todayCollection = financeStats[0].total || 0;
        dashboardData.monthlyCollection = financeStats[1].total || 0;
        dashboardData.totalOutstanding = financeStats[2].total || 0;
        dashboardData.studentsWithBalance = financeStats[3].total;
        break;

      case 'librarian':
        const librarianStats = await Promise.all([
          getQuery('SELECT COUNT(*) as total FROM books'),
          getQuery('SELECT COUNT(*) as total FROM book_issues WHERE status = "issued"'),
          getQuery('SELECT COUNT(*) as total FROM book_issues WHERE status = "issued" AND due_date < date("now")'),
          getQuery('SELECT COUNT(*) as total FROM book_issues WHERE date(created_at) = date("now")')
        ]);

        dashboardData.totalBooks = librarianStats[0].total;
        dashboardData.booksIssued = librarianStats[1].total;
        dashboardData.overdueBooks = librarianStats[2].total;
        dashboardData.todayIssues = librarianStats[3].total;
        break;
    }

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Get dashboard report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard report'
    });
  }
});

module.exports = router;