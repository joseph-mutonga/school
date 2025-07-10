import React, { ReactNode } from 'react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  DollarSign, 
  Calendar, 
  Library, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Camera,
  User as UserIcon
} from 'lucide-react';
import { User } from '../../types';

interface LayoutProps {
  children: ReactNode;
  user: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  currentView, 
  onViewChange, 
  onLogout 
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showPhotoModal, setShowPhotoModal] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState(user.avatar || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: GraduationCap }
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { id: 'students', label: 'Students', icon: Users },
          { id: 'teachers', label: 'Teachers', icon: BookOpen },
          { id: 'academic', label: 'Academic Records', icon: FileText },
          { id: 'fees', label: 'Fee Management', icon: DollarSign },
          { id: 'attendance', label: 'Attendance', icon: Calendar },
          { id: 'library', label: 'Library', icon: Library },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'teacher':
        return [
          ...baseItems,
          { id: 'students', label: 'Students', icon: Users },
          { id: 'academic', label: 'Academic Records', icon: FileText },
          { id: 'attendance', label: 'Attendance', icon: Calendar }
        ];
      case 'finance':
        return [
          ...baseItems,
          { id: 'students', label: 'Students', icon: Users },
          { id: 'fees', label: 'Fee Management', icon: DollarSign },
          { id: 'reports', label: 'Reports', icon: FileText }
        ];
      case 'librarian':
        return [
          ...baseItems,
          { id: 'students', label: 'Students', icon: Users },
          { id: 'library', label: 'Library', icon: Library }
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSave = () => {
    // In a real application, this would update the user's avatar in the database
    // For now, we'll just update the local state
    user.avatar = photoUrl;
    setShowPhotoModal(false);
  };

  const getDefaultAvatar = () => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff&size=150`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 w-64 h-full transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">MaMSMS</h1>
                <p className="text-xs text-gray-500">Magereza Mixed SS</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3 relative">
              <img
                src={user.avatar || getDefaultAvatar()}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <button
                onClick={() => setShowPhotoModal(true)}
                className="absolute -bottom-1 left-7 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-3 h-3" />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="relative">
                <img
                  src={user.avatar || getDefaultAvatar()}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-2 h-2" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Photo Upload Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Update Profile Photo</h2>
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img
                      src={photoUrl || user.avatar || getDefaultAvatar()}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Click the camera icon to upload a new photo
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF (Max 5MB)
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPhotoModal(false);
                      setPhotoUrl(user.avatar || '');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePhotoSave}
                    className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};