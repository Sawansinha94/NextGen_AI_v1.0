import React, { useState, useMemo } from "react";
import { ExternalLink, Search, LayoutGrid } from "lucide-react";

export interface TicketItem {
  id?: string | number;
  number?: string;
  incidentNumber?: string;
  short_description?: string;
  shortDescription?: string;
  description?: string;
  priority?: string;
  state?: string;
  category?: string;
  assignment_group?: string;
  assignmentGroup?: string;
  assigned_to?: string;
  assignedTo?: string;
  assignee?: string;
  updated_at?: string;
  openedDate?: string;
  dueDate?: string;
  resolutionNote?: string;
}

interface ServiceNowTicketsTableProps {
  tickets: TicketItem[];
  snowInstance?: string;
  title?: string;
  className?: string;
}

export function ServiceNowTicketsTable({
  tickets,
  snowInstance = "dev.service-now.com",
  title = "ServiceNow Tickets",
  className = "",
}: ServiceNowTicketsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const displayValue = (value: unknown, fallback: string): string => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => displayValue(item, "")).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      return displayValue(
        record.display_value ?? record.value ?? record.name ?? record.label,
        fallback,
      );
    }
    return fallback;
  };

  const formattedBaseUrl = useMemo(() => {
    const raw = (snowInstance || "dev.service-now.com").trim();
    return raw.startsWith("http://") || raw.startsWith("https://")
      ? raw.replace(/\/+$/, "")
      : `https://${raw.replace(/\/+$/, "")}`;
  }, [snowInstance]);

  const filteredTickets = useMemo(() => {
    if (!searchTerm.trim()) return tickets;
    const term = searchTerm.toLowerCase().trim();
    return tickets.filter((t) => {
      const num = displayValue(t.number || t.incidentNumber, "").toLowerCase();
      const desc = displayValue(t.short_description || t.shortDescription || t.description, "").toLowerCase();
      const assignee = displayValue(t.assigned_to || t.assignedTo || t.assignee, "").toLowerCase();
      const cat = displayValue(t.category || t.assignment_group || t.assignmentGroup, "").toLowerCase();
      const state = displayValue(t.state, "").toLowerCase();
      const pri = displayValue(t.priority, "").toLowerCase();
      return (
        num.includes(term) ||
        desc.includes(term) ||
        assignee.includes(term) ||
        cat.includes(term) ||
        state.includes(term) ||
        pri.includes(term)
      );
    });
  }, [tickets, searchTerm]);

  const renderPriorityBadge = (rawPriority?: string) => {
    const pri = displayValue(rawPriority, "P3 - Moderate").trim();
    const lower = pri.toLowerCase();

    if (lower.includes("1") || lower.includes("critical") || lower.includes("p1")) {
      return (
        <span className="border border-rose-500/50 bg-rose-950/40 text-rose-300 font-medium px-2.5 py-1 rounded-md text-xs whitespace-nowrap inline-block">
          {pri.startsWith("P1") ? pri : `P1 - ${pri.replace(/^\d+\s*-\s*/, "")}`}
        </span>
      );
    }
    if (lower.includes("2") || lower.includes("high") || lower.includes("p2")) {
      return (
        <span className="border border-amber-500/60 bg-amber-950/40 text-amber-300 font-medium px-2.5 py-1 rounded-md text-xs whitespace-nowrap inline-block">
          {pri.startsWith("P2") ? pri : `P2 - ${pri.replace(/^\d+\s*-\s*/, "")}`}
        </span>
      );
    }
    if (lower.includes("4") || lower.includes("low") || lower.includes("p4")) {
      return (
        <span className="border border-slate-700 bg-slate-800/50 text-slate-400 font-medium px-2.5 py-1 rounded-md text-xs whitespace-nowrap inline-block">
          {pri.startsWith("P4") ? pri : `P4 - ${pri.replace(/^\d+\s*-\s*/, "")}`}
        </span>
      );
    }
    return (
      <span className="border border-slate-600/70 bg-slate-800/70 text-slate-300 font-medium px-2.5 py-1 rounded-md text-xs whitespace-nowrap inline-block">
        {pri.startsWith("P3") ? pri : `P3 - ${pri.replace(/^\d+\s*-\s*/, "")}`}
      </span>
    );
  };

  const renderStateText = (rawState?: string) => {
    const state = displayValue(rawState, "New").trim();
    const lower = state.toLowerCase();

    if (lower.includes("progress")) {
      return <span className="text-sky-400 font-medium whitespace-nowrap">{state}</span>;
    }
    if (lower.includes("resolve") || lower.includes("close")) {
      return <span className="text-emerald-400 font-medium whitespace-nowrap">{state}</span>;
    }
    if (lower.includes("hold") || lower.includes("wait")) {
      return <span className="text-amber-300 font-medium whitespace-nowrap">{state}</span>;
    }
    return <span className="text-slate-300 font-medium whitespace-nowrap">{state}</span>;
  };

  return (
    <div
      className={`rounded-2xl border border-sky-800/40 bg-[#051a2d]/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 text-slate-100 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <span className="px-3 py-0.5 rounded-full text-xs font-medium text-sky-300 bg-[#072542] border border-sky-500/30">
            {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets by number, owner, or summary..."
            className="pl-9 pr-4 py-1.5 sm:py-2 bg-[#031322] border border-sky-900/60 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400 w-full sm:w-80 transition-colors"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-3.5 overflow-x-auto rounded-xl border border-sky-900/40">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#041525]/90 text-slate-300 font-bold uppercase text-[11px] tracking-wider border-b border-sky-900/40">
            <tr>
              <th className="py-3 px-4">Incident #</th>
              <th className="py-3 px-4 min-w-[220px]">Summary Description</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">State</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Assignee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-900/30">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t, idx) => {
                const incNumber = displayValue(
                  t.number || t.incidentNumber,
                  `INC${String(idx + 1).padStart(7, "0")}`,
                );
                const description = displayValue(
                  t.short_description || t.shortDescription || t.description,
                  "Service request",
                );
                const category = displayValue(
                  t.category || t.assignment_group || t.assignmentGroup,
                  "General",
                );
                const assignee = displayValue(
                  t.assigned_to || t.assignedTo || t.assignee,
                  "Unassigned",
                );
                
                // ServiceNow Direct Deep-Link to Incident
                const ticketUrl = `${formattedBaseUrl}/nav_to.do?uri=incident.do?sysparm_query=number=${encodeURIComponent(incNumber)}`;

                return (
                  <tr
                    key={t.id || incNumber || idx}
                    className="hover:bg-[#082745]/70 transition-colors group"
                  >
                    {/* Hyperlinked Incident # */}
                    <td className="py-3.5 px-4 font-mono">
                      <a
                        href={ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#eab308] hover:text-[#fde047] font-bold hover:underline transition-colors inline-flex items-center gap-1.5"
                        title={`Open ticket ${incNumber} in ServiceNow (${formattedBaseUrl})`}
                      >
                        <span>{incNumber}</span>
                        <ExternalLink className="w-3 h-3 text-[#eab308]/70 opacity-80 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>
                    </td>

                    {/* Summary Description */}
                    <td className="py-3.5 px-4 text-slate-200">
                      <span className="line-clamp-2 sm:line-clamp-1 max-w-md block" title={description}>
                        {description}
                      </span>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3.5 px-4">
                      {renderPriorityBadge(t.priority)}
                    </td>

                    {/* State Text */}
                    <td className="py-3.5 px-4">
                      {renderStateText(t.state)}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {category}
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {assignee}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No tickets found matching <span className="text-white font-medium">"{searchTerm}"</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
