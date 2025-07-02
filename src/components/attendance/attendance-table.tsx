import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getInitials, getAttendanceColor, getCurrentDate } from "@/lib/utils";
import { Check, Clock, X, CheckCircle, Save, Users } from "lucide-react";
import type { StudentWithDetails, AttendanceWithDetails } from "@shared/schema";

interface AttendanceTableProps {
  students: StudentWithDetails[];
  courseId: number;
  academicYearId: number;
  onAttendanceChange?: (stats: { present: number; absent: number; late: number }) => void;
}

export default function AttendanceTable({ 
  students, 
  courseId, 
  academicYearId, 
  onAttendanceChange 
}: AttendanceTableProps) {
  const [attendanceState, setAttendanceState] = useState<Map<number, string>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentDate = getCurrentDate();

  // Fetch today's attendance
  const { data: todayAttendance = [] } = useQuery<AttendanceWithDetails[]>({
    queryKey: ["/api/attendance", { date: currentDate, courseId, academicYearId }],
  });

  // Create a map of existing attendance
  const existingAttendance = new Map(
    todayAttendance.map(record => [record.studentId!, record.status])
  );

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { studentId: number; status: string }) => {
      const response = await apiRequest("POST", "/api/attendance", {
        studentId: data.studentId,
        courseId,
        academicYearId,
        date: currentDate,
        status: data.status,
        markedBy: "faculty",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      updateStats();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  // Bulk attendance mutation
  const bulkAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: any[]) => {
      const response = await apiRequest("POST", "/api/attendance/bulk", {
        attendanceRecords,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      updateStats();
      setAttendanceState(new Map());
      
      toast({
        title: "Success",
        description: `${data.success} attendance records saved. ${data.errors} errors.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save bulk attendance",
        variant: "destructive",
      });
    },
  });

  const updateStats = () => {
    const present = Array.from(attendanceState.values()).filter(status => status === "present").length +
                   Array.from(existingAttendance.values()).filter(status => status === "present").length;
    const absent = Array.from(attendanceState.values()).filter(status => status === "absent").length +
                  Array.from(existingAttendance.values()).filter(status => status === "absent").length;
    const late = Array.from(attendanceState.values()).filter(status => status === "late").length +
                Array.from(existingAttendance.values()).filter(status => status === "late").length;
    
    onAttendanceChange?.({ present, absent, late });
  };

  const markAttendance = (studentId: number, status: string) => {
    if (existingAttendance.has(studentId)) {
      toast({
        title: "Error",
        description: "Attendance already marked for this student today",
        variant: "destructive",
      });
      return;
    }

    setAttendanceState(prev => new Map(prev.set(studentId, status)));
    updateStats();
  };

  const markAllPresent = () => {
    const newState = new Map(attendanceState);
    students.forEach(student => {
      if (!existingAttendance.has(student.id)) {
        newState.set(student.id, "present");
      }
    });
    setAttendanceState(newState);
    updateStats();
  };

  const saveAttendance = () => {
    const pendingRecords = Array.from(attendanceState.entries()).map(([studentId, status]) => ({
      studentId,
      courseId,
      academicYearId,
      date: currentDate,
      status,
      markedBy: "faculty",
    }));

    if (pendingRecords.length === 0) {
      toast({
        title: "No Changes",
        description: "No new attendance records to save",
      });
      return;
    }

    bulkAttendanceMutation.mutate(pendingRecords);
  };

  const getStudentStatus = (studentId: number) => {
    if (attendanceState.has(studentId)) {
      return attendanceState.get(studentId)!;
    }
    if (existingAttendance.has(studentId)) {
      return existingAttendance.get(studentId)!;
    }
    return "not-marked";
  };

  const isMarked = (studentId: number) => {
    return existingAttendance.has(studentId) || attendanceState.has(studentId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="svlns-badge-success">
            <Check className="mr-1" size={12} />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="svlns-badge-error">
            <X className="mr-1" size={12} />
            Absent
          </Badge>
        );
      case "late":
        return (
          <Badge className="svlns-badge-warning">
            <Clock className="mr-1" size={12} />
            Late
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1" size={12} />
            Not Marked
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Student Attendance</h3>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={markAllPresent}
              disabled={bulkAttendanceMutation.isPending}
            >
              <Users className="mr-2" size={16} />
              Mark All Present
            </Button>
            <Button
              onClick={saveAttendance}
              disabled={bulkAttendanceMutation.isPending || attendanceState.size === 0}
              className="svlns-btn-primary"
            >
              <Save className="mr-2" size={16} />
              Save Attendance
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-6 font-medium text-slate-700">Student</th>
              <th className="text-left py-3 px-6 font-medium text-slate-700">Roll Number</th>
              <th className="text-center py-3 px-6 font-medium text-slate-700">Status</th>
              <th className="text-center py-3 px-6 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.map((student) => {
              const status = getStudentStatus(student.id);
              const marked = isMarked(student.id);
              const initials = getInitials(student.name);

              return (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[hsl(var(--svlns-primary))] text-white rounded-full flex items-center justify-center font-medium">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{student.name}</p>
                        <p className="text-sm text-slate-500">Roll No: {student.rollNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{student.rollNumber}</td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(status)}
                  </td>
                  <td className="py-4 px-6">
                    {marked ? (
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-slate-500 font-medium">
                          <CheckCircle className="inline mr-1 text-emerald-600" size={16} />
                          Marked
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => markAttendance(student.id, "present")}
                          className="svlns-btn-success"
                          disabled={markAttendanceMutation.isPending}
                        >
                          <Check className="mr-1" size={12} />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => markAttendance(student.id, "late")}
                          className="svlns-btn-warning"
                          disabled={markAttendanceMutation.isPending}
                        >
                          <Clock className="mr-1" size={12} />
                          Late
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => markAttendance(student.id, "absent")}
                          className="svlns-btn-error"
                          disabled={markAttendanceMutation.isPending}
                        >
                          <X className="mr-1" size={12} />
                          Absent
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
