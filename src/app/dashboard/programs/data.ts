import {
    Program,
    ProgramActivity,
    PerformancePoint,
    ProgramInsight,
  } from "./types";
  
  export const PROGRAMS: Program[] = [];

  /** Demo-only seed data — never used in production UI */
  export const DEMO_PROGRAMS: Program[] = [
    {
      id: "PG001",
      name: "Education For Every Child",
      category: "Education",
      description:
        "Providing educational resources and digital learning opportunities to underserved children.",
      manager: "Sarah Johnson",
      beneficiaries: 5400,
      budget: 250000,
      spent: 182500,
      progress: 73,
      startDate: "2026-01-15",
      endDate: "2026-12-20",
      status: "Active",
      priority: "High",
      location: "Arizona",
      createdAt: "2026-01-10",
      updatedAt: "2026-07-20",
    },
  
    {
      id: "PG002",
      name: "Healthcare Outreach",
      category: "Healthcare",
      description:
        "Delivering mobile healthcare services to rural communities.",
      manager: "David Miller",
      beneficiaries: 3200,
      budget: 180000,
      spent: 180000,
      progress: 100,
      startDate: "2026-02-01",
      endDate: "2026-06-30",
      status: "Completed",
      priority: "High",
      location: "Nevada",
      createdAt: "2026-01-25",
      updatedAt: "2026-06-30",
    },
  
    {
      id: "PG003",
      name: "Clean Water Initiative",
      category: "Environment",
      description:
        "Installing sustainable clean water systems in underserved regions.",
      manager: "Emily Brown",
      beneficiaries: 8900,
      budget: 340000,
      spent: 218000,
      progress: 64,
      startDate: "2026-03-05",
      endDate: "2026-11-30",
      status: "Active",
      priority: "Critical",
      location: "Texas",
      createdAt: "2026-03-01",
      updatedAt: "2026-07-22",
    },
  
    {
      id: "PG004",
      name: "Food Distribution",
      category: "Community",
      description:
        "Supporting vulnerable families through monthly food distribution.",
      manager: "Michael Lee",
      beneficiaries: 7200,
      budget: 160000,
      spent: 48000,
      progress: 30,
      startDate: "2026-05-01",
      endDate: "2026-12-31",
      status: "Planning",
      priority: "Medium",
      location: "California",
      createdAt: "2026-04-25",
      updatedAt: "2026-07-18",
    },
  ];
  
  export const PROGRAM_ACTIVITIES: ProgramActivity[] = [];
  
  export const PERFORMANCE_DATA: PerformancePoint[] = [
    { month: "Jan", planning: 40, execution: 20, review: 10, optimization: 5 },
    { month: "Feb", planning: 52, execution: 34, review: 18, optimization: 12 },
    { month: "Mar", planning: 60, execution: 48, review: 30, optimization: 20 },
    { month: "Apr", planning: 70, execution: 58, review: 42, optimization: 32 },
    { month: "May", planning: 76, execution: 67, review: 54, optimization: 48 },
    { month: "Jun", planning: 82, execution: 74, review: 63, optimization: 60 },
    { month: "Jul", planning: 88, execution: 81, review: 72, optimization: 70 },
  ];
  
  export const PROGRAM_INSIGHTS: ProgramInsight[] = [];
  
  export const PROGRAM_CATEGORIES = [
    "Education",
    "Healthcare",
    "Community",
    "Environment",
  ];
  
  export const PROGRAM_STATUSES = [
    "Planning",
    "Active",
    "Completed",
    "On Hold",
  ];
  
  export const PROGRAM_PRIORITIES = [
    "Low",
    "Medium",
    "High",
    "Critical",
  ];

  export interface ProgramTemplate {
    id: string;
    name: string;
    category: string;
    description: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    budget: number;
    location: string;
  }

  export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
    {
      id: "TPL-EDU",
      name: "Education For Every Child",
      category: "Education",
      description:
        "Providing educational resources and digital learning opportunities to underserved children.",
      priority: "High",
      budget: 250000,
      location: "Arizona",
    },
    {
      id: "TPL-HLT",
      name: "Healthcare Outreach",
      category: "Healthcare",
      description:
        "Delivering mobile healthcare services to rural and underserved communities.",
      priority: "High",
      budget: 180000,
      location: "Nevada",
    },
    {
      id: "TPL-ENV",
      name: "Clean Water Initiative",
      category: "Environment",
      description:
        "Installing sustainable clean water systems in underserved regions.",
      priority: "Critical",
      budget: 340000,
      location: "Texas",
    },
    {
      id: "TPL-COM",
      name: "Food Distribution",
      category: "Community",
      description:
        "Supporting vulnerable families through monthly food distribution programs.",
      priority: "Medium",
      budget: 160000,
      location: "California",
    },
  ];