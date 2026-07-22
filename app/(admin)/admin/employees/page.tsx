"use client";

import { useState, useEffect } from "react";
// Updated import to resolve the new default-exported EmployeeTable
import EmployeeTable, { Employee } from "../../../components/admin/employees/EmployeeTable";

import AddEmployeeModal from "../../../components/admin/employees/AddEmployeeModal";
import EditEmployeeModal from "../../../components/admin/employees/EditEmployeeModal";
import ViewEmployeeModal from "../../../components/admin/employees/ViewEmployeeModal";
import EmptyState from "../../../components/admin/employees/EmptyState";

/**
 * Translates raw backend errors, database codes, or network issues 
 * into clear, polite, and user-friendly messages.
 */
function getFriendlyErrorMessage(error: string | null): string | null {
  if (!error) return null;

  const lower = error.toLowerCase();
  
  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Unable to connect to the server. Please check your network connection and try again.";
  }
  if (lower.includes("unauthorized") || lower.includes("forbidden") || lower.includes("401") || lower.includes("403")) {
    return "Your authorization has expired or you do not have permission. Please sign in again.";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "The requested information could not be found. Please refresh and try again.";
  }
  if (lower.includes("unique") || lower.includes("already exists") || lower.includes("duplicate")) {
    return "An employee account with this email address is already registered.";
  }
  if (lower.includes("validation") || lower.includes("required") || lower.includes("invalid input")) {
    return "Please verify that all fields are filled out correctly before saving.";
  }

  return "Something went wrong while processing this action. Please try again shortly.";
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]); // State to hold fetched departments
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal triggers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Selected employee data
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Loading & system page states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local state containers for safe modal form validation errors
  const [addEmployeeError, setAddEmployeeError] = useState<string | null>(null);
  const [editEmployeeError, setEditEmployeeError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/admin/employees");
      if (!res.ok) throw new Error("Failed to load database profiles.");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // New function to fetch departments from your company settings API
  const fetchDepartments = async () => {
    try {
      // NOTE: Ensure this URL matches the path of your company-settings API.
      // E.g., "/api/admin/company-settings" or "/api/company-settings"
      const res = await fetch("/api/settings/company-settings"); 
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.departments)) {
          setDepartments(data.departments);
        }
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      fetchEmployees();
      fetchDepartments(); // Fetching company settings departments on component mount
    }
    loadInitialData();
  }, []);

  // CREATE profile handler
  const handleCreateEmployee = async (
    data: Omit<Employee, "id" | "role"> & {
      password?: string;
      designation?: string;
      joinDate?: string;
      role?: "employee" | "admin";
      salary: number;
      department: string;
      status: string;
    }
  ) => {
    setAddEmployeeError(null);
    try {
      // Attach a fallback/default role in case it is missing
      const payload = {
        role: "employee",
        ...data,
      };

      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let serverErrorMsg = "Failed to create profile.";
      if (!res.ok) {
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const result = await res.json();
            serverErrorMsg = result.error || result.message || serverErrorMsg;
          } else {
            const text = await res.text();
            serverErrorMsg = text || serverErrorMsg;
          }
        } catch {}
        throw new Error(serverErrorMsg);
      }

      const result = await res.json();
      if (result.employee) {
        setEmployees((prev) => [result.employee, ...prev]);
        setAddEmployeeError(null);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      setAddEmployeeError(err instanceof Error ? err.message : "An error occurred during registration.");
    }
  };

  // EDIT profile handler
  const handleEditEmployee = async (id: string | number, updatedData: Omit<Employee, "id">) => {
    setEditEmployeeError(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      let serverErrorMsg = "Failed to edit profile.";
      if (!res.ok) {
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const result = await res.json();
            serverErrorMsg = result.error || result.message || serverErrorMsg;
          } else {
            const text = await res.text();
            serverErrorMsg = text || serverErrorMsg;
          }
        } catch {}
        throw new Error(serverErrorMsg);
      }

      const result = await res.json();
      if (result.employee) {
        setEmployees((prev) => 
          prev.map((emp) => (emp.id === id ? result.employee : emp))
        );
        setEditEmployeeError(null);
        setIsEditModalOpen(false);
        setSelectedEmployee(null);
      }
    } catch (err) {
      setEditEmployeeError(err instanceof Error ? err.message : "Could not update user info.");
      throw err;
    }
  };

  // DELETE profile handler
  const handleDeleteEmployee = async (id: string | number) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete employee profile");

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      setIsViewModalOpen(false);
      setSelectedEmployee(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete database records.");
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditEmployeeError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsViewModalOpen(true);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-line-subtle">
        <div>
          <h1 className="text-2xl font-extrabold text-content-main tracking-tight font-sans">Employees</h1>
          <p className="mt-1 text-xs text-content-secondary">
            Manage employee directory profiles, status actions, and structures.
          </p>
        </div>

        {/* Action Panel with Unified Theme Colors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-surface-card border border-line-subtle rounded-xl text-xs text-content-main placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-accent transition-all duration-150 shadow-sm"
            />
          </div>

          <button
            onClick={() => {
              setAddEmployeeError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Directory Section */}
      <div className="space-y-4">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
          Directory List ({filteredEmployees.length})
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-card rounded-2xl border border-line-subtle shadow-sm">
            <span className="text-content-secondary text-xs animate-pulse">Loading employee data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-amber-50/50 rounded-2xl border border-amber-100/80 text-amber-800 shadow-sm">
            <span className="text-xs font-semibold text-center">{getFriendlyErrorMessage(error)}</span>
            <button 
              onClick={() => {
                setIsLoading(true);
                setError(null);
                fetchEmployees();
              }}
              className="mt-3 px-3.5 py-1.5 bg-brand-accent hover:bg-brand-hover text-white text-[10px] font-bold rounded-lg shadow-sm transition-all duration-150 active:scale-[0.95]"
            >
              Retry Loading Directory
            </button>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-card rounded-2xl border border-dashed border-line-subtle">
            <span className="text-content-secondary text-xs">No employees match your search query.</span>
          </div>
        ) : (
          <EmployeeTable
            employees={filteredEmployees}
            onEdit={handleOpenEdit}
            onViewPortal={handleOpenView}
          />
        )}
      </div>

      {/* 1. Add Employee Modal (Fixed Syntax & Passed Departments) */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddEmployeeError(null);
        }}
        errorMessage={getFriendlyErrorMessage(addEmployeeError)}
        onSave={handleCreateEmployee}
        departments={departments} // Pass fetched departments state here
      />

      {/* 2. Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
          setEditEmployeeError(null);
        }}
        errorMessage={getFriendlyErrorMessage(editEmployeeError)}
        employee={selectedEmployee}
        onSave={handleEditEmployee}
        // If EditEmployeeModal also has a department drop-down, pass the prop here:
        // departments={departments}
      />

      {/* 3. View Employee Portal Modal */}
      <ViewEmployeeModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onDelete={handleDeleteEmployee}
      />
    </div>
  );
}