import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Mail, Phone, Search, ShieldAlert } from "lucide-react";
import { TopBar } from "@/components/shared/TopBar";
import { BottomBar } from "@/components/shared/BottomBar";
import { listAdminUsers, type AdminUserRow } from "@/lib/admin-directory.functions";
import { accountTypeLabel } from "@/lib/auth-display-name";

export const Route = createFileRoute("/_dashboard/admin")({
  head: () => ({
    meta: [
      { title: "Admin Directory — HANDWERK" },
      { name: "description", content: "Private directory of all homeowner and contractor accounts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRoute,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "contractor", label: "Contractors" },
  { key: "homeowner", label: "Homeowners" },
] as const;

function isContractor(t: string | null) {
  return !!t && t !== "homeowner";
}

function AdminRoute() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAdminUsers(),
  });

  const rows = useMemo(() => {
    const list = data?.users ?? [];
    const term = q.trim().toLowerCase();
    return list.filter((u) => {
      if (filter === "homeowner" && u.accountType !== "homeowner") return false;
      if (filter === "contractor" && !isContractor(u.accountType)) return false;
      if (!term) return true;
      return [u.fullName, u.companyName, u.email, u.phone, u.city]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [data, q, filter]);

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Admin Directory</h1>
        <p className="text-sm text-muted-foreground">Every account on the platform.</p>

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>}
        {data && !data.allowed && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-border p-4">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <p className="text-sm">This page is only for platform admins.</p>
          </div>
        )}

        {data?.allowed && (
          <>
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-card px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, company, email, phone, city"
                className="h-10 w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-3 flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto self-center text-xs text-muted-foreground">{rows.length} users</span>
            </div>
            <ul className="mt-4 space-y-3">
              {rows.map((u) => <UserCard key={u.id} u={u} />)}
            </ul>
          </>
        )}
      </main>
      <BottomBar />
    </div>
  );
}

function UserCard({ u }: { u: AdminUserRow }) {
  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{u.fullName || "No name"}</p>
          {u.companyName && <p className="truncate text-sm text-muted-foreground">{u.companyName}</p>}
          <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{u.email}</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {accountTypeLabel(u.accountType)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {(u.city || u.postalCode) && <span>{[u.postalCode, u.city].filter(Boolean).join(" ")}</span>}
        {u.trades.length > 0 && <span>{u.trades.join(", ")}</span>}
        <span>{u.emailConfirmed ? "Email confirmed" : "Not confirmed"}</span>
        {u.createdAt && <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        {u.phone && (
          <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Phone className="h-3.5 w-3.5" /> {u.phone}
          </a>
        )}
        {u.email && (
          <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-medium">
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        )}
      </div>
    </li>
  );
}
