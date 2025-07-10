# Magereza Mixed Secondary School Management System (MaMSMS)

A comprehensive school management system built with React, TypeScript, and Tailwind CSS for Magereza Mixed Secondary School in Kitengela.

## 🏫 About

MaMSMS is a modern, web-based school management system designed to streamline administrative tasks, improve record-keeping accuracy, and enhance communication within the school community. The system reduces paperwork and makes daily school operations more efficient.

## ✨ Features

### 🔐 Authentication & User Management
- Role-based access control (Administrator, Teacher, Finance Staff, Librarian)
- Secure login system with demo credentials
- User profile management

### 👥 Student Management
- Complete student registration and profile management
- Student search and filtering by class, name, or admission number
- Parent contact information management
- Fee balance tracking

### 📚 Academic Records
- Marks entry and grade calculation
- Subject-wise performance tracking
- Term and yearly academic records
- Grade distribution and analytics

### 💰 Fee Management
- Fee payment recording and tracking
- Receipt generation with unique numbers
- Outstanding fee management
- Payment method tracking (Cash, M-Pesa, Bank, Cheque)
- Financial reporting and analytics

### 📅 Attendance Tracking
- Daily attendance marking
- Class-wise attendance reports
- Attendance statistics and trends
- Late arrival tracking

### 📖 Library Management
- Book catalog management
- Book issuing and return tracking
- Overdue book monitoring
- Library inventory management

### 📊 Reports & Analytics
- Academic performance reports
- Financial collection reports
- Attendance analytics
- Enrollment statistics
- Data visualization with charts and graphs

## 🚀 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Code Quality**: ESLint with TypeScript support

## 📋 Prerequisites

Before running this project, make sure you have the following installed:
- Node.js (version 16 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/magereza-school-management.git
   cd magereza-school-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

## 🔑 Demo Credentials

Use these credentials to test different user roles:

| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `password` |
| Teacher | `teacher1` | `password` |
| Finance Staff | `finance1` | `password` |
| Librarian | `librarian1` | `password` |

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Academic/       # Academic records components
│   ├── Attendance/     # Attendance tracking components
│   ├── Auth/          # Authentication components
│   ├── Dashboard/     # Dashboard components
│   ├── Finance/       # Fee management components
│   ├── Layout/        # Layout and navigation components
│   ├── Library/       # Library management components
│   ├── Reports/       # Reports and analytics components
│   └── Students/      # Student management components
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions and mock data
├── App.tsx           # Main application component
├── main.tsx          # Application entry point
└── index.css         # Global styles
```

## 🎨 Design Features

- **Modern UI/UX**: Clean, professional interface with intuitive navigation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Role-based Navigation**: Customized interface based on user permissions
- **Data Visualization**: Charts and graphs for better data understanding
- **Interactive Elements**: Hover effects, smooth transitions, and micro-interactions
- **Consistent Branding**: School colors and professional typography

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## 📊 User Roles & Permissions

### Administrator
- Full system access
- User management
- System settings
- All reports and analytics
- Student and staff management

### Teacher
- Student management (view/edit)
- Academic records entry
- Attendance tracking
- Class-specific reports

### Finance Staff
- Fee management
- Payment recording
- Receipt generation
- Financial reports
- Student fee status

### Librarian
- Library catalog management
- Book issuing and returns
- Inventory tracking
- Library reports

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The build files will be generated in the `dist` directory.

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure the site settings

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the deployment prompts

## 🔮 Future Enhancements

- [ ] SMS/Email notifications to parents
- [ ] Mobile application
- [ ] Advanced reporting with PDF export
- [ ] Timetable management
- [ ] Exam scheduling
- [ ] Parent portal
- [ ] Staff payroll management
- [ ] Inventory management for school assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: [Your Name]
- **School**: Magereza Mixed Secondary School
- **Location**: Kitengela, Kajiado County

## 📞 Support

For support and questions, please contact:
- Email: support@magereza.ac.ke
- Phone: +254 XXX XXX XXX

## 🙏 Acknowledgments

- Magereza Mixed Secondary School administration
- React and TypeScript communities
- Tailwind CSS team
- Lucide React for beautiful icons

---

**Built with ❤️ for Magereza Mixed Secondary School**