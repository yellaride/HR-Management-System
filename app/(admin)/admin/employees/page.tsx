"use client";

import { useState, useEffect } from "react";
import EmployeeCard, { Employee } from "../../../components/employee/EmployeeCard";
import AddEmployeeModal from "../../../components/employee/AddEmployeeModal";
import EditEmployeeModal from "../../../components/employee/EditEmployeeModal";
import ViewEmployeeModal from "../../../components/employee/ViewEmployeeModal";
// Import the EmptyState component (adjust path if needed)
import EmptyState from "../../../components/employee/EmptyState";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal Triggers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Selected Employee State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employees");
      if (!res.ok) throw new Error("Failed to load database profiles.");
      const data = await res.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // CREATE profile handler
  const handleCreateEmployee = async (data: Omit<Employee, "id"> & { password?: string }) => {
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create profile");

      if (result.employee) {
        setEmployees((prev) => [result.employee, ...prev]);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred during registration.");
    }
  };

  // EDIT profile handler
  const handleEditEmployee = async (id: string | number, updatedData: Omit<Employee, "id">) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to edit profile");

      if (result.employee) {
        setEmployees((prev) => 
          prev.map((emp) => (emp.id === id ? result.employee : emp))
        );
      }
    } catch (err: any) {
      alert(err.message || "Could not update user info.");
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
    } catch (err: any) {
      alert(err.message || "Could not delete database records.");
      throw err;
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employees</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage employee directory profiles, status actions, and structures.
          </p>
        </div>

        {/* Action Panel: Search and Add Button inline */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Directory List ({filteredEmployees.length})
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <span className="text-slate-500 text-xs animate-pulse">Loading employee data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-2xl border border-red-200 text-red-600">
            <span className="text-xs font-semibold">Error: {error}</span>
            <button 
              onClick={fetchEmployees}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-[10px] rounded-lg hover:bg-red-700 font-bold transition"
            >
              Retry
            </button>
          </div>
        ) : employees.length === 0 ? (
          /* Condition 1: Database has no data. Shows the custom EmptyState component. */
          <EmptyState onAddClick={() => setIsAddModalOpen(true)} />
        ) : filteredEmployees.length === 0 ? (
          /* Condition 2: Database has data, but the search filter yields no matches. */
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <span className="text-slate-500 text-xs">No employees match your search query.</span>
          </div>
        ) : (
          /* Condition 3: Show employee directory grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onEdit={handleOpenEdit}
                onViewPortal={handleOpenView}
              />
            ))}
          </div>
        )}
      </div>

      {/* 1. Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateEmployee}
      />

      {/* 2. Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSave={handleEditEmployee}
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