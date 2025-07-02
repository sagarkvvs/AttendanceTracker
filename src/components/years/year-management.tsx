import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Plus, Star, Edit, Archive, Trash2, Users, Percent, Calendar } from "lucide-react";
import YearModal from "./year-modal";
import type { AcademicYearWithStats } from "@shared/schema";

export default function YearManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYearWithStats | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: years = [], isLoading } = useQuery<AcademicYearWithStats[]>({
    queryKey: ["/api/academic-years"],
  });

  const activateYearMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/academic-years/${id}/activate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years"] });
      toast({
        title: "Success",
        description: "Academic year activated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate academic year",
        variant: "destructive",
      });
    },
  });

  const deleteYearMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/academic-years/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years"] });
      toast({
        title: "Success",
        description: "Academic year deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete academic year",
        variant: "destructive",
      });
    },
  });

  const handleAddYear = () => {
    setEditingYear(null);
    setIsModalOpen(true);
  };

  const handleEditYear = (year: AcademicYearWithStats) => {
    setEditingYear(year);
    setIsModalOpen(true);
  };

  const handleDeleteYear = (year: AcademicYearWithStats) => {
    if (year.isActive) {
      toast({
        title: "Error",
        description: "Cannot delete the active academic year",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete academic year ${year.name}?`)) {
      deleteYearMutation.mutate(year.id);
    }
  };

  const handleActivateYear = (year: AcademicYearWithStats) => {
    if (confirm(`Set ${year.name} as the active academic year?`)) {
      activateYearMutation.mutate(year.id);
    }
  };

  const getYearStatus = (year: AcademicYearWithStats) => {
    if (year.isActive) {
      return { label: "Current", color: "svlns-badge-success", icon: Star };
    }
    
    const now = new Date();
    const startDate = new Date(year.startDate);
    const endDate = new Date(year.endDate);
    
    if (now < startDate) {
      return { label: "Upcoming", color: "bg-blue-100 text-blue-800", icon: Calendar };
    } else if (now > endDate) {
      return { label: "Previous", color: "bg-slate-100 text-slate-600", icon: Archive };
    } else {
      return { label: "Active Period", color: "svlns-badge-warning", icon: Calendar };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading academic years...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Academic Year Management</h3>
          <p className="text-slate-600 mt-1">Manage academic years and view year-wise statistics</p>
        </div>
        <Button onClick={handleAddYear} className="svlns-btn-primary">
          <Plus className="mr-2" size={16} />
          Add New Year
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {years.map((year) => {
          const status = getYearStatus(year);
          const StatusIcon = status.icon;

          return (
            <Card key={year.id} className={year.isActive ? "border-emerald-200 bg-emerald-50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={status.color}>
                    <StatusIcon className="mr-1" size={12} />
                    {status.label}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditYear(year)}
                    >
                      <Edit size={14} />
                    </Button>
                    {!year.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteYear(year)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl">{year.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="mr-2" size={14} />
                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Users className="mr-2" size={14} />
                    Total Students: {year.totalStudents || 0}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Percent className="mr-2" size={14} />
                    Avg Attendance: {year.avgAttendance || 0}%
                  </div>
                  
                  {year.description && (
                    <p className="text-sm text-slate-500 mt-2">{year.description}</p>
                  )}
                  
                  {!year.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivateYear(year)}
                      className="w-full mt-3"
                      disabled={activateYearMutation.isPending}
                    >
                      <Star className="mr-2" size={14} />
                      Set as Active
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Year-wise Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Year-wise Attendance Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[hsl(var(--svlns-primary))] mb-1">
                {years.find(y => y.isActive)?.avgAttendance || 0}%
              </div>
              <div className="text-sm text-slate-600">Current Year Avg</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">92%</div>
              <div className="text-sm text-slate-600">Best Month</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">76%</div>
              <div className="text-sm text-slate-600">Lowest Month</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-700 mb-1">+2%</div>
              <div className="text-sm text-slate-600">vs Last Year</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <YearModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingYear={editingYear}
      />
    </div>
  );
}
