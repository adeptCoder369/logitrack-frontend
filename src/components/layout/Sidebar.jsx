import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { usePermissions } from '../../lib/permissions';
import {
  TruckElectric,
  TrainFront,
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  Container,
  Package,
  Warehouse,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  LogOut,
  PackageCheck,
  CheckCircle,
  Wallet,
  UserCog,
  Settings,
  FileBarChart,
  Train,
  KeyRound,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

// Navigation items with their routes (permissions are now dynamic)
const allNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/delivery-orders', icon: ClipboardList, label: 'Purchase DO' },
  // { to: '/do-wallet', icon: Wallet, label: 'DO Wallet' },
  { to: '/liftings', icon: PackageCheck, label: 'Inventory Status' },
  { to: '/verification', icon: CheckCircle, label: 'Inventory Weight Verification' },
  { to: '/inventory', icon: Wallet, label: 'Inventory Wallet' },
  { to: '/schedule-pickup', icon: CalendarCheck, label: 'Plan Dispatch List' },
  { to: '/pickup', icon: Truck, label: 'Dispatch Info' },
  { to: '/purchase-orders', icon: ClipboardList, label: 'Purchase Orders' },
  { to: '/verify-pickup', icon: CheckCircle2, label: 'Weightment Slip' },
  { to: '/company-reports', icon: FileBarChart, label: 'Company Reports' },
  { to: '/lifting-reports', icon: FileBarChart, label: 'Lifting Reports' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/transporters', icon: TrainFront, label: 'Transporters' },
  { to: '/trucks', icon: Truck, label: 'Trucks' },
  { to: '/verified-trucks-details', icon: TruckElectric, label: 'Verified Trucks Details' },
  { to: '/railway-sidings', icon: Train, label: 'Railway Sidings' },
  { to: '/railway-zones', icon: Train, label: 'Railway Zones' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/depots', icon: Warehouse, label: 'Depots' },
  { to: '/user-management', icon: UserCog, label: 'User Management' },
  { to: '/role-permissions', icon: Settings, label: 'Role Permissions' },
  { to: '/product-access', icon: KeyRound, label: 'Product Access' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { hasRoutePermission, loading } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Filter nav items based on dynamic permissions
  const navItems = allNavItems.filter(item => {
    console.log('========= hasRoutePermission============', hasRoutePermission(item.to))
    // ✅ Normal permission flow
    return hasRoutePermission(item.to);
  });

  return (
    <>
      {/* Mobile menu button */}
      <button
        data-testid="mobile-menu-btn"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`
          fixed top-0 left-0 h-full w-64 sidebar z-40
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-20 flex flex-col items-center justify-center px-4 border-b border-slate-700 py-2">
          <img
            src="https://customer-assets.emergentagent.com/job_delivery-hub-237/artifacts/gckg95ms_Info%20Eight_su_5a.png"
            alt="InfoEIGHT"
            className="h-8 mb-1"
          />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight" style={{ fontFamily: 'Manrope' }}>
                LogiTrack Pro
              </h1>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-orange-400">{user.role}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="py-4 px-2 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-pulse text-slate-400 text-sm">Loading menu...</div>
            </div>
          ) : (
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setMobileOpen(false)}
                    end={item.to === '/'}
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
            data-testid="logout-btn"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
