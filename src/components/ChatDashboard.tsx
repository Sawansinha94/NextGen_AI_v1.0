import React, { useState, useEffect, useRef } from "react";
import { User, ChatSession, Message, UsageStats } from "../types";
import {
  MessageSquare,
  Plus,
  Settings,
  Sun,
  Moon,
  LogOut,
  Send,
  Download,
  FileSpreadsheet,
  FileText,
  Table,
  Sparkles,
  UserCheck,
  Shield,
  ChevronRight,
  BarChart3,
  HelpCircle,
  X,
  History,
  Search,
  RefreshCw,
  Check,
  CheckCircle2,
  Clock,
  Menu,
  Bot,
  Key,
  Layers,
  Activity,
  Cpu,
  SlidersHorizontal,
} from "lucide-react";
import { ChaseBox } from "./ChaseBox";
import { ServiceNowTicketsTable } from "./ServiceNowTicketsTable";

interface ChatDashboardProps {
  user: User;
  onLogout: () => void;
}

interface IncidentRecord {
  id: string;
  number: string;
  short_description: string;
  priority: "P1 - Critical" | "P2 - High" | "P3 - Moderate" | "P4 - Low";
  state: "New" | "In Progress" | "On Hold" | "Resolved" | "Closed";
  category: string;
  assigned_to: string;
  updated_at: string;
}

const SAMPLE_INCIDENTS: IncidentRecord[] = [
  {
    id: "1",
    number: "INC0010924",
    short_description:
      "Core banking payment gateway cross-region latency spike",
    priority: "P1 - Critical",
    state: "In Progress",
    category: "Network & Core",
    assigned_to: "Cloud Operations",
    updated_at: "10 mins ago",
  },
  {
    id: "2",
    number: "INC0010892",
    short_description:
      "LDAP directory synchronization certificate renewal timeout",
    priority: "P2 - High",
    state: "Resolved",
    category: "Identity & Access",
    assigned_to: "ServiceDesk Tier 2",
    updated_at: "2 hours ago",
  },
  {
    id: "3",
    number: "INC0010841",
    short_description:
      "PostgreSQL read-replica replication lag on analytical cluster",
    priority: "P2 - High",
    state: "In Progress",
    category: "Database Services",
    assigned_to: "DBA Infrastructure",
    updated_at: "3 hours ago",
  },
  {
    id: "4",
    number: "INC0010775",
    short_description: "SSO certificate renewal for Okta identity gateway",
    priority: "P3 - Moderate",
    state: "New",
    category: "Security & Governance",
    assigned_to: "SecOps Operations",
    updated_at: "1 day ago",
  },
  {
    id: "5",
    number: "INC0010620",
    short_description:
      "Service Catalog provisioning request for developer cluster",
    priority: "P4 - Low",
    state: "Closed",
    category: "Hardware & Compute",
    assigned_to: "IT Infrastructure Support",
    updated_at: "3 days ago",
  },
];

export function ChatDashboard({ user, onLogout }: ChatDashboardProps) {
  const capitalizedFirstName = user.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : "Executive";
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showOldChatSelector, setShowOldChatSelector] = useState(false);
  const [showSampleTable, setShowSampleTable] = useState(false);
  const [tableFilter, setTableFilter] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState("");
  const [settingsTab, setSettingsTab] = useState<
    "profile" | "usage" | "theme" | "security"
  >("profile");
  const [userState, setUserState] = useState<User>(user);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Security/Service settings state
  const [newPassword, setNewPassword] = useState("");
  const [snowInstance, setSnowInstance] = useState(
    user.snowuser?.snow_instance || "dev.service-now.com",
  );
  const [snowUsername, setSnowUsername] = useState(
    user.snowuser?.snow_username || "",
  );
  const [snowPassword, setSnowPassword] = useState(
    user.snowuser?.snow_password || "",
  );
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalSessions: 0,
    totalMessages: 0,
    totalLogins: 1,
    apiQuotaUsed: "12%",
  });

  const handleUpgrade = async () => {
    if (!newLicenseKey.trim()) {
      alert("Please provide a valid enterprise license key.");
      return;
    }
    setUpgrading(true);
    try {
      const res = await fetch("/api/user/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userState.user_id,
          licenseKey: newLicenseKey.trim(),
          username: userState.username,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserState((prev) => ({
          ...prev,
          subscription: "Paid",
          license_key: data.user.license_key || newLicenseKey.trim(),
        }));
        setShowUpgradeModal(false);
        setNewLicenseKey("");
        setExportNotice("Upgraded to Paid Executive Tier successfully.");
        setTimeout(() => setExportNotice(null), 3500);
      } else {
        alert(data.error || "Upgrade failed.");
      }
    } catch (err: any) {
      alert("Upgrade failed: " + err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userState.user_id,
          newPassword: newPassword || undefined,
          snowUsername,
          snowPassword,
          snowInstance,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserState((prev) => ({
          ...prev,
          snowuser: {
            ...prev.snowuser,
            snow_instance: snowInstance,
            snow_username: snowUsername,
            snow_password: snowPassword,
          },
        }));
        setNewPassword("");
        setExportNotice("ServiceNow credentials and profile updated.");
        setTimeout(() => setExportNotice(null), 3500);
      } else {
        alert(data.error || "Update failed.");
      }
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
    fetchUsageStats();
  }, [user.user_id]);

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.session_id);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showSampleTable]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/sessions/${user.user_id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSessions(data);
        setCurrentSession(data[0]);
      } else {
        handleOpenNewChat();
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const res = await fetch(`/api/user/stats/${user.user_id}`);
      const data = await res.json();
      setUsageStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${sessionId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data?.error || "The chat history response was invalid.");
      }
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenNewChat = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userState.user_id,
          title: "Executive Incident Review",
        }),
      });
      const newSession = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      setShowSampleTable(false);
    } catch (err) {
      console.error("Failed to create new chat session:", err);
    }
  };

  const handleContinueOldChat = (session: ChatSession) => {
    setCurrentSession(session);
    setShowOldChatSelector(false);
    setShowSampleTable(false);
  };

  const handleSendMessage = async (
    e?: React.FormEvent,
    directText?: string,
  ) => {
    if (e) e.preventDefault();
    const textToSend = (directText || inputMessage).trim();
    if (!textToSend || !currentSession) return;

    setInputMessage("");
    setLoadingMessages(true);
    setProcessingTier("Tier 1");

    const tempUserMsg: Message = {
      message_id: "temp-" + Date.now(),
      session_id: currentSession.session_id,
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.session_id,
          role: "user",
          content: textToSend,
          userId: userState.user_id,
          userName: userState.username,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed.");
      }

      const userMessage = data?.userMessage;
      const assistantMessage = data?.assistantMessage;
      if (
        !userMessage ||
        !assistantMessage ||
        typeof userMessage.content !== "string" ||
        typeof assistantMessage.content !== "string"
      ) {
        throw new Error("The API returned an incomplete chat response.");
      }

      const normalizedAssistantMessage: Message = {
        ...assistantMessage,
        tableData: Array.isArray(assistantMessage.tableData)
          ? assistantMessage.tableData
          : [],
      };

      setProcessingTier(normalizedAssistantMessage.tier || "Tier 3");

      if (userMessage && normalizedAssistantMessage) {
        if (
          normalizedAssistantMessage.tableData.length === 0
        ) {
          const lower = textToSend.toLowerCase();
          if (lower.includes("ledger") || lower.includes("all tickets")) {
            setShowSampleTable(true);
          }
        }

        setMessages((prev) => [
          ...prev.filter((m) => m.message_id !== tempUserMsg.message_id),
          userMessage,
          normalizedAssistantMessage,
        ]);

        if (data.sessionTitle) {
          setCurrentSession((prev) =>
            prev ? { ...prev, title: data.sessionTitle } : null,
          );
          setSessions((prev) =>
            prev.map((s) =>
              s.session_id === currentSession.session_id
                ? { ...s, title: data.sessionTitle }
                : s,
            ),
          );
        }
      }
      setLoadingMessages(false);
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage: Message = {
        message_id: "error-" + Date.now(),
        session_id: currentSession.session_id,
        role: "assistant",
        content:
          err instanceof Error
            ? `I could not process that request: ${err.message}`
            : "I could not process that request.",
        created_at: new Date().toISOString(),
        tier: "Error",
      };
      setMessages((prev) => [
        ...prev.filter((m) => m.message_id !== tempUserMsg.message_id),
        tempUserMsg,
        errorMessage,
      ]);
      setLoadingMessages(false);
    }
  };

  const handleExport = (format: "PDF" | "Excel") => {
    setIsExporting(true);
    try {
      if (format === "Excel") {
        const headers = [
          "Message_ID",
          "Session_ID",
          "Role",
          "Timestamp",
          "Content",
        ];
        const rows = messages.map((m) => [
          `"${m.message_id}"`,
          `"${m.session_id}"`,
          `"${m.role}"`,
          `"${new Date(m.created_at).toLocaleString()}"`,
          `"${m.content.replace(/"/g, '""')}"`,
        ]);
        const csvContent =
          "data:text/csv;charset=utf-8," +
          [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `smartai_operations_audit_${currentSession?.session_id.slice(0, 8) || "session"}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportNotice(
          "Executive incident record exported as CSV spreadsheet.",
        );
        setTimeout(() => setExportNotice(null), 3500);
      } else {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Executive Briefing - ${currentSession?.title || "Operations Brief"}</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Newsreader", Georgia, serif; padding: 40px; color: #051C2C; }
                  h1 { color: #051C2C; font-size: 22px; border-bottom: 2px solid #C5A059; padding-bottom: 8px; margin-bottom: 4px; }
                  .meta { font-size: 12px; color: #4A5568; margin-bottom: 24px; font-family: sans-serif; }
                  .message { margin-bottom: 18px; padding: 14px 18px; border-radius: 8px; font-size: 13px; line-height: 1.6; }
                  .user { background: #F4F6F9; border-left: 4px solid #051C2C; margin-left: 32px; font-family: sans-serif; }
                  .assistant { background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 4px solid #C5A059; margin-right: 32px; }
                  .role { font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; color: #64748B; font-family: sans-serif; }
                </style>
              </head>
              <body>
                <h1>NextGen Ai Executive Operations Briefing</h1>
                <div class="meta">
                  <strong>Principal:</strong> ${userState.username} | <strong>Gateway:</strong> ${userState.snowuser?.snow_instance || "dev.service-now.com"} | <strong>Timestamp:</strong> ${new Date().toLocaleString()}
                </div>
                ${messages
                  .map(
                    (m) => `
                  <div class="message ${m.role}">
                    <div class="role">${m.role === "user" ? capitalizedFirstName : "NextGen Ai Intelligence"} • ${new Date(m.created_at).toLocaleTimeString()}</div>
                    <div>${m.content}</div>
                  </div>
                `,
                  )
                  .join("")}
                <script>
                  window.onload = function() { window.print(); }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          setExportNotice("Executive Briefing PDF generated.");
          setTimeout(() => setExportNotice(null), 3500);
        }
      }
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredIncidents = SAMPLE_INCIDENTS.filter(
    (inc) =>
      inc.number.toLowerCase().includes(tableFilter.toLowerCase()) ||
      inc.short_description.toLowerCase().includes(tableFilter.toLowerCase()) ||
      inc.assigned_to.toLowerCase().includes(tableFilter.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans gradient-blue-marble-bg text-slate-100">
      {/* Toast Notice */}
      {exportNotice && (
        <div className="fixed top-5 right-5 z-50 bg-[#071e35] text-sky-300 border border-sky-400/40 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      {isSidebarOpen && (
        <aside className="w-80 flex flex-col border-r border-[#1a436b]/60 shrink-0 transition-colors z-20 bg-[#061c31]/85 backdrop-blur-md">
          {/* Brand / Header */}
          <div className="p-4 border-b border-[#1a436b]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                    <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                      NextGen
                    </span>
                    <span className="bg-gradient-to-r from-[#38bdf8] to-[#C5A059] bg-clip-text text-transparent font-black italic drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                      Ai
                    </span>
                    <span className="text-[10px] font-mono text-sky-400 border border-sky-500/30 px-1 py-0.2 rounded ml-1">
                      v2.4
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-300 font-mono">
                    ServiceNow Connected
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-[#0c2b47] text-slate-400 hover:text-white"
                title={
                  darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-[#0c2b47] text-slate-400 hover:text-white"
                title="Collapse Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 space-y-2.5">
            <button
              onClick={handleOpenNewChat}
              className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>New Chat</span>
            </button>

            <button
              onClick={() => setShowOldChatSelector(true)}
              className="w-full py-2 px-3 text-xs font-medium flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border bg-[#082038] hover:bg-[#0d2e4f] border-[#1a436b] text-slate-200"
            >
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>Chat History</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>Recent Chats</span>
              <span>{sessions.length}</span>
            </div>
            {sessions.map((s) => (
              <div
                key={s.session_id}
                onClick={() => setCurrentSession(s)}
                className={`p-2.5 flex items-center justify-between gap-2 text-xs rounded-lg border transition-all cursor-pointer ${
                  currentSession?.session_id === s.session_id
                    ? "bg-[#0b2b4a] text-white border-sky-400 font-semibold shadow-sm"
                    : "bg-[#071c30] hover:bg-[#0a2540] text-slate-300 border-[#143552]"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              </div>
            ))}
          </div>

          {/* Profile & License Box */}
          <div className="p-3 border-t border-[#1a436b]/60">
            <div className="p-3 rounded-xl border bg-[#082038] border-[#184063]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center font-bold text-xs text-sky-300">
                    {capitalizedFirstName.charAt(0)}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {capitalizedFirstName}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      {userState.subscription} Plan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-1.5 rounded-lg hover:bg-[#0c2b47] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 px-6 border-b border-[#1a436b]/60 flex items-center justify-between shrink-0 z-10 bg-[#061c31]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg border border-[#1a436b] bg-[#09223a] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Open Sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                {currentSession?.title || "NextGen Ai Chat"}
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {userState.subscription} Plan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSampleTable(!showSampleTable)}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-2 rounded-lg transition-all cursor-pointer border ${
                showSampleTable
                  ? "bg-sky-500 text-white border-sky-400"
                  : "bg-[#09223a] hover:bg-[#0e3156] border-[#1a436b] text-slate-200"
              }`}
            >
              <Table className="w-3.5 h-3.5 text-sky-400" />
              <span>{showSampleTable ? "Hide Tickets" : "Tickets"}</span>
            </button>

            <button
              onClick={() => handleExport("PDF")}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-lg border border-[#1a436b] bg-[#09223a] hover:bg-[#0e3156] text-slate-200 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => handleExport("Excel")}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-lg border border-[#1a436b] bg-[#09223a] hover:bg-[#0e3156] text-slate-200 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Chat Messages & Work Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Chatbot Greeting Box */}
          <div className="max-w-4xl mx-auto">
            <div className="p-5 sm:p-6 rounded-2xl border border-sky-500/20 bg-[#072038]/85 backdrop-blur-md text-white shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-sky-500/25">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-sky-400">
                      ServiceNow Assistant
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                    Hi {capitalizedFirstName}! How can I help you today?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                    I'm connected to your ServiceNow instance{" "}
                    <code className="text-sky-300 font-mono px-1.5 py-0.5 rounded bg-[#051729] border border-sky-500/30">
                      {userState.snowuser?.snow_instance ||
                        "dev.service-now.com"}
                    </code>
                    . Ask me to find tickets, check incident statuses, or answer
                    IT questions.
                  </p>
                </div>
              </div>

              {/* Instant Questions */}
              <div className="mt-4 pt-3.5 border-t border-sky-500/20 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300 font-medium mr-1">
                  Try asking:
                </span>
                {[
                  {
                    label: "Show open tickets",
                    query: "Show active incident table",
                  },
                  {
                    label: "High priority tickets",
                    query: "Show high priority server tickets",
                  },
                  {
                    label: "Service SLA report",
                    query: "Display ServiceNow SLA report",
                  },
                  {
                    label: "Recently resolved tickets",
                    query: "Incident resolution status overview",
                  },
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, btn.query)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#09223a] hover:bg-[#0e3156] text-sky-100 border border-sky-400/30 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Incident Ledger Panel */}
          {showSampleTable && (
            <div className="max-w-4xl mx-auto">
              <ServiceNowTicketsTable
                tickets={SAMPLE_INCIDENTS}
                snowInstance={
                  userState.snowuser?.snow_instance || "dev.service-now.com"
                }
              />
            </div>
          )}

          {/* Conversation History Stream with Chasing Light on Bot Boxes */}
          {messages.map((m) => (
            <div
              key={m.message_id}
              className={`flex gap-3.5 max-w-4xl mx-auto ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-[#051C2C] flex items-center justify-center text-[#C5A059] border border-[#C5A059]/40 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {m.role === "user" ? (
                <div className="p-4 bg-[#092640] border border-[#16436b] text-white rounded-xl shadow-lg max-w-2xl text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <span className="block text-[10px] text-slate-400 mt-2 font-mono text-right">
                    {new Date(m.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <div
                  className={`w-full ${m.tableData && m.tableData.length > 0 ? "max-w-4xl" : "max-w-3xl"}`}
                >
                  <div className="bg-[#072038]/90 p-5 rounded-2xl border border-sky-500/20 text-slate-200 text-sm leading-relaxed shadow-md backdrop-blur-md">
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#184063] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tracking-tight text-sm text-white flex items-center">
                          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                            NextGen
                          </span>
                          <span className="bg-gradient-to-r from-[#38bdf8] to-[#C5A059] bg-clip-text text-transparent font-black italic drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] ml-1">
                            Ai
                          </span>
                        </span>
                        <span className="text-[11px] text-sky-400 font-medium tracking-tight">
                          AI Assistant
                        </span>
                        {m.tier && (
                          <span className="px-2 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-300 font-medium tracking-wide uppercase">
                            {m.tier}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {/* Render Tabular Data In Image Table Format With Hyperlink */}
                    {m.tableData && m.tableData.length > 0 && (
                      <ServiceNowTicketsTable
                        tickets={m.tableData}
                        snowInstance={
                          userState.snowuser?.snow_instance ||
                          "dev.service-now.com"
                        }
                        className="mt-4"
                      />
                    )}
                  </div>
                </div>
              )}

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-bold text-xs shrink-0 mt-1">
                  {capitalizedFirstName.charAt(0)}
                </div>
              )}
            </div>
          ))}

          {/* Pending Response Indicator */}
          {loadingMessages && (
            <div className="flex gap-3.5 max-w-4xl mx-auto justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-[#072038] border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 bg-[#072038]/90 border border-sky-500/30 rounded-xl text-slate-300 text-xs flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span className="text-slate-200">
                  NextGen Ai is processing in {processingTier || "Tier 1"}...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Area with clean Chasing Light on input box when active */}
        <div className="p-4 border-t border-[#1a436b]/60 shrink-0 bg-[#061c31]/85 backdrop-blur-md">
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="max-w-4xl mx-auto flex items-center gap-3"
          >
            <ChaseBox
              variant="input"
              active={loadingMessages}
              className="flex-1"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  loadingMessages
                    ? "NextGen Ai is thinking..."
                    : "Ask NextGen Ai a question or search for tickets..."
                }
                disabled={loadingMessages}
                className="w-full px-4 py-3.5 bg-[#09223a] text-white placeholder-slate-400 text-sm border border-[#1a436b] focus:outline-none focus:border-sky-400 rounded-xl disabled:opacity-60"
              />
            </ChaseBox>

            <button
              type="submit"
              disabled={!inputMessage.trim() || loadingMessages}
              className="py-3.5 px-5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 rounded-xl shrink-0"
            >
              <span>{loadingMessages ? "Thinking..." : "Send"}</span>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[11px] text-slate-400">
              NextGen Ai connects to ServiceNow to answer IT questions and
              search tickets.
            </span>
          </div>
        </div>
      </main>

      {/* CONTINUE OLD CHAT MODAL */}
      {showOldChatSelector && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-[#08223b] p-6 rounded-2xl border border-sky-500/20 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#184063] mb-4">
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-400" />
                  <span>Chat History</span>
                </h3>
                <button
                  onClick={() => setShowOldChatSelector(false)}
                  className="p-1 rounded hover:bg-[#0c2b47] text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sessions.map((s) => (
                  <div
                    key={s.session_id}
                    onClick={() => handleContinueOldChat(s)}
                    className={`p-3 rounded-xl bg-[#061c31] hover:bg-[#0c2e4f] border cursor-pointer flex items-center justify-between transition-colors ${
                      currentSession?.session_id === s.session_id
                        ? "border-sky-400 shadow-sm"
                        : "border-[#184063]"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        {s.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sky-400" />
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#184063] flex justify-end">
                <button
                  onClick={() => setShowOldChatSelector(false)}
                  className="py-2 px-4 bg-[#09223a] hover:bg-[#11314d] text-slate-300 border border-[#184063] rounded-lg text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-[#08223b] border border-sky-500/20 shadow-2xl rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#184063] mb-4">
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                  <span>Settings</span>
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded hover:bg-[#0c2b47] text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#184063] gap-4 mb-4 text-xs font-semibold">
                {[
                  { id: "profile", label: "Profile" },
                  { id: "usage", label: "Usage" },
                  { id: "theme", label: "Appearance" },
                  { id: "security", label: "Security" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id as any)}
                    className={`pb-2 transition-colors cursor-pointer ${
                      settingsTab === tab.id
                        ? "border-b-2 border-[#C5A059] text-[#C5A059]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {settingsTab === "profile" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-[#051C2C] border border-[#184063] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#071F33] border border-[#C5A059]/40 flex items-center justify-center font-editorial font-bold text-sm text-[#C5A059]">
                      {capitalizedFirstName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">
                        {capitalizedFirstName} ({userState.username})
                      </h4>
                      <p className="text-slate-400 text-[11px]">
                        {userState.email || "executive@enterprise.com"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between p-2.5 rounded-lg bg-[#051C2C] border border-[#184063]">
                      <span className="text-slate-400">User Identifier:</span>
                      <code className="text-[#C5A059] font-mono">
                        {userState.user_id}
                      </code>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-[#051C2C] border border-[#184063]">
                      <span className="text-slate-400">Subscription Tier:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#C5A059]">
                          {userState.subscription}
                        </span>
                        {userState.subscription === "Free" && (
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="px-2 py-0.5 bg-[#C5A059] text-[#051C2C] font-semibold text-[10px] rounded cursor-pointer"
                          >
                            Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-lg bg-[#051C2C] border border-[#184063]">
                      <span className="text-slate-400">
                        ServiceNow Instance:
                      </span>
                      <span className="font-mono text-white">
                        {userState.snowuser?.snow_instance ||
                          "dev.service-now.com"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "usage" && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3.5 rounded-xl bg-[#051C2C] border border-[#184063]">
                      <span className="text-slate-400 block text-[10px]">
                        Chat Portfolios
                      </span>
                      <span className="text-lg font-bold text-white">
                        {usageStats.totalSessions}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#051C2C] border border-[#184063]">
                      <span className="text-slate-400 block text-[10px]">
                        Messages Processed
                      </span>
                      <span className="text-lg font-bold text-[#C5A059]">
                        {usageStats.totalMessages}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#051C2C] border border-[#184063] text-[11px] text-slate-300">
                    All incident retrievals and chat turns are indexed into
                    PostgreSQL audit tables.
                  </div>
                </div>
              )}

              {settingsTab === "theme" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      !darkMode
                        ? "border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]"
                        : "border-[#184063] bg-[#051C2C] text-slate-400"
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="font-semibold">Crisp Advisory Light</span>
                  </button>
                  <button
                    onClick={() => setDarkMode(true)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      darkMode
                        ? "border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]"
                        : "border-[#184063] bg-[#051C2C] text-slate-400"
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="font-semibold">
                      Executive Midnight Dark
                    </span>
                  </button>
                </div>
              )}

              {settingsTab === "security" && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-mono uppercase">
                      Change Passphrase
                    </label>
                    <input
                      type="password"
                      placeholder="New Passphrase"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#051C2C] border border-[#184063] text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-mono uppercase">
                      ServiceNow Instance URL
                    </label>
                    <input
                      type="text"
                      value={snowInstance}
                      onChange={(e) => setSnowInstance(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#051C2C] border border-[#184063] text-white focus:outline-none focus:border-[#C5A059] font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Service Username"
                      value={snowUsername}
                      onChange={(e) => setSnowUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#051C2C] border border-[#184063] text-white focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      type="password"
                      placeholder="Service Password"
                      value={snowPassword}
                      onChange={(e) => setSnowPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#051C2C] border border-[#184063] text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <button
                    onClick={handleSaveSecurity}
                    disabled={savingProfile}
                    className="w-full py-2.5 rounded-lg bg-[#C5A059] text-[#051C2C] font-semibold text-xs hover:brightness-110 cursor-pointer mt-2"
                  >
                    {savingProfile
                      ? "Updating Gateway..."
                      : "Save Configuration"}
                  </button>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-[#184063] flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="py-2 px-4 bg-[#051C2C] hover:bg-[#11314d] text-slate-300 border border-[#184063] rounded-lg text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="bg-[#092237] p-6 rounded-2xl border border-[#163857] shadow-2xl space-y-4">
              <h3 className="font-editorial font-semibold text-base text-white">
                Upgrade to Executive Paid Tier
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your assigned enterprise license key to unlock priority
                SLA and Dual-Tier AI Reasoning.
              </p>
              <input
                type="text"
                placeholder="SNOW-XXXX-YYYY-ZZZZ"
                value={newLicenseKey}
                onChange={(e) => setNewLicenseKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#051C2C] border border-[#184063] text-white text-xs font-mono focus:outline-none focus:border-[#C5A059]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="px-4 py-2 rounded-lg bg-[#C5A059] text-[#051C2C] font-semibold text-xs hover:brightness-110 cursor-pointer"
                >
                  {upgrading ? "Validating Key..." : "Authorize Upgrade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
