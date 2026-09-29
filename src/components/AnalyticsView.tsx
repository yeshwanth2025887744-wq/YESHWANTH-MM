import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Clock,
  Camera,
  Activity,
  CheckCircle2,
  Users,
  Download,
  FileText,
  FileSpreadsheet,
  Check,
  Eye,
  Sliders,
  Filter,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { AccessEventLog, BookingWindow } from '../types/ring.ts';
import { EnergyAnalyticsSection } from './EnergyAnalyticsSection.tsx';

interface AnalyticsViewProps {
  events: AccessEventLog[];
  bookingWindows: BookingWindow[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ events, bookingWindows }) => {
  const [activeSection, setActiveSection] = useState<'all' | 'energy' | 'audit'>('all');
  const [exportFilter, setExportFilter] = useState<'all' | 'doorbell_ring' | 'motion_zone' | 'access'>('all');
  const [includeSnapshots, setIncludeSnapshots] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSuccessToast, setExportSuccessToast] = useState<string | null>(null);

  // Hourly distribution data (24h simulation)
  const hourlyActivity = [
    { hour: '12 AM', events: 0, motion: false },
    { hour: '02 AM', events: 0, motion: false },
    { hour: '04 AM', events: 0, motion: false },
    { hour: '06 AM', events: 1, motion: true },
    { hour: '08 AM', events: 5, motion: true },
    { hour: '10 AM', events: 4, motion: true },
    { hour: '12 PM', events: 8, motion: true },
    { hour: '02 PM', events: 6, motion: true },
    { hour: '04 PM', events: 7, motion: true },
    { hour: '06 PM', events: 3, motion: true },
    { hour: '08 PM', events: 2, motion: true },
    { hour: '10 PM', events: 1, motion: false },
  ];

  const getFilteredEvents = () => {
    return events.filter((evt) => {
      if (exportFilter === 'all') return true;
      if (exportFilter === 'doorbell_ring') return evt.eventType === 'doorbell_ring';
      if (exportFilter === 'motion_zone') return evt.eventType === 'motion_zone';
      if (exportFilter === 'access') return evt.eventType === 'pin_unlock' || evt.eventType === 'remote_unlock';
      return true;
    });
  };

  const notifySuccess = (filename: string, count: number) => {
    setExportSuccessToast(`Export Complete: ${count} events saved to ${filename}`);
    setTimeout(() => setExportSuccessToast(null), 4000);
  };

  // Export as JSON
  const handleExportJSON = () => {
    const dataToExport = getFilteredEvents().map((e) => {
      const baseObj: any = {
        eventId: e.id,
        timestamp: e.timestamp,
        deviceName: e.deviceName,
        deviceId: e.deviceId,
        eventType: e.eventType,
        actor: e.actor,
        status: e.status,
        aiSummary: e.aiSummary || null,
        details: e.details || null,
      };
      if (includeSnapshots) {
        baseObj.snapshotUrl = e.snapshotUrl || null;
      }
      return baseObj;
    });

    const exportPayload = {
      exportMetadata: {
        system: 'Ring Pulse Ecosystem',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        totalEvents: dataToExport.length,
        filterApplied: exportFilter,
        snapshotsIncluded: includeSnapshots,
      },
      events: dataToExport,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ring_pulse_event_history_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notifySuccess(filename, dataToExport.length);
    setIsExportModalOpen(false);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const dataToExport = getFilteredEvents();
    const headers = [
      'Event ID',
      'Timestamp',
      'Device Name',
      'Device ID',
      'Event Type',
      'Actor / Visitor',
      'Status',
      'AI Summary / Vision Caption',
      'Details',
      ...(includeSnapshots ? ['Snapshot URL'] : []),
    ];

    const escapeCsv = (str: string | undefined | null) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = dataToExport.map((e) => {
      const row = [
        escapeCsv(e.id),
        escapeCsv(e.timestamp),
        escapeCsv(e.deviceName),
        escapeCsv(e.deviceId),
        escapeCsv(e.eventType),
        escapeCsv(e.actor),
        escapeCsv(e.status),
        escapeCsv(e.aiSummary || ''),
        escapeCsv(e.details || ''),
      ];
      if (includeSnapshots) {
        row.push(escapeCsv(e.snapshotUrl || ''));
      }
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ring_pulse_event_history_${dateStr}.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notifySuccess(filename, dataToExport.length);
    setIsExportModalOpen(false);
  };

  const filteredEventsForExport = getFilteredEvents();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {exportSuccessToast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 border border-emerald-400 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{exportSuccessToast}</span>
        </div>
      )}

      {/* Top Banner with Export Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Ring Ecosystem Analytics &amp; Audit Logs</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Telemetry metrics, hourly motion density histograms, and downloadable post-event analysis records.
          </p>
        </div>

        {/* Primary Export Action Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Options</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
            title="Download CSV table of event logs and snapshot references"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
            title="Download full JSON schema with metadata and snapshot URLs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Analytics Sub-Nav Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'all'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>All Telemetry &amp; Energy</span>
        </button>

        <button
          onClick={() => setActiveSection('energy')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'energy'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-emerald-400'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>D3 Energy &amp; Cost Savings</span>
          <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.2 rounded font-mono">-62%</span>
        </button>

        <button
          onClick={() => setActiveSection('audit')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeSection === 'audit'
              ? 'bg-sky-950 text-sky-300 border border-sky-800 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-sky-400'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span>Event Audit Logs ({events.length})</span>
        </button>
      </div>

      {/* D3 Energy & Smart Automation Cost Savings Section */}
      {(activeSection === 'all' || activeSection === 'energy') && (
        <EnergyAnalyticsSection />
      )}

      {/* KPI Stat Cards & Event Logs */}
      {(activeSection === 'all' || activeSection === 'audit') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-1">
          <div className="text-xs text-slate-400">Total Ingress Events</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">{events.length} Events</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Ready for Post-Event Export</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-1">
          <div className="text-xs text-slate-400">Snapshots Linked</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {events.filter((e) => e.snapshotUrl).length} Snapshots
          </div>
          <div className="text-xs text-sky-400 mt-1">High-Definition Camera Proof</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-1">
          <div className="text-xs text-slate-400">Temporary PIN Utilization</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">94.2%</div>
          <div className="text-xs text-sky-400 mt-1">3 Completed Scheduled Drops</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-1">
          <div className="text-xs text-slate-400">Caretaking Routine Index</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">98 / 100</div>
          <div className="text-xs text-slate-400 mt-1">Zero Wandering Anomalies</div>
        </div>
      </div>

      {/* 24-Hour Motion Activity Histogram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              24-Hour Motion Density Histogram
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly sensor volume verifying healthy daytime activity peaks and peaceful nighttime quiet periods.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">PIR Radar + Optical Triggers</span>
        </div>

        <div className="pt-6 pb-2">
          <div className="h-40 flex items-end justify-between gap-2 border-b border-slate-800 pb-2">
            {hourlyActivity.map((item, idx) => {
              const heightPct = Math.max(8, (item.events / 8) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.events}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      item.events > 5
                        ? 'bg-sky-500 group-hover:bg-sky-400'
                        : item.events > 0
                        ? 'bg-sky-600/60 group-hover:bg-sky-500'
                        : 'bg-slate-800/60'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 font-mono tracking-tighter whitespace-nowrap mt-1">
                    {item.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit Log Table with Direct Snapshot References & Download Triggers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Event Audit Log &amp; Snapshot Evidence</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All events include camera snapshot evidence, timestamps, and AI vision summaries ready for export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{events.length} Recorded Entries</span>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Quick CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="pb-2.5 font-medium">Snapshot</th>
                <th className="pb-2.5 font-medium">Timestamp</th>
                <th className="pb-2.5 font-medium">Device &amp; Event</th>
                <th className="pb-2.5 font-medium">Actor / Visitor</th>
                <th className="pb-2.5 font-medium">AI Vision Summary</th>
                <th className="pb-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-2.5">
                    {evt.snapshotUrl ? (
                      <div className="w-12 h-9 rounded bg-black overflow-hidden border border-slate-800">
                        <img
                          src={evt.snapshotUrl}
                          alt="Snapshot"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px]">No image</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-300 font-semibold">{evt.timestamp}</td>
                  <td className="py-2.5">
                    <div className="text-white font-sans font-medium">{evt.deviceName}</div>
                    <div className="text-slate-400 text-[11px] capitalize">{evt.eventType.replace('_', ' ')}</div>
                  </td>
                  <td className="py-2.5 text-slate-300 font-sans">{evt.actor}</td>
                  <td className="py-2.5 text-slate-400 font-sans max-w-xs truncate">
                    {evt.aiSummary || 'Event recorded nominally.'}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        evt.status === 'granted' || evt.status === 'normal'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Code Lifecycle & Booking Schedule Verification Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Access Code Lifecycle &amp; Delivery Verification
          </h2>
          <span className="text-xs text-slate-400 font-mono">{bookingWindows.length} Tracked Bookings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="pb-2.5 font-medium">Provider / Schedule</th>
                <th className="pb-2.5 font-medium">Recipient</th>
                <th className="pb-2.5 font-medium">Window Hours</th>
                <th className="pb-2.5 font-medium">PIN Code</th>
                <th className="pb-2.5 font-medium">Door Linked</th>
                <th className="pb-2.5 font-medium text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
              {bookingWindows.map((bw) => (
                <tr key={bw.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 font-semibold text-white">{bw.title}</td>
                  <td className="py-3 text-slate-300 font-sans">{bw.serviceRecipient}</td>
                  <td className="py-3 text-slate-400">{bw.startWindow} - {bw.endWindow}</td>
                  <td className="py-3 text-sky-300 font-bold tracking-wider">{bw.pinCode}</td>
                  <td className="py-3 text-slate-400 font-sans">{bw.doorAssigned}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        bw.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : bw.status === 'active'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : 'bg-slate-850 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {bw.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Export Configuration Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-sky-400" />
                <span>Export Event History Configuration</span>
              </h2>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Customize event filters and metadata options before generating your post-event analysis export.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Filter Event Scope:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'all', label: 'All Recorded Events' },
                    { id: 'doorbell_ring', label: 'Doorbell Rings (Ding)' },
                    { id: 'motion_zone', label: 'Motion Zone Stream' },
                    { id: 'access', label: 'Access & Lock Events' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setExportFilter(f.id as any)}
                      className={`p-2 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                        exportFilter === f.id
                          ? 'bg-sky-950 border-sky-500 text-sky-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-200">Include Snapshot Image References</div>
                  <div className="text-[11px] text-slate-500">Embed camera image URLs for visual audit</div>
                </div>
                <input
                  type="checkbox"
                  checked={includeSnapshots}
                  onChange={(e) => setIncludeSnapshots(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                Summary: <strong className="text-white">{filteredEventsForExport.length} events</strong> selected for export.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleExportCSV}
                className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
