import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, Phone } from "lucide-react";
import { insertStudentSchema, type StudentWithDetails, type Course, type AcademicYear } from "@shared/schema";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery<StudentWithDetails[]>({
    queryKey: ["/api/students"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });

  const form = useForm({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      rollNumber: "",
      courseId: undefined,
      yearOfStudy: "",
      academicYearId: undefined,
      contact: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/students", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student created successfully" });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create student",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/students/${editingStudent!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student updated successfully" });
      setIsModalOpen(false);
      form.reset();
      setEditingStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || selectedGroup === "all" || student.course?.code === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleAddStudent = () => {
    setEditingStudent(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: StudentWithDetails) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      rollNumber: student.rollNumber,
      courseId: student.courseId || undefined,
      yearOfStudy: student.yearOfStudy,
      academicYearId: student.academicYearId || undefined,
      contact: student.contact || "",
      isActive: student.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (student: StudentWithDetails) => {
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
      deleteMutation.mutate(student.id);
    }
  };

  const onSubmit = (data: any) => {
    if (editingStudent) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header 
        title="Students Management" 
        subtitle="Manage student records and information"
        showActions
        onActionClick={handleAddStudent}
        actionLabel="Add Student"
      />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.code}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Students List</CardTitle>
            <p className="text-sm text-slate-600">Showing {filteredStudents.length} students</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No students found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Roll Number</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Group</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Year</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Attendance Rate</th>
                      <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[hsl(var(--svlns-primary))] text-white rounded-full flex items-center justify-center font-medium">
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{student.name}</p>
                              <p className="text-sm text-slate-500">ID: {student.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{student.rollNumber}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">{student.course?.name || "N/A"}</Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{student.yearOfStudy}</td>
                        <td className="py-4 px-4">
                          {student.contact ? (
                            <div className="flex items-center text-slate-600">
                              <Phone className="mr-1" size={14} />
                              {student.contact}
                            </div>
                          ) : (
                            <span className="text-slate-400">No contact</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500"
                                style={{ width: `${student.attendanceRate || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">{student.attendanceRate || 0}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteStudent(student)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Student Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Edit Student" : "Add New Student"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter roll number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
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
                </div>

                <FormField
                  control={form.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
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
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 svlns-btn-primary"
                  >
                    {editingStudent ? "Update Student" : "Add Student"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
