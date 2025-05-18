import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:flex-col md:fixed md:w-72 md:inset-y-0 bg-gray-900">
        <Sidebar apiLimitCount={5} isPro={true} />
      </div>
      <main className="md:pl-72">
        <Navbar />
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
