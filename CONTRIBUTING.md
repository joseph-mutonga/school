# Contributing to MaMSMS

Thank you for your interest in contributing to the Magereza Mixed Secondary School Management System! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/magereza-school-management.git
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code formatting (ESLint configuration)
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all components are properly typed

### Component Structure
- Keep components focused and single-purpose
- Use functional components with hooks
- Implement proper error handling
- Follow the existing folder structure

### Styling
- Use Tailwind CSS classes
- Follow the existing design system
- Ensure responsive design
- Test on different screen sizes

## 🧪 Testing

Before submitting your changes:
1. Test all functionality manually
2. Ensure the application builds without errors:
   ```bash
   npm run build
   ```
3. Run the linter:
   ```bash
   npm run lint
   ```

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Test your changes** thoroughly
3. **Create a pull request** with:
   - Clear title and description
   - Screenshots if UI changes are involved
   - Reference any related issues

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Build passes
- [ ] Linting passes

## Screenshots (if applicable)
Add screenshots here
```

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information
- Screenshots if applicable

## 💡 Feature Requests

For new features:
- Describe the feature clearly
- Explain the use case
- Consider the impact on existing functionality
- Discuss implementation approach

## 📚 Areas for Contribution

### High Priority
- SMS/Email notification system
- PDF report generation
- Advanced search and filtering
- Data export functionality
- Mobile responsiveness improvements

### Medium Priority
- Timetable management
- Exam scheduling
- Parent portal
- Advanced analytics
- Performance optimizations

### Documentation
- API documentation
- User guides
- Installation guides
- Video tutorials

## 🔧 Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Environment Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:5173

### Project Structure
```
src/
├── components/     # React components
├── hooks/         # Custom hooks
├── types/         # TypeScript types
├── utils/         # Utilities and mock data
└── App.tsx       # Main app component
```

## 📞 Getting Help

- Create an issue for bugs or questions
- Join discussions in existing issues
- Contact the maintainers directly

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to MaMSMS! 🎓