import React, { useState } from 'react';
import { 
  FileText, 
  Home, 
  Upload, 
  Settings, 
  LogOut, 
  User, 
  Calendar, 
  Map, 
  Menu, 
  X, 
  Users,
  ClipboardList,
  BarChart,
  MessageSquare,
  FolderOpen
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../lib/auth';
import { useAuth } from '../lib/hooks/useAuth';
import NotificationBell from './NotificationBell';

const navigation = [
  {
    name: 'Principal',
    items: [
      { name: 'Dashboard', icon: Home, href: '/dashboard' },
      { name: 'Relatórios', icon: FileText, href: '/dashboard/reports' },
      { name: 'Upload', icon: Upload, href: '/dashboard/upload' },
    ]
  },
  {
    name: 'Vias e Inspeções',
    items: [
      { name: 'Ordens de Serviço', icon: ClipboardList, href: '/dashboard/service-orders' },
      { name: 'Nova OS', icon: FileText, href: '/dashboard/road-report' },
      { name: 'Mapa de Vias', icon: Map, href: '/dashboard/road-map' },
    ]
  },
  {
    name: 'Atividades',
    items: [
      { name: 'Relatórios Diários', icon: Calendar, href: '/dashboard/daily-reports' },
      { name: 'Equipes', icon: Users, href: '/dashboard/teams' },
      { name: 'Chat', icon: MessageSquare, href: '/dashboard/teams?tab=chat' },
      { name: 'Arquivos', icon: FolderOpen, href: '/dashboard/teams?tab=files' },
    ]
  },
  {
    name: 'Análise',
    items: [
      { name: 'Estatísticas', icon: BarChart, href: '/dashboard/analytics' },
      { name: 'Configurações', icon: Settings, href: '/dashboard/settings' },
    ]
  }
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderNavigation = (mobile = false) => (
    <nav className="flex-1 space-y-8">
      {navigation.map((group) => (
        <div key={group.name}>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {group.name}
          </h3>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => mobile && setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
                <FileText className="w-8 h-8 text-white" />
                <span className="ml-2 text-lg font-semibold text-white">SGR</span>
              </div>

              {/* Navigation */}
              <div className="flex-1 px-4 py-4 overflow-y-auto">
                {renderNavigation(true)}
              </div>

              {/* User menu */}
              <div className="flex items-center px-4 py-4 border-t border-gray-200">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{profile?.name || 'Usuário'}</p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block lg:bg-white lg:shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <FileText className="w-8 h-8 text-white" />
            <span className="ml-2 text-lg font-semibold text-white">SGR</span>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            {renderNavigation()}
          </div>

          {/* User menu */}
          <div className="flex items-center px-4 py-4 border-t border-gray-200">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{profile?.name || 'Usuário'}</p>
              <button
                onClick={handleLogout}
                className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                <LogOut className="mr-1 h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white shadow-sm mt-16 lg:mt-0">
          <h1 className="text-lg font-semibold text-gray-900">
            {navigation.flatMap(group => group.items).find(item => item.href === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}