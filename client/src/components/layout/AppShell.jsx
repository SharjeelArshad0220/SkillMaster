import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomTabBar from "./BottomTabBar";

export default function AppShell() {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-navy font-sans overflow-hidden">
      {/* Top Header Section */}
      <Navbar />

      {/* Main Content — Scrollable within viewport */}
      <main className="flex-1 mt-14 mb-16 md:mb-0 overflow-y-auto">
        <div className="h-full">
          <Outlet />
        </div>
      </main>

      {/* Footer / Tab Bar Section */}
      <Footer />
      <BottomTabBar />
    </div>
  );
}
