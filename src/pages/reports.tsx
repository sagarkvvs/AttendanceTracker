import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getCurrentDate, calculateAttendancePercentage } from "@/lib/utils";
import { Download, FileText, Calendar, Users, BarChart3, TrendingUp } from "lucide-react";
import type { Course, AcademicYear, AttendanceWithDetails } from "@shared/schema";

const reportFormSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  courseId: z.string().min(1, "Course is required"),
  yearOfStudy: z.string().min(1, "Year of study is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

interface ReportData {
  title: string;
  period: string;
  summary: {
    totalStudents: number;
    totalClasses: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
  };
  details: AttendanceWithDetails[];
}

export default function Reports() {
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: "day-wise",
      courseId: "",
      yearOfStudy: "",
      academicYearId: academicYears.find(y => y.isActive)?.id.toString() || "",
      fromDate: getCurrentDate(),
      toDate: getCurrentDate(),
    },
  });

  // Set default academic year when data loads
  useState(() => {
    const activeYear = academicYears.find(year => year.isActive);
    if (activeYear && !form.getValues("academicYearId")) {
      form.setValue("academicYearId", activeYear.id.toString());
    }
  });

  const { data: attendanceData = [] } = useQuery<AttendanceWithDetails[]>({
    queryKey: ["/api/attendance", {
      courseId: form.watch("courseId") ? parseInt(form.watch("courseId")) : undefined,
      academicYearId: form.watch("academicYearId") ? parseInt(form.watch("academicYearId")) : undefined,
      dateFrom: form.watch("fromDate"),
      dateTo: form.watch("toDate"),
    }],
    enabled: false, // Only fetch when generating report
  });

  const generateReport = async (data: ReportFormData) => {
    setIsGenerating(true);
    
    try {
      // Fetch attendance data for the specified filters
      const response = await fetch(`/api/attendance?${new URLSearchParams({
        courseId: data.courseId,
        academicYearId: data.academicYearId,
        dateFrom: data.fromDate,
        dateTo: data.toDate,
      }).toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attendance data");
      }

      const attendanceRecords: AttendanceWithDetails[] = await response.json();
      
      // Get students count for the course
      const studentsResponse = await fetch(`/api/students?${new URLSearchParams({
        courseId: data.courseId,
        academicYearId: data.academicYearId,
        yearOfStudy: data.yearOfStudy,
      }).toString()}`, {
        credentials: "include",
      });

      if (!studentsResponse.ok) {
        throw new Error("Failed to fetch students data");
      }

      const students = await studentsResponse.json();
      
      // Calculate summary statistics
      const present = attendanceRecords.filter(record => record.status === "present").length;
      const absent = attendanceRecords.filter(record => record.status === "absent").length;
      const late = attendanceRecords.filter(record => record.status === "late").length;
      const totalMarked = present + absent + late;
      
      // Get unique dates to calculate total classes
      const uniqueDates = new Set(attendanceRecords.map(record => record.date));
      const totalClasses = uniqueDates.size;
      
      const selectedCourse = courses.find(c => c.id.toString() === data.courseId);
      const selectedAcademicYear = academicYears.find(y => y.id.toString() === data.academicYearId);
      
      const reportData: ReportData = {
        title: `${selectedCourse?.name || "Unknown Course"} - ${data.yearOfStudy} Year (${data.reportType === "day-wise" ? "Daily" : "Summary"})`,
        period: `${formatDate(data.fromDate)} - ${formatDate(data.toDate)}`,
        summary: {
          totalStudents: students.length,
          totalClasses,
          present,
          absent,
          late,
          attendancePercentage: calculateAttendancePercentage(present, totalMarked),
        },
        details: attendanceRecords,
      };

      setGeneratedReport(reportData);
      
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCSV = () => {
    if (!generatedReport) return;

    const csvHeaders = ["Date", "Student Name", "Roll Number", "Status", "Marked At"];
    const csvRows = generatedReport.details.map(record => [
      record.date,
      record.student?.name || "Unknown",
      record.student?.rollNumber || "Unknown",
      record.status,
      record.markedAt ? new Date(record.markedAt).toLocaleString() : "Unknown",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${getCurrentDate()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report downloaded successfully",
    });
  };

  const onSubmit = (data: ReportFormData) => {
    // Validate date range
    if (new Date(data.fromDate) > new Date(data.toDate)) {
      form.setError("toDate", {
        type: "manual",
        message: "To date must be after from date",
      });
      return;
    }

    generateReport(data);
  };

  return (
    <>
      <Header 
        title="Generate Reports" 
        subtitle="Create detailed attendance reports with customizable filters"
      />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Report Generation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2" size={20} />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="day-wise">Day-wise</SelectItem>
                            <SelectItem value="summary">Summary</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearOfStudy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year of Study</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1st">1st Year</SelectItem>
                            <SelectItem value="2nd">2nd Year</SelectItem>
                            <SelectItem value="3rd">3rd Year</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map(year => (
                              <SelectItem key={year.id} value={year.id.toString()}>
                                {year.name} {year.isActive && "(Active)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="svlns-btn-primary"
                  >
                    <BarChart3 className="mr-2" size={16} />
                    {isGenerating ? "Generating..." : "Generate Report"}
                  </Button>
                  
                  {generatedReport && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={downloadCSV}
                    >
                      <Download className="mr-2" size={16} />
                      Download CSV
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Generated Report */}
        {generatedReport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{generatedReport.title}</CardTitle>
                  <p className="text-slate-600 mt-1">{generatedReport.period}</p>
                </div>
                <Badge className="svlns-badge-success">Report Generated</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Class-wise Attendance Summary */}
              <div className="mb-8">
                <h4 className="font-semibold text-slate-800 mb-4">Class-wise Attendance Summary</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-200 rounded-lg">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-slate-700 border-b border-slate-200">Group</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-700 border-b border-slate-200">Total Students</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-700 border-b border-slate-200">Present</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-700 border-b border-slate-200">Absent</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-700 border-b border-slate-200">Late</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-700 border-b border-slate-200">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4 border-b border-slate-100">
                          {courses.find(c => c.id.toString() === form.getValues("courseId"))?.name}
                        </td>
                        <td className="text-center py-3 px-4 border-b border-slate-100">{generatedReport.summary.totalStudents}</td>
                        <td className="text-center py-3 px-4 border-b border-slate-100">
                          <span className="text-emerald-600 font-medium">{generatedReport.summary.present}</span>
                        </td>
                        <td className="text-center py-3 px-4 border-b border-slate-100">
                          <span className="text-red-600 font-medium">{generatedReport.summary.absent}</span>
                        </td>
                        <td className="text-center py-3 px-4 border-b border-slate-100">
                          <span className="text-amber-600 font-medium">{generatedReport.summary.late}</span>
                        </td>
                        <td className="text-center py-3 px-4 border-b border-slate-100">
                          <Badge className="svlns-badge-success">
                            {generatedReport.summary.attendancePercentage}%
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="text-slate-600" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-slate-700 mb-1">{generatedReport.summary.totalStudents}</div>
                  <div className="text-sm text-slate-600">Total Students</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="text-slate-600" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-slate-700 mb-1">{generatedReport.summary.totalClasses}</div>
                  <div className="text-sm text-slate-600">Total Classes</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mb-1">{generatedReport.summary.attendancePercentage}%</div>
                  <div className="text-sm text-slate-600">Attendance Rate</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="text-[hsl(var(--svlns-primary))]" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-[hsl(var(--svlns-primary))] mb-1">
                    {generatedReport.summary.present + generatedReport.summary.absent + generatedReport.summary.late}
                  </div>
                  <div className="text-sm text-slate-600">Total Records</div>
                </div>
              </div>

              {/* No Data Message */}
              {generatedReport.details.length === 0 && (
                <Alert>
                  <AlertDescription>
                    No attendance records found for the selected criteria. Try adjusting the date range or filters.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Initial State Message */}
        {!generatedReport && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Generate Your First Report</h3>
                <p className="text-slate-500 mb-4">
                  Select your report criteria above and click "Generate Report" to create detailed attendance reports.
                </p>
                <div className="text-sm text-slate-400">
                  Reports include attendance statistics, student-wise data, and downloadable CSV exports.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
