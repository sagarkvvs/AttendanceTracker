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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getInitials } from "@/lib/utils";
import { Plus, Edit, Trash2, Shield, Users, Building, Calendar, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { insertCourseSchema, insertAcademicYearSchema, insertUserSchema, type Course, type AcademicYear, type User } from "@shared/schema";

// Enhanced schemas for forms
const courseFormSchema = insertCourseSchema.extend({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
});

const yearFormSchema = insertAcademicYearSchema.extend({
  name: z.string().min(1, "Year name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

const userFormSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "faculty", "hod"]),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
});

type CourseFormData = z.infer<typeof courseFormSchema>;
type YearFormData = z.infer<typeof yearFormSchema>;
type UserFormData = z.infer<typeof userFormSchema>;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("courses");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"course" | "year" | "user">("course");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: academicYears = [], isLoading: yearsLoading } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Forms
  const courseForm = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { name: "", code: "", description: "" },
  });

  const yearForm = useForm<YearFormData>({
    resolver: zodResolver(yearFormSchema),
    defaultValues: { name: "", startDate: "", endDate: "", description: "", isActive: false },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { username: "", password: "", fullName: "", role: "faculty", email: "", isActive: true },
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: (data: CourseFormData) => apiRequest("POST", "/api/courses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Success", description: "Course created successfully" });
      setIsModalOpen(false);
      courseForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create course", variant: "destructive" });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, ...data }: CourseFormData & { id: number }) => 
      apiRequest("PUT", `/api/courses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Success", description: "Course updated successfully" });
      setIsModalOpen(false);
      courseForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update course", variant: "destructive" });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Success", description: "Course deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete course", variant: "destructive" });
    },
  });

  const createYearMutation = useMutation({
    mutationFn: (data: YearFormData) => apiRequest("POST", "/api/academic-years", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years"] });
      toast({ title: "Success", description: "Academic year created successfully" });
      setIsModalOpen(false);
      yearForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create academic year", variant: "destructive" });
    },
  });

  const updateYearMutation = useMutation({
    mutationFn: ({ id, ...data }: YearFormData & { id: number }) => 
      apiRequest("PUT", `/api/academic-years/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years"] });
      toast({ title: "Success", description: "Academic year updated successfully" });
      setIsModalOpen(false);
      yearForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update academic year", variant: "destructive" });
    },
  });

  const deleteYearMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/academic-years/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years"] });
      toast({ title: "Success", description: "Academic year deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete academic year", variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User created successfully" });
      setIsModalOpen(false);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...data }: UserFormData & { id: number }) => 
      apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User updated successfully" });
      setIsModalOpen(false);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    },
  });

  // Handlers
  const handleAdd = (type: "course" | "year" | "user") => {
    setModalType(type);
    setEditingItem(null);
    setIsModalOpen(true);
    if (type === "course") courseForm.reset();
    if (type === "year") yearForm.reset();
    if (type === "user") userForm.reset();
  };

  const handleEdit = (type: "course" | "year" | "user", item: any) => {
    setModalType(type);
    setEditingItem(item);
    setIsModalOpen(true);
    
    if (type === "course") {
      courseForm.reset({
        name: item.name,
        code: item.code,
        description: item.description || "",
      });
    } else if (type === "year") {
      yearForm.reset({
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
        description: item.description || "",
        isActive: item.isActive,
      });
    } else if (type === "user") {
      userForm.reset({
        username: item.username,
        password: "", // Don't pre-fill password
        fullName: item.fullName,
        role: item.role,
        email: item.email || "",
        isActive: item.isActive,
      });
    }
  };

  const handleSubmit = (type: "course" | "year" | "user") => {
    if (type === "course") {
      courseForm.handleSubmit((data) => {
        if (editingItem) {
          updateCourseMutation.mutate({ ...data, id: editingItem.id });
        } else {
          createCourseMutation.mutate(data);
        }
      })();
    } else if (type === "year") {
      yearForm.handleSubmit((data) => {
        if (editingItem) {
          updateYearMutation.mutate({ ...data, id: editingItem.id });
        } else {
          createYearMutation.mutate(data);
        }
      })();
    } else if (type === "user") {
      userForm.handleSubmit((data) => {
        if (editingItem) {
          updateUserMutation.mutate({ ...data, id: editingItem.id });
        } else {
          createUserMutation.mutate(data);
        }
      })();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "hod": return "bg-purple-100 text-purple-800";
      case "faculty": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header 
        title="Admin Management" 
        subtitle="Manage courses, academic years, and user accounts"
      />
      
      <main className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses" className="flex items-center space-x-2">
              <Building size={16} />
              <span>Courses</span>
            </TabsTrigger>
            <TabsTrigger value="years" className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>Academic Years</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users size={16} />
              <span>Users</span>
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Courses Management</CardTitle>
                  <p className="text-sm text-slate-600">Manage course offerings and programs</p>
                </div>
                <Button onClick={() => handleAdd("course")} className="svlns-btn-primary">
                  <Plus size={16} className="mr-2" />
                  Add Course
                </Button>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading courses...</div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No courses found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Course Name</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Code</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
                          <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-slate-50">
                            <td className="py-4 px-4 font-medium text-slate-900">{course.name}</td>
                            <td className="py-4 px-4 text-slate-600">{course.code}</td>
                            <td className="py-4 px-4 text-slate-600">{course.description || "—"}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit("course", course)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteCourseMutation.mutate(course.id)}
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
          </TabsContent>

          {/* Academic Years Tab */}
          <TabsContent value="years">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Academic Years Management</CardTitle>
                  <p className="text-sm text-slate-600">Manage academic year periods and settings</p>
                </div>
                <Button onClick={() => handleAdd("year")} className="svlns-btn-primary">
                  <Plus size={16} className="mr-2" />
                  Add Academic Year
                </Button>
              </CardHeader>
              <CardContent>
                {yearsLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading academic years...</div>
                ) : academicYears.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No academic years found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Year</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Period</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
                          <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {academicYears.map((year) => (
                          <tr key={year.id} className="hover:bg-slate-50">
                            <td className="py-4 px-4 font-medium text-slate-900">{year.name}</td>
                            <td className="py-4 px-4 text-slate-600">
                              {formatDate(year.startDate)} - {formatDate(year.endDate)}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={year.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {year.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-slate-600">{year.description || "—"}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit("year", year)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteYearMutation.mutate(year.id)}
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Users Management</CardTitle>
                  <p className="text-sm text-slate-600">Manage faculty and admin user accounts</p>
                </div>
                <Button onClick={() => handleAdd("user")} className="svlns-btn-primary">
                  <Plus size={16} className="mr-2" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">User</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Username</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                          <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-[hsl(var(--svlns-primary))] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {getInitials(user.fullName || user.username)}
                                </div>
                                <span className="font-medium text-slate-900">{user.fullName || user.username}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-600">{user.username}</td>
                            <td className="py-4 px-4">
                              <Badge className={getRoleBadgeColor(user.role || "")}>
                                {user.role?.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-slate-600">{user.email || "—"}</td>
                            <td className="py-4 px-4">
                              <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit("user", user)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteUserMutation.mutate(user.id)}
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
          </TabsContent>
        </Tabs>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit" : "Add"} {modalType === "course" ? "Course" : modalType === "year" ? "Academic Year" : "User"}
              </DialogTitle>
            </DialogHeader>

            {modalType === "course" && (
              <Form {...courseForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit("course"); }} className="space-y-4">
                  <FormField
                    control={courseForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., BSC Physics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={courseForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., bsc-physics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={courseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Course description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 svlns-btn-primary">
                      {editingItem ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {modalType === "year" && (
              <Form {...yearForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit("year"); }} className="space-y-4">
                  <FormField
                    control={yearForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2024-25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={yearForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={yearForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={yearForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Year description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={yearForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 svlns-btn-primary">
                      {editingItem ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {modalType === "user" && (
              <Form {...userForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit("user"); }} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="fullName"
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
                    control={userForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter password" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="hod">HOD</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 svlns-btn-primary">
                      {editingItem ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}