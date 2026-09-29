import React, { useState } from 'react';
import { Terminal, Send, Copy, Check, Radio, Code2, Globe } from 'lucide-react';
import { RingDevice, AccessPass, AccessEventLog } from '../types/ring.ts';

interface ApiConsoleViewProps {
  devices: RingDevice[];
  passes: AccessPass[];
  events: AccessEventLog[];
  onTriggerDing: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
}

export const ApiConsoleView: React.FC<ApiConsoleViewProps> = ({
  devices,
  passes,
  events,
  onTriggerDing,
  onToggleLock,
  isLocked,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /devices');
  const [responseJson, setResponseJson] = useState<string>(() =>
    JSON.stringify(
      {
        doorbots: devices.filter((d) => d.kind === 'doorbell'),
        authorized_doorbots: devices.length,
        status: 'online',
        firmware: '3.18.42',
      },
      null,
      2
    )
  );
  const [hasCopied, setHasCopied] = useState(false);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/ring/devices',
      desc: 'Enumerate all connected doorbells, chimes, floodlights, and alarm hubs.',
      handler: () => {
        setResponseJson(JSON.stringify({ status: 200, devices }, null, 2));
      },
    },
    {
      method: 'POST',
      path: '/api/v1/ring/doorbots/ding',
      desc: 'Simulate physical doorbell push button webhook notification.',
      handler: () => {
        onTriggerDing();
        setResponseJson(
          JSON.stringify(
            {
              event: 'ding',
              kind: 'doorbot_ding',
              created_at: new Date().toISOString(),
              device_id: 'dev_doorbell_front',
              motion_analysis: { person_detected: true, confidence: 0.97 },
              doorbot: { id: 98124, description: 'Front Porch Doorbell Pro 2' },
            },
            null,
            2
          )
        );
      },
    },
    {
      method: 'POST',
      path: '/api/v1/ring/locks/toggle',
      desc: 'Remote lock/unlock request sent to Z-Wave / Key by Amazon deadbolt.',
      handler: () => {
        onToggleLock();
        setResponseJson(
          JSON.stringify(
            {
              action: isLocked ? 'unlock' : 'lock',
              status: 'success',
              device_id: 'dev_smart_lock_front',
              new_state: isLocked ? 'unlocked' : 'locked',
              auto_relock_seconds: 60,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          )
        );
      },
    },
    {
      method: 'GET',
      path: '/api/v1/ring/access/passes',
      desc: 'List active digital guest passes, Amazon Key courier PINs, and schedules.',
      handler: () => {
        setResponseJson(JSON.stringify({ count: passes.length, passes }, null, 2));
      },
    },
    {
      method: 'GET',
      path: '/api/v1/ring/history',
      desc: 'Retrieve chronological video events, chimes, and motion zone alerts.',
      handler: () => {
        setResponseJson(JSON.stringify({ count: events.length, events }, null, 2));
      },
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(responseJson);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Ring Developer API &amp; Webhook Studio</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Test Ring Cloud REST endpoints, verify webhook payloads, and simulate hardware API triggers in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>API Gateway: 200 OK</span>
        </div>
      </div>

      {/* Main Studio Grid: Endpoint Catalog (Left) + Interactive Console / JSON Response (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Endpoints */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Ring REST API Endpoints</h2>
          <div className="space-y-2.5">
            {endpoints.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedEndpoint(`${ep.method} ${ep.path}`);
                  ep.handler();
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  selectedEndpoint === `${ep.method} ${ep.path}`
                    ? 'bg-slate-900 border-sky-500 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                      ep.method === 'GET'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-sky-950 text-sky-400 border border-sky-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-200 truncate">{ep.path}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{ep.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Live Terminal Output */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-slate-300">{selectedEndpoint}</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            {/* Code Viewport */}
            <pre className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-4 font-mono text-xs text-sky-200 overflow-x-auto max-h-[28rem] leading-relaxed">
              {responseJson}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Ring Protocol: HTTPS / TLS 1.3</span>
            <span>Content-Type: application/json</span>
          </div>
        </div>
      </div>
    </div>
  );
};
