"use client";

import { useEffect, useState } from "react";
import { Users, QrCode, History, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { QRControlCenter } from "@/components/QrControlCenter";
import { AttendanceHistory } from "@/components/AttendanceHistory";
import { ClassroomsView } from "@/components/ClassroomsView";

export default function AttendanceDashboard() {
  const [activeView, setActiveView] = useState("attendance");
  const [teacherName, setTeacherName] = useState("");
  const [teacherImage, setTeacherImage] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("teacherName");
    const storedImage = localStorage.getItem("teacherImage");
    const storedId = localStorage.getItem("teacherId");

    if (storedName) {
      setTeacherName(storedName);
      setTeacherImage(storedImage || "");
    }
  }, []);

  const menuItems = [
    { id: "attendance", label: "Ирц бүртгэх", icon: QrCode },
    { id: "history", label: "Ирцийн түүх", icon: History },
    { id: "classrooms", label: "Ангийн жагсаалт", icon: Users },
  ];

  const MobileSidebar = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-white dark:bg-gray-900 border-r border-border"
      >
        <SheetTitle className="sr-only">Mobile Sidebar Navigation</SheetTitle>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">A+</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Ирц хянах систем
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 py-6 bg-white dark:bg-gray-900">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                variant={activeView === item.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  activeView === item.id
                    ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg"
                    : "hover:bg-slate-100 hover:text-slate-700 hover:shadow-md text-slate-600"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const IconOnlySidebar = () => (
    <div className="hidden sm:flex md:hidden flex-col w-16 bg-white dark:bg-gray-900 border-r border-border">
      <div className="p-3 h-[85px] bg-gray-50 dark:bg-gray-800 border-b border-border">
        <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
          <QrCode className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 px-2 py-6 bg-white dark:bg-gray-900">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                activeView === item.id
                  ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg"
                  : "hover:bg-slate-100 hover:text-slate-700 hover:shadow-md text-slate-600"
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "attendance":
        return <QRControlCenter />;
      case "history":
        return <AttendanceHistory />;
      case "classrooms":
        return <ClassroomsView />;
      default:
        return <QRControlCenter />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex border-r border-border bg-white dark:bg-gray-900">
          <SidebarHeader className="h-[85px] p-6 border-b border-border bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">A+</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Ирц хянах систем
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 py-6 bg-white dark:bg-gray-900">
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium cursor-pointer border-0 ${
                      activeView === item.id
                        ? "!bg-slate-700 !text-white shadow-lg transform scale-105"
                        : "bg-transparent hover:bg-slate-100 hover:text-slate-700 hover:shadow-md hover:transform hover:scale-102 text-slate-600"
                    }`}
                    style={
                      activeView === item.id
                        ? {
                            backgroundColor: "rgb(51, 65, 85) !important",
                            color: "white !important",
                            background:
                              "linear-gradient(to right, rgb(51, 65, 85), rgb(30, 41, 59)) !important",
                          }
                        : {}
                    }
                  >
                    <item.icon
                      className="w-5 h-5"
                      style={
                        activeView === item.id
                          ? { color: "white !important" }
                          : {}
                      }
                    />
                    <span
                      style={
                        activeView === item.id
                          ? { color: "white !important" }
                          : {}
                      }
                    >
                      {item.label}
                    </span>
                  </button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Icon-only Sidebar for Tablet */}
        <IconOnlySidebar />

        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Header */}
          <header className="border-b border-border bg-card px-4 sm:px-6 py-4 w-full">
            <div className="flex items-center justify-between max-w-none">
              <div className="flex items-center gap-4">
                {/* Mobile Menu */}
                <MobileSidebar />
                <SidebarTrigger className="hidden md:flex" />
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold text-card-foreground truncate">
                    Сайн байна уу, Багш {teacherName}
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Ирцийн хяналтын самбарт тавтай морилно уу
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                  <AvatarImage src={teacherImage} />
                  <AvatarFallback>PS</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto w-full">
            <div className="w-full max-w-[1600px] mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
