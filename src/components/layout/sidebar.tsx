import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Calendar, 
  CalendarCheck, 
  BarChart3, 
  GraduationCap,
  LogOut 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Mark Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Students", href: "/students", icon: Users },
  { name: "Years", href: "/years", icon: Calendar },
  { name: "Admin", href: "/admin", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[hsl(var(--svlns-primary))] rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white text-lg" size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-slate-800 text-lg">SVLNS College</h1>
            <p className="text-slate-500 text-sm">Attendance System</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/dashboard" && item.href === "/");
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-[hsl(var(--svlns-primary-light))] text-[hsl(var(--svlns-primary))] font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <span className="text-slate-600 text-sm font-medium">F</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">Faculty</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
