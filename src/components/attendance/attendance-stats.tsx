import { Check, X, Clock, PieChart } from "lucide-react";

interface AttendanceStatsProps {
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function AttendanceStats({ present, absent, late, percentage }: AttendanceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-sm font-medium">Present</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{present}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Check className="text-emerald-600" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-sm font-medium">Absent</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{absent}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <X className="text-red-600" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-sm font-medium">Late</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{late}</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="text-amber-600" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-sm font-medium">Attendance %</p>
            <p className="text-3xl font-bold text-[hsl(var(--svlns-primary))] mt-1">{percentage}%</p>
          </div>
          <div className="w-12 h-12 bg-[hsl(var(--svlns-primary-light))] rounded-lg flex items-center justify-center">
            <PieChart className="text-[hsl(var(--svlns-primary))]" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
