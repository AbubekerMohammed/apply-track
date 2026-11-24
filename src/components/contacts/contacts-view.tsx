"use client";

import * as React from "react";
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  Mail,
  Send,
  Building2,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { ContactModal, ContactData } from "./contact-modal";
import { LogOutreachModal } from "./log-outreach-modal";

interface ContactsViewProps {
  initialContacts: ContactData[];
  userEmail?: string | null;
}

export function ContactsView({ initialContacts, userEmail }: ContactsViewProps) {
  const [contacts, setContacts] = React.useState<ContactData[]>(initialContacts);
  const [search, setSearch] = React.useState("");
  const [relationshipFilter, setRelationshipFilter] = React.useState("all");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<ContactData | null>(null);

  const [outreachModalOpen, setOutreachModalOpen] = React.useState(false);
  const [targetContactForOutreach, setTargetContactForOutreach] = React.useState<ContactData | null>(null);

  async function refreshContacts() {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error("Failed to refresh contacts", err);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete contact", err);
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      (c.role && c.role.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const matchesRelationship =
      relationshipFilter === "all" || c.relationship === relationshipFilter;

    return matchesSearch && matchesRelationship;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Contacts & Outreach</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">
              {contacts.length} Contacts
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {userEmail ? `Scoped to ${userEmail} • ` : ""}
            Log your networking outreach, prevent duplicate messaging, and auto-schedule 7-day follow-ups
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setTargetContactForOutreach(null);
              setOutreachModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Log Outreach</span>
          </button>
          <button
            onClick={() => {
              setEditingContact(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by contact name, company, role, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={relationshipFilter}
          onChange={(e) => setRelationshipFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
        >
          <option value="all">All Relationships</option>
          <option value="Colleague">Colleague / Ex-Coworker</option>
          <option value="Recruiter">Recruiter</option>
          <option value="Alumni">Alumni</option>
          <option value="Hiring Manager">Hiring Manager</option>
          <option value="Friend">Friend</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full py-12 text-center p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No contacts found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add friends, coworkers, or recruiters and log your outreach to track replies and follow-ups.
            </p>
            <button
              onClick={() => {
                setEditingContact(null);
                setModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Contact</span>
            </button>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const outreachCount = contact.outreaches?.length || 0;
            const latestOutreach = outreachCount > 0 ? contact.outreaches![0] : null;

            return (
              <div
                key={contact.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Contact Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {contact.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {contact.role ? `${contact.role} at ` : ""}
                        <strong className="text-slate-700 dark:text-slate-300">{contact.company}</strong>
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {contact.relationship || "Colleague"}
                    </span>
                  </div>

                  {/* Notes snippet */}
                  {contact.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2">
                      {contact.notes}
                    </p>
                  )}

                  {/* Outreach History Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        <span>Outreach Activity</span>
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          outreachCount > 0
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        {outreachCount} Logged
                      </span>
                    </div>

                    {latestOutreach ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Via {latestOutreach.channel}
                          </span>
                          <span className="text-slate-400">
                            {new Date(latestOutreach.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span
                            className={`px-1.5 py-0.5 rounded font-medium ${
                              latestOutreach.response === "Referral Secured"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : latestOutreach.response === "Replied"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            Status: {latestOutreach.response || "Pending"}
                          </span>
                          {latestOutreach.followUpDate && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>
                                Follow-up:{" "}
                                {new Date(latestOutreach.followUpDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic py-1">
                        No outreach logged yet. Click &quot;Log Outreach&quot; below.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom / Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-4">
                  {/* External links */}
                  <div className="flex items-center gap-2">
                    {contact.linkedInUrl && (
                      <a
                        href={contact.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                        title="Open LinkedIn Profile in new tab"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setTargetContactForOutreach(contact);
                        setOutreachModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Log Outreach</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id, contact.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingContact(null);
        }}
        contact={editingContact}
        onSaved={refreshContacts}
      />

      {/* Log Outreach Modal */}
      <LogOutreachModal
        isOpen={outreachModalOpen}
        onClose={() => {
          setOutreachModalOpen(false);
          setTargetContactForOutreach(null);
        }}
        preselectedContact={targetContactForOutreach}
        onSaved={refreshContacts}
      />
    </div>
  );
}
