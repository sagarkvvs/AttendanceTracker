import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
  showActions?: boolean;
  onActionClick?: () => void;
  actionLabel?: string;
}

export default function Header({ 
  title, 
  subtitle, 
  showActions = false, 
  onActionClick,
  actionLabel = "Quick Actions"
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
          <p className="text-slate-600 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-slate-500">Today's Date</p>
            <p className="font-medium text-slate-800">
              {format(new Date(), "M/d/yyyy")}
            </p>
          </div>
          {showActions && (
            <Button onClick={onActionClick} className="svlns-btn-primary">
              <Plus className="mr-2" size={16} />
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
