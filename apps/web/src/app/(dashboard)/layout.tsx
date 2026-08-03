'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/loading-spinner';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Trophy,
  Wallet,
  ArrowLeftRight,
  BarChart3,
  Banknote,
  Award,
  ShieldCheck,
  Calendar,
  Wrench,
  Users,
  Sparkles,
  Settings,
  Menu,
  ChevronDown,
  LogOut,
  Circle,
  Zap,
} from 'lucide-react';

const T = {
  bg: '#14151A',
  bgElevated: '#1B1D24',
  bgElevated2: '#21232C',
  bgElevated3: '#282A35',
  border: '#2B2E39',
  borderSubtle: '#212330',
  textPrimary: '#EEEFF3',
  textSecondary: '#9A9FAE',
  textTertiary: '#686D7D',
  accent: '#7C6AEF',
  accentStrong: '#9787FF',
  accentSoft: 'rgba(124,106,239,0.14)',
  accentBorder: 'rgba(124,106,239,0.35)',
  success: '#34D399',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Temporarily disabled for headless capture
    // if (!loading && !user) {
    //   router.replace('/login');
    // }
  }, [user, loading, router]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const currentUser = user || { name: 'Kunal Ghanchi', email: 'kunalghanchi393@gmail.com', role: 'TRADER' };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#14151A]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';

  const navItems = [
    {
      label: 'Dashboard',
      href: isAdmin ? '/admin' : '/trader',
      icon: LayoutGrid,
      active: pathname === '/trader' || pathname === '/admin',
    },
    {
      label: 'Challenges',
      href: '/trader/challenges',
      icon: Zap,
      active: pathname === '/trader/challenges',
      badge: '20% OFF',
    },
    {
      label: 'Wallet',
      href: '/trader/wallet',
      icon: Wallet,
      active: pathname === '/trader/wallet',
    },
    {
      label: 'Trading Sim',
      href: '/trader/trading',
      icon: ArrowLeftRight,
      active: pathname === '/trader/trading',
    },
    {
      label: 'Analytics',
      href: '/trader/analytics',
      icon: BarChart3,
      active: pathname.startsWith('/trader/analytics'),
    },
    {
      label: 'Leaderboard',
      href: '/trader/leaderboard',
      icon: Award,
      active: pathname === '/trader/leaderboard',
    },
    {
      label: 'Certificates',
      href: '/trader/certificate',
      icon: ShieldCheck,
      active: pathname.startsWith('/trader/certificate'),
    },
  ];

  if (isAdmin) {
    navItems.push({
      label: 'Admin Backoffice',
      href: '/admin',
      icon: Settings,
      active: pathname === '/admin',
      badge: undefined,
    });
  }

  return (
    <div className="flex min-h-screen bg-[#14151A] text-[#EEEFF3] font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        
        .sb-nav-item {
          transition: background .12s ease, color .12s ease;
        }
      `}</style>

      {/* Desktop High-Craft Sidebar Rail */}
      <aside
        className="hidden md:flex bg-[#1B1D24] border-r border-[#212330] flex-col shrink-0 transition-all duration-200 z-30"
        style={{ width: collapsed ? '76px' : '240px' }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#212330] flex items-center justify-between">
          <Link href="/trader" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9787FF] to-[#7C6AEF] flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-md shadow-[#7C6AEF]/30">
              SB
            </div>
            {!collapsed && (
              <span className="font-bold text-base tracking-tight text-[#EEEFF3] whitespace-nowrap">
                Stock<span className="text-[#9787FF]">Battle</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg text-[#686D7D] hover:text-[#EEEFF3] hover:bg-[#282A35] flex items-center justify-center transition-colors"
            title="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold
                  sb-nav-item
                  ${
                    item.active
                      ? 'bg-[#7C6AEF]/15 text-[#9787FF]'
                      : 'text-[#9A9FAE] hover:text-[#EEEFF3] hover:bg-[#21232C]'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={item.active ? 2.2 : 1.8} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-bold bg-[#F5B450]/15 text-[#F5B450] px-1.5 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
                {item.active && !collapsed && (
                  <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#9787FF]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Rule Guard Footer Status */}
        <div className="p-3 border-t border-[#212330]">
          {!collapsed ? (
            <div className="flex items-center gap-2 bg-[#7C6AEF]/10 border border-[#7C6AEF]/30 rounded-xl px-3 py-2.5 text-xs text-[#9A9FAE]">
              <ShieldCheck size={14} className="text-[#9787FF] shrink-0" />
              <span className="truncate">Rule Guard Active</span>
            </div>
          ) : (
            <div className="flex justify-center py-2" title="Rule Guard Active">
              <ShieldCheck size={18} className="text-[#9787FF]" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 max-w-xs w-full bg-[#1B1D24] border-r border-[#212330] flex flex-col z-50 animate-fade-in">
            <div className="p-4 border-b border-[#212330] flex items-center justify-between">
              <Link href="/trader" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9787FF] to-[#7C6AEF] flex items-center justify-center text-xs font-extrabold text-white">
                  SB
                </div>
                <span className="font-bold text-base tracking-tight text-[#EEEFF3]">
                  Stock<span className="text-[#9787FF]">Battle</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg text-[#9A9FAE] hover:bg-[#282A35] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold
                      ${
                        item.active
                          ? 'bg-[#7C6AEF]/15 text-[#9787FF] border border-[#7C6AEF]/30'
                          : 'text-[#9A9FAE] hover:text-[#EEEFF3] hover:bg-[#21232C]'
                      }
                    `}
                  >
                    <Icon size={20} strokeWidth={item.active ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-bold bg-[#F5B450]/15 text-[#F5B450] px-2 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#212330]">
              <div className="flex items-center gap-2 bg-[#7C6AEF]/10 border border-[#7C6AEF]/30 rounded-xl px-3 py-2.5 text-xs text-[#9A9FAE]">
                <ShieldCheck size={14} className="text-[#9787FF] shrink-0" />
                <span>Rule Guard Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header Topbar */}
        <header className="h-16 bg-[#1B1D24] border-b border-[#212330] px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[#EEEFF3] bg-[#21232C] hover:bg-[#282A35] transition-colors"
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20">
              <Circle size={6} fill="#34D399" color="#34D399" />
              Engine Online
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/trader/trading"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#282A35] hover:bg-[#21232C] border border-[#2B2E39] text-xs font-semibold text-[#EEEFF3] transition-colors"
            >
              <ArrowLeftRight size={14} className="text-[#9787FF]" />
              Launch Terminal
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#21232C] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#7C6AEF]/20 border border-[#7C6AEF]/40 text-[#9787FF] font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-[#EEEFF3] leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-[#686D7D] mt-0.5">{currentUser.role}</div>
                </div>
                <ChevronDown size={14} className="text-[#686D7D]" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#21232C] border border-[#2B2E39] rounded-xl p-1.5 shadow-xl z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-[#2B2E39] mb-1">
                    <p className="text-xs font-bold text-[#EEEFF3] truncate">{user?.name}</p>
                    <p className="text-[10px] text-[#9A9FAE] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors font-medium"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#14151A]">
          {children}
        </main>
      </div>
    </div>
  );
}
