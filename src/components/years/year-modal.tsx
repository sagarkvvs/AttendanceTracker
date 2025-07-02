import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDateForInput, validateAcademicYear } from "@/lib/utils";
import { insertAcademicYearSchema, type AcademicYearWithStats } from "@shared/schema";
import { z } from "zod";

const formSchema = insertAcademicYearSchema.extend({
  name: z.string().min(1, "Academic year name is required").refine(
    (value) => validateAcademicYear(value),
    {
      message: "Academic year must be in format YYYY-YY (e.g., 2024-25)",
    }
  ),
});

type FormData = z.infer<typeof formSchema>;

interface YearModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingYear?: AcademicYearWithStats | null;
}

export default function YearModal({ isOpen, onClose, editingYear }: YearModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingYear?.name || "",
      startDate: editingYear?.startDate || "",
      endDate: editingYear?.endDate || "",
      description: editingYear?.description || "",
      isActive: editingYear?.isActive || false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = editingYear 
        ? `/api/academic-years/${editingYear.id}`
        : "/api/academic-years";
      const method = editingYear ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years"] });
      toast({
        title: "Success",
        description: `Academic year ${editingYear ? 'updated' : 'created'} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingYear ? 'update' : 'create'} academic year`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Validate date range
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      form.setError("endDate", {
        type: "manual",
        message: "End date must be after start date",
      });
      return;
    }

    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingYear ? "Edit Academic Year" : "Add New Academic Year"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 2025-26" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={formatDateForInput(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3}
                      placeholder="Optional description for this academic year..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-1 svlns-btn-primary"
              >
                {mutation.isPending ? "Saving..." : editingYear ? "Update Year" : "Create Year"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
