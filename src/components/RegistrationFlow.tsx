import React, { useState } from "react";
import {
  User,
  Lock,
  Mail,
  Phone,
  Building,
  Key,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Bot,
  Server,
  FileCheck2,
  Sparkles,
} from "lucide-react";

interface RegistrationFlowProps {
  onBackToLogin: () => void;
  onRegistrationSuccess: () => void;
}

export function RegistrationFlow({
  onBackToLogin,
  onRegistrationSuccess,
}: RegistrationFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    organization: "",
    snowUsername: "",
    snowPassword: "",
    snowInstance: "",
    subscription: "Free" as "Free" | "Paid",
    licenseKey: "",
    consent: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.password ||
        !formData.mobileNumber
      ) {
        setError("Please fill in all required fields.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.snowUsername || !formData.snowPassword) {
        setError("Please enter your ServiceNow username and password.");
        return;
      }
      if (formData.subscription === "Paid" && !formData.licenseKey) {
        setError("License key is required for the Paid plan.");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/snow/test-connectivity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snowInstance: formData.snowInstance,
            snowUsername: formData.snowUsername,
            snowPassword: formData.snowPassword,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(
            "Could not connect to ServiceNow. Please verify your instance URL and login.",
          );
          setLoading(false);
          return;
        }
        setStep(3);
      } catch (err) {
        setError("Connection test failed. Please check your network.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      setError(
        "Please check the consent box to proceed.",
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(
          `Account created successfully! Your username is "${data.username}". Redirecting to sign in...`,
        );
        setTimeout(() => {
          onRegistrationSuccess();
        }, 1800);
      } else {
        setError(data.error || "Sign up failed. Please check your inputs.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-blue-marble-bg text-slate-800 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 border border-sky-400/20 shadow-2xl shadow-slate-950/40 rounded-2xl">
          {/* Header & Step Indicator */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>NextGen</span>
                  <span className="bg-gradient-to-r from-sky-600 to-amber-600 bg-clip-text text-transparent italic">
                    Ai
                  </span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">
                    Sign Up
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step {step} of 3 —{" "}
                  {step === 1
                    ? "Your Profile"
                    : step === 2
                      ? "ServiceNow Login"
                      : "Confirm & Finish"}
                </p>
              </div>
            </div>
            <button
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>

          {/* Stepper Progress Tiles */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { num: 1, title: "Profile", icon: User },
              { num: 2, title: "ServiceNow", icon: Server },
              { num: 3, title: "Confirm", icon: FileCheck2 },
            ].map((s) => (
              <div
                key={s.num}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs border ${
                  step >= s.num
                    ? "bg-sky-50 text-sky-700 border-sky-200 font-semibold"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}
              >
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">
                  {s.num}. {s.title}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <form
            onSubmit={
              step === 3
                ? handleSubmit
                : (e) => {
                    e.preventDefault();
                    handleNextStep();
                  }
            }
          >
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                      placeholder="e.g. Sawan"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) =>
                        handleChange("middleName", e.target.value)
                      }
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        handleChange("lastName", e.target.value)
                      }
                      placeholder="e.g. Sinha"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="you@company.com"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobileNumber}
                      onChange={(e) =>
                        handleChange("mobileNumber", e.target.value)
                      }
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        handleChange("password", e.target.value)
                      }
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleChange("confirmPassword", e.target.value)
                      }
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) =>
                      handleChange("organization", e.target.value)
                    }
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  />
                </div>

                {/* Dynamic Username Indicator */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Your assigned username:
                  </span>
                  <code className="text-sky-700 font-mono font-bold tracking-wide">
                    {formData.firstName
                      ? formData.firstName
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "")
                      : "first"}
                    .
                    {formData.lastName
                      ? formData.lastName
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "")
                      : "last"}
                  </code>
                </div>
              </div>
            )}

            {/* STEP 2: ServiceNow Credentials & Subscription */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ServiceNow Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.snowUsername}
                      onChange={(e) =>
                        handleChange("snowUsername", e.target.value)
                      }
                      placeholder="admin.snow"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ServiceNow Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.snowPassword}
                      onChange={(e) =>
                        handleChange("snowPassword", e.target.value)
                      }
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ServiceNow Instance URL
                  </label>
                  <input
                    type="text"
                    value={formData.snowInstance}
                    onChange={(e) =>
                      handleChange("snowInstance", e.target.value)
                    }
                    placeholder="https://dev12345.service-now.com"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Plan *
                  </label>
                  <select
                    value={formData.subscription}
                    onChange={(e) =>
                      handleChange(
                        "subscription",
                        e.target.value as "Free" | "Paid",
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none"
                  >
                    <option value="Free">Free Plan (Standard Access)</option>
                    <option value="Paid">Pro Plan (Priority Support & Advanced AI)</option>
                  </select>
                </div>

                {formData.subscription === "Free" ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                    <strong>Free Plan:</strong> Full incident search and chatbot questions available. No license key required.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        License Key *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.licenseKey}
                        onChange={(e) =>
                          handleChange("licenseKey", e.target.value)
                        }
                        placeholder="SNOW-XXXX-YYYY-ZZZZ"
                        className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-800 text-xs">
                      <strong>Pro Plan Note:</strong> Contact the administrator if you need a license key.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Consent & Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
                  <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2 text-sm">
                    Review Your Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400">Full Name:</span>{" "}
                      {formData.firstName} {formData.middleName}{" "}
                      {formData.lastName}
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>{" "}
                      {formData.email}
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>{" "}
                      {formData.mobileNumber}
                    </div>
                    <div>
                      <span className="text-slate-400">Organization:</span>{" "}
                      {formData.organization || "None"}
                    </div>
                    <div>
                      <span className="text-slate-400">ServiceNow User:</span>{" "}
                      {formData.snowUsername}
                    </div>
                    <div>
                      <span className="text-slate-400">Plan:</span>{" "}
                      <span className="font-semibold text-sky-700">
                        {formData.subscription}
                      </span>
                    </div>
                    {formData.subscription === "Paid" && (
                      <div className="col-span-2">
                        <span className="text-slate-400">License Key:</span>{" "}
                        <code className="text-emerald-600 font-mono">
                          {formData.licenseKey}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => handleChange("consent", e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 bg-white"
                  />
                  <label
                    htmlFor="consent"
                    className="text-xs text-slate-600 leading-relaxed cursor-pointer"
                  >
                    I agree to allow NextGen Ai to store my ServiceNow connection details securely to answer questions and look up tickets.
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs text-center leading-relaxed">
                  If you face any issues while logging in, please contact your administrator.
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev - 1)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/20"
                >
                  <span>{loading ? "Testing Connection..." : "Continue"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-sky-600/20"
                >
                  <span>
                    {loading ? "Creating Account..." : "Create Account"}
                  </span>
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
