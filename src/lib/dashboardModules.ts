/**
 * SINGLE SOURCE OF TRUTH for all dashboard modules & sub-modules.
 *
 * This list drives:
 *  1. The permission sidebar in the Super Admin panel (auto-shows every module)
 *  2. The dashboard sidebar nav filter (already keyed by moduleId)
 *
 * IMPORTANT: Whenever you add a new module/sub-module to the dashboard layout.tsx,
 * add the matching entry here so it immediately appears in the superadmin
 * permission sidebar with a working toggle.
 */

import {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  Briefcase,
  Wallet,
  Factory,
  Clock,
  Trash2,
  Settings,
  Receipt
} from "lucide-react";

export interface SubModule {
  id: string;
  name: string;
  slug?: string;
  icon?: any;
}

export interface DashboardModule {
  id: string;
  name: string;
  slug: string;
  icon?: any;
  subItems?: SubModule[];
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    slug: "dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "billing",
    name: "Billing",
    slug: "billing",
    icon: CreditCard,
  },
  {
    id: "stock",
    name: "Stock",
    slug: "stock",
    icon: Package,
  },
  {
    id: "parties",
    name: "Party",
    slug: "parties",
    icon: Users,
    subItems: [
      { id: "parties_list", name: "Party List", slug: "parties", icon: Users },
      { id: "parties_collect", name: "Collect Amount", slug: "collect", icon: CreditCard },
    ],
  },
  {
    id: "employees",
    name: "Employees",
    slug: "employees",
    icon: Briefcase,
  },
  {
    id: "finance",
    name: "Finance & Account",
    slug: "finance",
    icon: Wallet,
  },
  {
    id: "manufacturers",
    name: "Manufacturer",
    slug: "manufacturers",
    icon: Factory,
    subItems: [
      { id: "manufacturers_list", name: "Manufacturer List", slug: "manufacturers", icon: Factory },
      { id: "manufacturers_pay", name: "Pay Amount", slug: "pay", icon: CreditCard },
      { id: "manufacturers_add_bill", name: "Add Bill", slug: "add-bill", icon: Receipt },
    ],
  },
  {
    id: "session",
    name: "Session",
    slug: "session",
    icon: Clock,
  },
  {
    id: "trash",
    name: "Trash",
    slug: "trash",
    icon: Trash2,
  },
  {
    id: "settings",
    name: "Settings",
    slug: "settings",
    icon: Settings,
  },
];
