import { Activity, FileText, Home, Microscope, Settings, Users } from "lucide-react";

export const sidebarItems = [
  { icon: Home, label: "Dashboard", to: "/" },
  { icon: Microscope, label: "UX Researcher", to: "/researcher" },
  { icon: Activity, label: "Analytics", to: "/analytics" },
  { icon: Users, label: "Users", to: "/users" },
  { icon: FileText, label: "Reports", to: "/reports" },
  { icon: Settings, label: "Settings", to: "/settings" },
];
