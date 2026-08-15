import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Metric, Profile, SocialAccount } from "./platform";

export type Report = {
  id: string;
  customer_id: string;
  month: number;
  year: number;
  summary: string | null;
  recommendations: string | null;
  admin_notes: string | null;
  performance_score: number;
  status: string;
  created_at: string;
};

export type Goal = {
  id: string;
  customer_id: string;
  platform: string;
  metric: string;
  starting_value: number;
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: string;
};

export type Notification = {
  id: string;
  customer_id: string;
  title: string;
  message: string | null;
  kind: string;
  read: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  customer_id: string;
  subject: string;
  body: string;
  direction: string;
  read: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  admin_name: string | null;
  action: string;
  target_customer_id: string | null;
  target_customer_name: string | null;
  details: string | null;
  created_at: string;
};

export type Settings = {
  id: number;
  platform_name: string;
  auto_approve: boolean;
  show_rankings_to_customers: boolean;
  weight_growth: number;
  weight_engagement: number;
  weight_reach: number;
  weight_activity: number;
};

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () =>
      unwrap<Profile[]>(
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile | null;
    },
    enabled: !!id,
  });
}

export function useAccounts(customerId?: string) {
  return useQuery({
    queryKey: ["accounts", customerId ?? "all"],
    queryFn: () => {
      let q = supabase.from("social_accounts").select("*").order("platform");
      if (customerId) q = q.eq("customer_id", customerId);
      return unwrap<SocialAccount[]>(q);
    },
  });
}

export function useMetrics(accountIds: string[]) {
  return useQuery({
    queryKey: ["metrics", [...accountIds].sort().join(",")],
    queryFn: () =>
      accountIds.length
        ? unwrap<Metric[]>(
            supabase
              .from("social_metrics")
              .select("*")
              .in("social_account_id", accountIds)
              .order("recorded_on"),
          )
        : Promise.resolve([] as Metric[]),
    enabled: accountIds.length >= 0,
  });
}

export function useReports(customerId?: string) {
  return useQuery({
    queryKey: ["reports", customerId ?? "all"],
    queryFn: () => {
      let q = supabase
        .from("monthly_reports")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (customerId) q = q.eq("customer_id", customerId);
      return unwrap<Report[]>(q);
    },
  });
}

export function useGoals(customerId?: string) {
  return useQuery({
    queryKey: ["goals", customerId ?? "all"],
    queryFn: () => {
      let q = supabase.from("goals").select("*").order("created_at", { ascending: false });
      if (customerId) q = q.eq("customer_id", customerId);
      return unwrap<Goal[]>(q);
    },
  });
}

export function useNotifications(customerId?: string) {
  return useQuery({
    queryKey: ["notifications", customerId ?? "all"],
    queryFn: () => {
      let q = supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (customerId) q = q.eq("customer_id", customerId);
      return unwrap<Notification[]>(q);
    },
  });
}

export function useMessages(customerId?: string) {
  return useQuery({
    queryKey: ["messages", customerId ?? "all"],
    queryFn: () => {
      let q = supabase.from("messages").select("*").order("created_at", { ascending: false });
      if (customerId) q = q.eq("customer_id", customerId);
      return unwrap<Message[]>(q);
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: () =>
      unwrap<AuditLog[]>(
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
      ),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Settings | null;
    },
  });
}

export async function logAudit(entry: {
  adminName: string;
  action: string;
  customerId?: string | null;
  customerName?: string | null;
  details?: string;
}) {
  await supabase.from("audit_logs").insert({
    admin_name: entry.adminName,
    action: entry.action,
    target_customer_id: entry.customerId ?? null,
    target_customer_name: entry.customerName ?? null,
    details: entry.details ?? null,
  });
}

export async function notify(customerId: string, title: string, message: string, kind = "info") {
  await supabase.from("notifications").insert({ customer_id: customerId, title, message, kind });
}
