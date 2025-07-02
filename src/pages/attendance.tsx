import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import AttendanceStats from "@/components/attendance/attendance-stats";
import AttendanceTable from "@/components/attendance/attendance-table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getCurrentDate, formatDate } from "@/lib/utils";
import { Calendar, Users, Shield, Info, CheckCircle } from "lucide-react";
import type { Course, AcademicYear, StudentWithDetails } from "@shared/schema";

export default function Attendance() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedYearOfStudy, setSelectedYearOfStudy] = useState<string>("");
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
  });

  const currentDate = getCurrentDate();

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentWithDetails[]>({
    queryKey: ["/api/students", {
      courseId: selectedCourse ? parseInt(selectedCourse) : undefined,
      academicYearId: selectedAcademicYear ? parseInt(selectedAcademicYear) : undefined,
      yearOfStudy: selectedYearOfStudy || undefined,
    }],
    enabled: !!(selectedCourse && selectedAcademicYear && selectedYearOfStudy),
  });

  // Set default academic year to active one
  useEffect(() => {
    const activeYear = academicYears.find(year => year.isActive);
    if (activeYear && !selectedAcademicYear) {
      setSelectedAcademicYear(activeYear.id.toString());
    }
  }, [academicYears, selectedAcademicYear]);

  const canLoadAttendance = selectedCourse && selectedAcademicYear && selectedYearOfStudy;
  const selectedCourseData = courses.find(course => course.id.toString() === selectedCourse);

  const handleAttendanceStatsChange = (stats: { present: number; absent: number; late: number }) => {
    const total = stats.present + stats.absent + stats.late;
    const percentage = total > 0 ? Math.round((stats.present / total) * 100) : 0;
    
    setAttendanceStats({
      ...stats,
      percentage
    });
  };

  const loadAttendance = () => {
    // This will trigger a refetch of students which will update the attendance table
    setAttendanceStats({ present: 0, absent: 0, late: 0, percentage: 0 });
  };

  return (
    <>
      <Header 
        title="Student Attendance Tracking" 
        subtitle="Mark daily attendance for your assigned groups"
      />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Attendance Statistics */}
        <AttendanceStats {...attendanceStats} />

        {/* Group Selection */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Users className="mr-2 text-[hsl(var(--svlns-primary))]" size={20} />
                Group Selection & Year Management
              </h3>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Calendar size={16} />
                <span>{formatDate(currentDate)}</span>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Academic Year</label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name} {year.isActive && "(Active)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Year of Study</label>
                <Select value={selectedYearOfStudy} onValueChange={setSelectedYearOfStudy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Study Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={loadAttendance}
                  disabled={!canLoadAttendance}
                  className="w-full svlns-btn-success"
                >
                  Load Attendance
                </Button>
              </div>
            </div>

            {/* Status Information */}
            {canLoadAttendance && (
              <Alert className="svlns-alert-info">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedCourseData?.name} - {selectedYearOfStudy} Year ({students.length} students)
                      </p>
                      <p className="text-sm mt-1">
                        Attendance for today ready to record. Duplicate protection: Active
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="flex items-center">
                          <CheckCircle className="mr-1" size={12} />
                          Present: <span className="font-medium ml-1">{attendanceStats.present}</span>/{students.length}
                        </span>
                        <span className="flex items-center">
                          <Shield className="mr-1" size={12} />
                          Validation: Active
                        </span>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Attendance Table */}
        {canLoadAttendance && students.length > 0 && (
          <AttendanceTable
            students={students}
            courseId={parseInt(selectedCourse)}
            academicYearId={parseInt(selectedAcademicYear)}
            onAttendanceChange={handleAttendanceStatsChange}
          />
        )}

        {canLoadAttendance && students.length === 0 && !studentsLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Students Found</h3>
                <p className="text-slate-500">
                  No students are enrolled in the selected course and year combination.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!canLoadAttendance && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Select Group Details</h3>
                <p className="text-slate-500">
                  Please select academic year, course, and year of study to load attendance.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Best Practices */}
        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <h4 className="font-medium text-blue-800 mb-2">Attendance Best Practices</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Mark attendance within the first 15 minutes of class</li>
              <li>• Review previous day's attendance patterns for accuracy</li>
              <li>• Use bulk actions for efficiency when marking large groups</li>
              <li>• Always save attendance before navigating away</li>
            </ul>
          </AlertDescription>
        </Alert>
      </main>
    </>
  );
}
