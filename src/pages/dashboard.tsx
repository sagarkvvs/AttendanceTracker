import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import AttendanceStats from "@/components/attendance/attendance-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";
import type { AcademicYearWithStats } from "@shared/schema";

export default function Dashboard() {
  const { data: years = [] } = useQuery<AcademicYearWithStats[]>({
    queryKey: ["/api/academic-years"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/attendance/stats"],
  });

  const activeYear = years.find(year => year.isActive);

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Overview of attendance system and key metrics"
      />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Current Academic Year Info */}
        {activeYear && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 text-emerald-600" size={20} />
                  Current Academic Year
                </CardTitle>
                <Badge className="svlns-badge-success">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Academic Year</p>
                  <p className="text-lg font-semibold text-slate-800">{activeYear.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Students</p>
                  <p className="text-lg font-semibold text-slate-800">{activeYear.totalStudents || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Average Attendance</p>
                  <p className="text-lg font-semibold text-slate-800">{activeYear.avgAttendance || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Classes</p>
                  <p className="text-lg font-semibold text-slate-800">{activeYear.totalClasses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Statistics */}
        <AttendanceStats 
          present={stats?.present || 5}
          absent={stats?.absent || 2} 
          late={stats?.late || 1}
          percentage={stats?.percentage || 63}
        />

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Academic Years</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{years.length}</div>
              <p className="text-xs text-muted-foreground">
                {years.filter(y => y.isActive).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {years.reduce((sum, year) => sum + (year.totalStudents || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all years
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">Excellent</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-800">Attendance marked for BSC Physics</p>
                  <p className="text-sm text-slate-500">5 students present, 2 absent, 1 late</p>
                </div>
                <div className="text-sm text-slate-500">Today</div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-800">New academic year 2025-26 created</p>
                  <p className="text-sm text-slate-500">Upcoming academic year added to system</p>
                </div>
                <div className="text-sm text-slate-500">2 days ago</div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">Monthly attendance report generated</p>
                  <p className="text-sm text-slate-500">Overall attendance: 84%</p>
                </div>
                <div className="text-sm text-slate-500">1 week ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
