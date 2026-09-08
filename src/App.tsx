/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useState } from "react";
import { User } from "./types";
import { LoginScreen } from "./components/LoginScreen";
import { RegistrationFlow } from "./components/RegistrationFlow";
import { ChatDashboard } from "./components/ChatDashboard";

class AppErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  private readonly appChildren: React.ReactNode;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.appChildren = props.children;
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application render error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-xl rounded-xl border border-red-400/40 bg-slate-900 p-6 shadow-xl">
            <h1 className="text-lg font-semibold text-red-300">
              The chat could not render this response
            </h1>
            <p className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.appChildren;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<"login" | "register" | "chat">(
    "login",
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView("chat");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("login");
  };

  return (
    <AppErrorBoundary>
      {currentView === "login" && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setCurrentView("register")}
        />
      )}

      {currentView === "register" && (
        <RegistrationFlow
          onBackToLogin={() => setCurrentView("login")}
          onRegistrationSuccess={() => setCurrentView("login")}
        />
      )}

      {currentView === "chat" && currentUser && (
        <ChatDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </AppErrorBoundary>
  );
}
