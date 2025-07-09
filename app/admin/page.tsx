"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  Calendar,
  Users,
  Settings,
  UserPlus,
  Trash2,
  Shield,
  Edit,
  DollarSign,
  Clock,
  Plus,
  Mail,
  Phone,
  Moon,
  Sun,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, type Appointment } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/contexts/theme-context";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  professional_id?: string;
  professional?: {
    name: string;
  };
  created_at: string;
}

interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  active: boolean;
  professional_services?: {
    service: {
      id: string;
      name: string;
    };
  }[];
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  category: string;
  active: boolean;
  professional_services?: {
    professional: {
      id: string;
      name: string;
    };
  }[];
}

interface MonthlyReport {
  cancelamentos: number;
  concluidos: number;
  valorTotal: number;
  servicosMaisUtilizados: { name: string; count: number; value: number }[];
  servicosMenosUtilizados: { name: string; count: number; value: number }[];
}

interface ServiceProfessionalData {
  professionalName: string;
  count: number;
  value: number;
}

interface ServiceDetail {
  serviceName: string;
  professionals: ServiceProfessionalData[];
}

export default function AdminPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(
    null
  );

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");

  // Reports state
  const [activeReportTab, setActiveReportTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedServiceDetail, setSelectedServiceDetail] =
    useState<ServiceDetail | null>(null);

  // Estados dialogos
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [isCreateProfessionalOpen, setIsCreateProfessionalOpen] =
    useState(false);
  const [isEditProfessionalOpen, setIsEditProfessionalOpen] = useState(false);
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);

  // Form states for creating admin
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "super_admin">(
    "admin"
  );
  const [newAdminProfessionalId, setNewAdminProfessionalId] = useState("");

  // Form states for professional
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [professionalForm, setProfessionalForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: "",
    serviceIds: [] as string[],
  });

  // Form states for service
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    duration_minutes: "",
    price: "",
    category: "beauty",
    professionalIds: [] as string[],
  });

  const menuItems =
    currentAdmin?.role === "super_admin"
      ? [
          { id: "appointments", label: "Agendamentos", icon: Calendar },
          { id: "reports", label: "Relatórios", icon: BarChart3 },
          { id: "admins", label: "Administradores", icon: Shield },
          { id: "professionals", label: "Profissionais", icon: Users },
          { id: "services", label: "Serviços", icon: Settings },
        ]
      : [
          { id: "appointments", label: "Agendamentos", icon: Calendar },
          { id: "reports", label: "Relatórios", icon: BarChart3 },
          { id: "services", label: "Serviços", icon: Settings },
        ];

  useEffect(() => {
    // Verifica se já está autenticado
    const authStatus = sessionStorage.getItem("adminAuth");
    if (authStatus) {
      const adminData = JSON.parse(authStatus);
      setCurrentAdmin(adminData);
      setIsAuthenticated(true);
      fetchAppointments(adminData);
      if (adminData.role === "super_admin") {
        fetchAdmins();
      }
      fetchProfessionals();
      fetchServices(adminData);
      fetchAllServices();
      fetchAvailableMonths(adminData);
      fetchMonthlyReport(adminData, selectedMonth);
    }
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      fetchMonthlyReport(currentAdmin, selectedMonth);
    }
  }, [selectedMonth]);

  const fetchAvailableMonths = async (admin: Admin) => {
    try {
      let query = supabase
        .from("appointments")
        .select("appointment_date")
        .order("appointment_date", { ascending: false });

      // Se for admin normal, filtrar apenas agendamentos do seu profissional
      if (admin.role === "admin" && admin.professional_id) {
        query = query.eq("professional_id", admin.professional_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const months = new Set<string>();
      data?.forEach((appointment) => {
        const date = new Date(appointment.appointment_date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        months.add(monthKey);
      });

      setAvailableMonths(Array.from(months).sort().reverse());
    } catch (error) {
      console.error("Erro ao carregar meses disponíveis:", error);
    }
  };

  const fetchMonthlyReport = async (admin: Admin, monthKey: string) => {
    try {
      const [year, month] = monthKey.split("-");
      const firstDay = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        1
      );
      const lastDay = new Date(
        Number.parseInt(year),
        Number.parseInt(month),
        0
      );

      let query = supabase
        .from("appointments")
        .select(
          `
          *,
          service:services(name, price),
          professional:professionals(name)
        `
        )
        .gte("appointment_date", firstDay.toISOString().split("T")[0])
        .lte("appointment_date", lastDay.toISOString().split("T")[0]);

      // Se for admin normal, filtrar apenas agendamentos do seu profissional
      if (admin.role === "admin" && admin.professional_id) {
        query = query.eq("professional_id", admin.professional_id);
      }

      const { data: monthlyAppointments, error } = await query;

      if (error) throw error;

      const cancelamentos =
        monthlyAppointments?.filter((apt) => apt.status === "cancelled")
          .length || 0;
      const concluidos =
        monthlyAppointments?.filter((apt) => apt.status === "completed")
          .length || 0;

      const valorTotal =
        monthlyAppointments
          ?.filter((apt) => apt.status === "completed")
          .reduce((total, apt) => total + (apt.service?.price || 0), 0) || 0;

      // Contar serviços utilizados
      const serviceCount: { [key: string]: { count: number; value: number } } =
        {};

      monthlyAppointments?.forEach((apt) => {
        if (apt.service?.name) {
          if (!serviceCount[apt.service.name]) {
            serviceCount[apt.service.name] = { count: 0, value: 0 };
          }
          serviceCount[apt.service.name].count++;
          if (apt.status === "completed") {
            serviceCount[apt.service.name].value += apt.service.price || 0;
          }
        }
      });

      const sortedServices = Object.entries(serviceCount)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count);

      const servicosMaisUtilizados = sortedServices.slice(0, 5);
      const servicosMenosUtilizados = sortedServices.slice(-5).reverse();

      setMonthlyReport({
        cancelamentos,
        concluidos,
        valorTotal,
        servicosMaisUtilizados,
        servicosMenosUtilizados,
      });
    } catch (error) {
      console.error("Erro ao carregar relatório mensal:", error);
    }
  };

  const fetchServiceProfessionalDetail = async (
    serviceName: string,
    monthKey: string
  ) => {
    try {
      const [year, month] = monthKey.split("-");
      const firstDay = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        1
      );
      const lastDay = new Date(
        Number.parseInt(year),
        Number.parseInt(month),
        0
      );

      let query = supabase
        .from("appointments")
        .select(
          `
          *,
          service:services(name, price),
          professional:professionals(name)
        `
        )
        .gte("appointment_date", firstDay.toISOString().split("T")[0])
        .lte("appointment_date", lastDay.toISOString().split("T")[0]);

      // Se for admin normal, filtrar apenas agendamentos do seu profissional
      if (currentAdmin?.role === "admin" && currentAdmin.professional_id) {
        query = query.eq("professional_id", currentAdmin.professional_id);
      }

      const { data: appointments, error } = await query;

      if (error) throw error;

      // Filtrar apenas os agendamentos do serviço específico
      const serviceAppointments =
        appointments?.filter((apt) => apt.service?.name === serviceName) || [];

      // Agrupar por profissional
      const professionalData: {
        [key: string]: { count: number; value: number };
      } = {};

      serviceAppointments.forEach((apt) => {
        const professionalName =
          apt.professional?.name || "Profissional não identificado";
        if (!professionalData[professionalName]) {
          professionalData[professionalName] = { count: 0, value: 0 };
        }
        professionalData[professionalName].count++;
        if (apt.status === "completed") {
          professionalData[professionalName].value += apt.service?.price || 0;
        }
      });

      const professionals = Object.entries(professionalData)
        .map(([professionalName, data]) => ({
          professionalName,
          ...data,
        }))
        .sort((a, b) => b.count - a.count);

      setSelectedServiceDetail({
        serviceName,
        professionals,
      });
    } catch (error) {
      console.error("Erro ao carregar detalhes do serviço:", error);
    }
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1);
    return date.toLocaleDateString("pt-BR", {
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao autenticar");
        return;
      }

      sessionStorage.setItem("adminAuth", JSON.stringify(data.admin));
      setCurrentAdmin(data.admin);
      setIsAuthenticated(true);
      fetchAppointments(data.admin);
      if (data.admin.role === "super_admin") {
        fetchAdmins();
      }
      fetchProfessionals();
      fetchServices(data.admin);
      fetchAllServices();
      fetchAvailableMonths(data.admin);
      fetchMonthlyReport(data.admin, selectedMonth);
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    setEmail("");
    setPassword("");
  };

  const fetchAppointments = async (admin: Admin) => {
    try {
      let query = supabase
        .from("appointments")
        .select(
          `
          *,
          service:services(*),
          professional:professionals(*)
        `
        )
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      // Se for admin normal, filtrar apenas agendamentos do seu profissional
      if (admin.role === "admin" && admin.professional_id) {
        query = query.eq("professional_id", admin.professional_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/manage-admins");
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("Erro ao carregar admins:", error);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const res = await fetch("/api/professionals");
      const data = await res.json();
      if (res.ok) {
        setProfessionals(data.professionals || []);
      }
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error);
    }
  };

  const fetchServices = async (admin: Admin) => {
    try {
      let url = "/api/services";
      if (admin.role === "admin" && admin.professional_id) {
        url += `?professional_id=${admin.professional_id}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    }
  };

  const fetchAllServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (res.ok) {
        setAllServices(data.services || []);
      }
    } catch (error) {
      console.error("Erro ao carregar todos os serviços:", error);
    }
  };

  // ... (manter todas as outras funções como handleCreateAdmin, handleDeleteAdmin, etc.)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/manage-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          name: newAdminName,
          role: newAdminRole,
          professional_id: newAdminProfessionalId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao criar admin");
        return;
      }

      alert("Admin criado com sucesso!");
      setIsCreateAdminOpen(false);
      resetAdminForm();
      fetchAdmins();
    } catch (error) {
      console.error("Erro ao criar admin:", error);
      alert("Erro ao criar admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Tem certeza que deseja excluir este admin?")) return;

    try {
      const res = await fetch(`/api/admin/manage-admins?id=${adminId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir admin");
        return;
      }

      alert("Admin excluído com sucesso!");
      fetchAdmins();
    } catch (error) {
      console.error("Erro ao excluir admin:", error);
      alert("Erro ao excluir admin.");
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

    try {
      const res = await fetch("/api/admin/manage-admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          action: "delete",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir agendamento");
        return;
      }

      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
      alert("Agendamento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      alert("Erro ao excluir agendamento.");
    }
  };

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: professionalForm.name,
          email: professionalForm.email || null,
          phone: professionalForm.phone || null,
          specialties: professionalForm.specialties
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          serviceIds: professionalForm.serviceIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao criar profissional");
        return;
      }

      alert("Profissional criado com sucesso!");
      setIsCreateProfessionalOpen(false);
      resetProfessionalForm();
      fetchProfessionals();
    } catch (error) {
      console.error("Erro ao criar profissional:", error);
      alert("Erro ao criar profissional.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfessional) return;
    setLoading(true);

    try {
      const res = await fetch("/api/professionals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProfessional.id,
          name: professionalForm.name,
          email: professionalForm.email || null,
          phone: professionalForm.phone || null,
          specialties: professionalForm.specialties
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          serviceIds: professionalForm.serviceIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao atualizar profissional");
        return;
      }

      alert("Profissional atualizado com sucesso!");
      setIsEditProfessionalOpen(false);
      resetProfessionalForm();
      setEditingProfessional(null);
      fetchProfessionals();
    } catch (error) {
      console.error("Erro ao atualizar profissional:", error);
      alert("Erro ao atualizar profissional.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfessional = async (professionalId: string) => {
    if (!confirm("Tem certeza que deseja excluir este profissional?")) return;

    try {
      const res = await fetch(`/api/professionals?id=${professionalId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir profissional");
        return;
      }

      alert("Profissional excluído com sucesso!");
      fetchProfessionals();
    } catch (error) {
      console.error("Erro ao excluir profissional:", error);
      alert("Erro ao excluir profissional.");
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceForm.name,
          duration_minutes: serviceForm.duration_minutes,
          price: serviceForm.price || null,
          category: serviceForm.category,
          professionalIds: serviceForm.professionalIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao criar serviço");
        return;
      }

      alert("Serviço criado com sucesso!");
      setIsCreateServiceOpen(false);
      resetServiceForm();
      fetchServices(currentAdmin!);
      fetchAllServices();
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      alert("Erro ao criar serviço.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setLoading(true);

    try {
      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingService.id,
          name: serviceForm.name,
          duration_minutes: serviceForm.duration_minutes,
          price: serviceForm.price || null,
          category: serviceForm.category,
          professionalIds: serviceForm.professionalIds,
          adminRole: currentAdmin?.role,
          adminProfessionalId: currentAdmin?.professional_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao atualizar serviço");
        return;
      }

      alert("Serviço atualizado com sucesso!");
      setIsEditServiceOpen(false);
      resetServiceForm();
      setEditingService(null);
      fetchServices(currentAdmin!);
      fetchAllServices();
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      alert("Erro ao atualizar serviço.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    try {
      const res = await fetch(`/api/services?id=${serviceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir serviço");
        return;
      }

      alert("Serviço excluído com sucesso!");
      fetchServices(currentAdmin!);
      fetchAllServices();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      alert("Erro ao excluir serviço.");
    }
  };

  const resetAdminForm = () => {
    setNewAdminEmail("");
    setNewAdminPassword("");
    setNewAdminName("");
    setNewAdminRole("admin");
    setNewAdminProfessionalId("");
  };

  const resetProfessionalForm = () => {
    setProfessionalForm({
      name: "",
      email: "",
      phone: "",
      specialties: "",
      serviceIds: [],
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      duration_minutes: "",
      price: "",
      category: "beauty",
      professionalIds: [],
    });
  };

  const openEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setProfessionalForm({
      name: professional.name,
      email: professional.email || "",
      phone: professional.phone || "",
      specialties: professional.specialties?.join(", ") || "",
      serviceIds:
        professional.professional_services?.map((ps) => ps.service.id) || [],
    });
    setIsEditProfessionalOpen(true);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      duration_minutes: service.duration_minutes.toString(),
      price: service.price?.toString() || "",
      category: service.category,
      professionalIds:
        service.professional_services?.map((ps) => ps.professional.id) || [],
    });
    setIsEditServiceOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendado";
      case "cancelled":
        return "Cancelado";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );

      // Refresh monthly report if status changed
      if (currentAdmin) {
        fetchMonthlyReport(currentAdmin, selectedMonth);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white dark:bg-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              Painel Administrativo
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Faça login para acessar
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label
                  htmlFor="email"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderReportsContent = () => {
    if (!monthlyReport) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const chartConfig = {
      count: {
        label: "Quantidade",
        color: "hsl(var(--chart-1))",
      },
    };

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

    if (selectedServiceDetail) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setSelectedServiceDetail(null)}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalhes do Serviço: {selectedServiceDetail.serviceName}
            </h3>
          </div>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Profissionais que realizaram {selectedServiceDetail.serviceName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedServiceDetail.professionals.map(
                  (professional, index) => (
                    <div
                      key={professional.professionalName}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-200">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {professional.professionalName}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quantidade
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {professional.count}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Valor Total
                          </p>
                          <p className="text-lg font-semibold text-green-600">
                            R$ {professional.value.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {selectedServiceDetail.professionals.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum profissional realizou este serviço no período
                    selecionado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Tabs
        value={activeReportTab}
        onValueChange={setActiveReportTab}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="services">Serviços Detalhados</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Mês:
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Cancelamentos do Mês
                </CardTitle>
                <X className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {monthlyReport.cancelamentos}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Concluídos do Mês
                </CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {monthlyReport.concluidos}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Valor Total (Concluídos)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {monthlyReport.valorTotal.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Serviços Mais Utilizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyReport.servicosMaisUtilizados}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Distribuição de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlyReport.servicosMaisUtilizados}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {monthlyReport.servicosMaisUtilizados.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Ranking de Serviços por Utilização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Mais Utilizados
                  </h4>
                  <div className="space-y-2">
                    {monthlyReport.servicosMaisUtilizados.map(
                      (service, index) => (
                        <div
                          key={service.name}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() =>
                            fetchServiceProfessionalDetail(
                              service.name,
                              selectedMonth
                            )
                          }
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {index + 1}. {service.name}
                          </span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {service.count} vezes
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              R$ {service.value.toFixed(2)}
                            </span>
                            <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Todos os Serviços - {formatMonthLabel(selectedMonth)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyReport.servicosMaisUtilizados.map((service) => (
                  <div
                    key={service.name}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() =>
                      fetchServiceProfessionalDetail(
                        service.name,
                        selectedMonth
                      )
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {service.name}
                      </h3>
                      <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Quantidade:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {service.count}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Valor Total:
                        </span>
                        <span className="font-medium text-green-600">
                          R$ {service.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {monthlyReport.servicosMaisUtilizados.length === 0 && (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum serviço foi utilizado no período selecionado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "appointments":
        return (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">
                Agendamentos ({appointments.length})
                {currentAdmin?.role === "admin" &&
                  currentAdmin.professional && (
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                      - {currentAdmin.professional.name}
                    </span>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Horário
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Cliente
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Telefone
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Serviço
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Profissional
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {formatDate(appointment.appointment_date)}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {appointment.appointment_time}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {appointment.client_name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {appointment.client_phone}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {appointment.service?.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {appointment.professional?.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {appointment.status === "scheduled" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateAppointmentStatus(
                                      appointment.id,
                                      "completed"
                                    )
                                  }
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Concluir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateAppointmentStatus(
                                      appointment.id,
                                      "cancelled"
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {currentAdmin?.role === "super_admin" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  deleteAppointment(appointment.id)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {appointments.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum agendamento encontrado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "reports":
        return renderReportsContent();

      case "admins":
        return currentAdmin?.role === "super_admin" ? (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">
                Administradores ({admins.length})
              </CardTitle>
              <Dialog
                open={isCreateAdminOpen}
                onOpenChange={setIsCreateAdminOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Administrador</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="newAdminName">Nome</Label>
                      <Input
                        id="newAdminName"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newAdminEmail">Email</Label>
                      <Input
                        id="newAdminEmail"
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newAdminPassword">Senha</Label>
                      <Input
                        id="newAdminPassword"
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newAdminRole">Tipo</Label>
                      <Select
                        value={newAdminRole}
                        onValueChange={(value: "admin" | "super_admin") =>
                          setNewAdminRole(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">
                            Super Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newAdminRole === "admin" && (
                      <div>
                        <Label htmlFor="newAdminProfessional">
                          Profissional (Opcional)
                        </Label>
                        <Select
                          value={newAdminProfessionalId}
                          onValueChange={setNewAdminProfessionalId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um profissional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {professionals.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateAdminOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Criando..." : "Criar Admin"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Nome
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Profissional
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Criado em
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {admin.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {admin.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              admin.role === "super_admin"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {admin.role === "super_admin"
                              ? "Super Admin"
                              : "Admin"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {admin.professional?.name || "-"}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {formatDate(admin.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          {admin.id !== currentAdmin?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null;

      case "professionals":
        return currentAdmin?.role === "super_admin" ? (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">
                Profissionais ({professionals.length})
              </CardTitle>
              <Dialog
                open={isCreateProfessionalOpen}
                onOpenChange={setIsCreateProfessionalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Profissional
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Profissional</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreateProfessional}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="professionalName">Nome *</Label>
                        <Input
                          id="professionalName"
                          value={professionalForm.name}
                          onChange={(e) =>
                            setProfessionalForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Nome completo"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="professionalEmail">Email</Label>
                        <Input
                          id="professionalEmail"
                          type="email"
                          value={professionalForm.email}
                          onChange={(e) =>
                            setProfessionalForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="professionalPhone">Telefone</Label>
                        <Input
                          id="professionalPhone"
                          value={professionalForm.phone}
                          onChange={(e) =>
                            setProfessionalForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="professionalSpecialties">
                          Especialidades
                        </Label>
                        <Input
                          id="professionalSpecialties"
                          value={professionalForm.specialties}
                          onChange={(e) =>
                            setProfessionalForm((prev) => ({
                              ...prev,
                              specialties: e.target.value,
                            }))
                          }
                          placeholder="Cortes, Coloração, etc. (separar por vírgula)"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Serviços</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                        {allServices.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={professionalForm.serviceIds.includes(
                                service.id
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProfessionalForm((prev) => ({
                                    ...prev,
                                    serviceIds: [
                                      ...prev.serviceIds,
                                      service.id,
                                    ],
                                  }));
                                } else {
                                  setProfessionalForm((prev) => ({
                                    ...prev,
                                    serviceIds: prev.serviceIds.filter(
                                      (id) => id !== service.id
                                    ),
                                  }));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`service-${service.id}`}
                              className="text-sm"
                            >
                              {service.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateProfessionalOpen(false);
                          resetProfessionalForm();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Criando..." : "Criar Profissional"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Nome
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Telefone
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Especialidades
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Serviços
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {professionals.map((professional) => (
                      <tr
                        key={professional.id}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {professional.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            {professional.email && (
                              <Mail className="h-4 w-4 mr-1" />
                            )}
                            {professional.email || "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            {professional.phone && (
                              <Phone className="h-4 w-4 mr-1" />
                            )}
                            {professional.phone || "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {professional.specialties?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {professional.specialties.map(
                                (specialty, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {specialty}
                                  </Badge>
                                )
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {professional.professional_services?.length || 0}{" "}
                          serviços
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditProfessional(professional)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDeleteProfessional(professional.id)
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {professionals.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum profissional encontrado.
                  </p>
                </div>
              )}
            </CardContent>

            {/* Edit Professional Dialog */}
            <Dialog
              open={isEditProfessionalOpen}
              onOpenChange={setIsEditProfessionalOpen}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Profissional</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditProfessional} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editProfessionalName">Nome *</Label>
                      <Input
                        id="editProfessionalName"
                        value={professionalForm.name}
                        onChange={(e) =>
                          setProfessionalForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editProfessionalEmail">Email</Label>
                      <Input
                        id="editProfessionalEmail"
                        type="email"
                        value={professionalForm.email}
                        onChange={(e) =>
                          setProfessionalForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editProfessionalPhone">Telefone</Label>
                      <Input
                        id="editProfessionalPhone"
                        value={professionalForm.phone}
                        onChange={(e) =>
                          setProfessionalForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editProfessionalSpecialties">
                        Especialidades
                      </Label>
                      <Input
                        id="editProfessionalSpecialties"
                        value={professionalForm.specialties}
                        onChange={(e) =>
                          setProfessionalForm((prev) => ({
                            ...prev,
                            specialties: e.target.value,
                          }))
                        }
                        placeholder="Cortes, Coloração, etc. (separar por vírgula)"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Serviços</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                      {allServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`edit-service-${service.id}`}
                            checked={professionalForm.serviceIds.includes(
                              service.id
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setProfessionalForm((prev) => ({
                                  ...prev,
                                  serviceIds: [...prev.serviceIds, service.id],
                                }));
                              } else {
                                setProfessionalForm((prev) => ({
                                  ...prev,
                                  serviceIds: prev.serviceIds.filter(
                                    (id) => id !== service.id
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-service-${service.id}`}
                            className="text-sm"
                          >
                            {service.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditProfessionalOpen(false);
                        resetProfessionalForm();
                        setEditingProfessional(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        ) : null;

      case "services":
        return (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">
                Serviços ({services.length})
                {currentAdmin?.role === "admin" && (
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                    - Seus serviços
                  </span>
                )}
              </CardTitle>
              {currentAdmin?.role === "super_admin" && (
                <Dialog
                  open={isCreateServiceOpen}
                  onOpenChange={setIsCreateServiceOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Serviço
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Serviço</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateService} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="serviceName">Nome *</Label>
                          <Input
                            id="serviceName"
                            value={serviceForm.name}
                            onChange={(e) =>
                              setServiceForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Nome do serviço"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="serviceDuration">
                            Duração (minutos) *
                          </Label>
                          <Input
                            id="serviceDuration"
                            type="number"
                            value={serviceForm.duration_minutes}
                            onChange={(e) =>
                              setServiceForm((prev) => ({
                                ...prev,
                                duration_minutes: e.target.value,
                              }))
                            }
                            placeholder="30"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="servicePrice">Preço (R$)</Label>
                          <Input
                            id="servicePrice"
                            type="number"
                            step="0.01"
                            value={serviceForm.price}
                            onChange={(e) =>
                              setServiceForm((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                            placeholder="25.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="serviceCategory">Categoria</Label>
                          <Select
                            value={serviceForm.category}
                            onValueChange={(value) =>
                              setServiceForm((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beauty">Beleza</SelectItem>
                              <SelectItem value="hair">Cabelo</SelectItem>
                              <SelectItem value="skin">Pele</SelectItem>
                              <SelectItem value="nails">Unhas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Profissionais</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                          {professionals.map((professional) => (
                            <div
                              key={professional.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`professional-${professional.id}`}
                                checked={serviceForm.professionalIds.includes(
                                  professional.id
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setServiceForm((prev) => ({
                                      ...prev,
                                      professionalIds: [
                                        ...prev.professionalIds,
                                        professional.id,
                                      ],
                                    }));
                                  } else {
                                    setServiceForm((prev) => ({
                                      ...prev,
                                      professionalIds:
                                        prev.professionalIds.filter(
                                          (id) => id !== professional.id
                                        ),
                                    }));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`professional-${professional.id}`}
                                className="text-sm"
                              >
                                {professional.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCreateServiceOpen(false);
                            resetServiceForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? "Criando..." : "Criar Serviço"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Nome
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Duração
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Preço
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Categoria
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Profissionais
                      </th>
                      <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          {service.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {service.duration_minutes}min
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {service.price
                              ? `R$ ${service.price.toFixed(2)}`
                              : "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          <Badge variant="outline">{service.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {service.professional_services?.length || 0}{" "}
                          profissionais
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditService(service)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {currentAdmin?.role === "super_admin" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {services.length === 0 && (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum serviço encontrado.
                  </p>
                </div>
              )}
            </CardContent>

            {/* Edit Service Dialog */}
            <Dialog
              open={isEditServiceOpen}
              onOpenChange={setIsEditServiceOpen}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Serviço</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditService} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editServiceName">Nome *</Label>
                      <Input
                        id="editServiceName"
                        value={serviceForm.name}
                        onChange={(e) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Nome do serviço"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editServiceDuration">
                        Duração (minutos) *
                      </Label>
                      <Input
                        id="editServiceDuration"
                        type="number"
                        value={serviceForm.duration_minutes}
                        onChange={(e) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            duration_minutes: e.target.value,
                          }))
                        }
                        placeholder="30"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editServicePrice">Preço (R$)</Label>
                      <Input
                        id="editServicePrice"
                        type="number"
                        step="0.01"
                        value={serviceForm.price}
                        onChange={(e) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                        placeholder="25.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editServiceCategory">Categoria</Label>
                      <Select
                        value={serviceForm.category}
                        onValueChange={(value) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beauty">Beleza</SelectItem>
                          <SelectItem value="hair">Cabelo</SelectItem>
                          <SelectItem value="skin">Pele</SelectItem>
                          <SelectItem value="nails">Unhas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {currentAdmin?.role === "super_admin" && (
                    <div>
                      <Label>Profissionais</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                        {professionals.map((professional) => (
                          <div
                            key={professional.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`edit-professional-${professional.id}`}
                              checked={serviceForm.professionalIds.includes(
                                professional.id
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setServiceForm((prev) => ({
                                    ...prev,
                                    professionalIds: [
                                      ...prev.professionalIds,
                                      professional.id,
                                    ],
                                  }));
                                } else {
                                  setServiceForm((prev) => ({
                                    ...prev,
                                    professionalIds:
                                      prev.professionalIds.filter(
                                        (id) => id !== professional.id
                                      ),
                                  }));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`edit-professional-${professional.id}`}
                              className="text-sm"
                            >
                              {professional.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditServiceOpen(false);
                        resetServiceForm();
                        setEditingService(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Painel Admin
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-4 px-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {menuItems.find((item) => item.id === activeTab)?.label ||
                    "Painel Administrativo"}
                </h1>
                <Badge
                  variant={
                    currentAdmin?.role === "super_admin"
                      ? "default"
                      : "secondary"
                  }
                >
                  {currentAdmin?.role === "super_admin"
                    ? "Super Admin"
                    : "Admin"}
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentAdmin?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{renderContent()}</main>
      </div>
    </div>
  );
}
