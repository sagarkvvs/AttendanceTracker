import Header from "@/components/layout/header";
import YearManagement from "@/components/years/year-management";

export default function Years() {
  return (
    <>
      <Header 
        title="Academic Years Management" 
        subtitle="Manage academic years, view statistics, and configure year settings"
      />
      
      <main className="flex-1 overflow-auto p-6">
        <YearManagement />
      </main>
    </>
  );
}
