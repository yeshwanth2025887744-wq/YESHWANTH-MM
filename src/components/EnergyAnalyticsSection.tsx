import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Zap,
  TrendingDown,
  DollarSign,
  Leaf,
  Sun,
  BatteryCharging,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface EnergyDataPoint {
  hour: string;
  baselineWatts: number;
  optimizedWatts: number;
  savingsWatts: number;
  solarWatts: number;
}

const HOURLY_ENERGY_DATA: EnergyDataPoint[] = [
  { hour: '12 AM', baselineWatts: 78, optimizedWatts: 24, savingsWatts: 54, solarWatts: 0 },
  { hour: '02 AM', baselineWatts: 75, optimizedWatts: 22, savingsWatts: 53, solarWatts: 0 },
  { hour: '04 AM', baselineWatts: 72, optimizedWatts: 22, savingsWatts: 50, solarWatts: 0 },
  { hour: '06 AM', baselineWatts: 110, optimizedWatts: 42, savingsWatts: 68, solarWatts: 15 },
  { hour: '08 AM', baselineWatts: 145, optimizedWatts: 58, savingsWatts: 87, solarWatts: 45 },
  { hour: '10 AM', baselineWatts: 160, optimizedWatts: 62, savingsWatts: 98, solarWatts: 85 },
  { hour: '12 PM', baselineWatts: 180, optimizedWatts: 68, savingsWatts: 112, solarWatts: 110 },
  { hour: '02 PM', baselineWatts: 175, optimizedWatts: 65, savingsWatts: 110, solarWatts: 105 },
  { hour: '04 PM', baselineWatts: 190, optimizedWatts: 72, savingsWatts: 118, solarWatts: 70 },
  { hour: '06 PM', baselineWatts: 230, optimizedWatts: 95, savingsWatts: 135, solarWatts: 20 },
  { hour: '08 PM', baselineWatts: 260, optimizedWatts: 110, savingsWatts: 150, solarWatts: 0 },
  { hour: '10 PM', baselineWatts: 180, optimizedWatts: 45, savingsWatts: 135, solarWatts: 0 },
];

const DEVICE_BREAKDOWN = [
  { device: 'Floodlight Cam Wired Pro', baselinePct: 46, optimizedPct: 22, color: '#f59e0b' },
  { device: 'Ring Video Doorbell Pro 2', baselinePct: 24, optimizedPct: 18, color: '#0ea5e9' },
  { device: 'Ring Alarm Base Station Pro', baselinePct: 18, optimizedPct: 12, color: '#10b981' },
  { device: 'Smart Deadbolts & Sensors', baselinePct: 12, optimizedPct: 6, color: '#8b5cf6' },
];

export const EnergyAnalyticsSection: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const donutContainerRef = useRef<HTMLDivElement>(null);
  const [activeHoverData, setActiveHoverData] = useState<EnergyDataPoint | null>(null);
  const [selectedKwhCost, setSelectedKwhCost] = useState(0.28); // $0.28 / kWh average

  // Calculate monthly stats
  const totalDailyWattsSaved = HOURLY_ENERGY_DATA.reduce((acc, d) => acc + d.savingsWatts * 2, 0); // approx 24h
  const dailyKwhSaved = totalDailyWattsSaved / 1000;
  const monthlyKwhSaved = dailyKwhSaved * 30;
  const monthlyDollarSavings = monthlyKwhSaved * selectedKwhCost;
  const monthlyCo2SavedKg = monthlyKwhSaved * 0.385; // ~0.385 kg CO2 per kWh

  // D3 Power Consumption Line & Area Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear existing SVG
    d3.select(chartContainerRef.current).select('svg').remove();

    const containerWidth = chartContainerRef.current.clientWidth || 600;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 35, left: 45 };
    const width = containerWidth - margin.left - margin.right;

    const svg = d3
      .select(chartContainerRef.current)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('class', 'overflow-visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradients
    const defs = svg.append('defs');

    // Baseline Gradient (Rose/Amber)
    const baselineGradient = defs
      .append('linearGradient')
      .attr('id', 'baseline-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    baselineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.25);
    baselineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.0);

    // Optimized Gradient (Emerald/Sky)
    const optimizedGradient = defs
      .append('linearGradient')
      .attr('id', 'optimized-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    optimizedGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    optimizedGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Scales
    const xScale = d3
      .scalePoint<string>()
      .domain(HOURLY_ENERGY_DATA.map((d) => d.hour))
      .range([0, width])
      .padding(0.2);

    const maxY = Math.max(...HOURLY_ENERGY_DATA.map((d) => d.baselineWatts)) + 30;
    const yScale = d3.scaleLinear().domain([0, maxY]).range([height - margin.top - margin.bottom, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
      );

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickSize(4))
      .call((axis) => axis.select('.domain').attr('stroke', '#334155'))
      .call((axis) => axis.selectAll('.tick line').attr('stroke', '#334155'))
      .call((axis) =>
        axis.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace')
      );

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}W`))
      .call((axis) => axis.select('.domain').remove())
      .call((axis) => axis.selectAll('.tick line').remove())
      .call((axis) =>
        axis.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '10px').attr('font-family', 'monospace')
      );

    // Area & Line Generators
    const areaBaseline = d3
      .area<EnergyDataPoint>()
      .x((d) => xScale(d.hour) || 0)
      .y0(yScale(0))
      .y1((d) => yScale(d.baselineWatts))
      .curve(d3.curveMonotoneX);

    const areaOptimized = d3
      .area<EnergyDataPoint>()
      .x((d) => xScale(d.hour) || 0)
      .y0(yScale(0))
      .y1((d) => yScale(d.optimizedWatts))
      .curve(d3.curveMonotoneX);

    const lineBaseline = d3
      .line<EnergyDataPoint>()
      .x((d) => xScale(d.hour) || 0)
      .y((d) => yScale(d.baselineWatts))
      .curve(d3.curveMonotoneX);

    const lineOptimized = d3
      .line<EnergyDataPoint>()
      .x((d) => xScale(d.hour) || 0)
      .y((d) => yScale(d.optimizedWatts))
      .curve(d3.curveMonotoneX);

    // Draw Areas
    g.append('path').datum(HOURLY_ENERGY_DATA).attr('fill', 'url(#baseline-grad)').attr('d', areaBaseline);
    g.append('path').datum(HOURLY_ENERGY_DATA).attr('fill', 'url(#optimized-grad)').attr('d', areaOptimized);

    // Draw Lines
    g.append('path')
      .datum(HOURLY_ENERGY_DATA)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 4')
      .attr('d', lineBaseline);

    g.append('path')
      .datum(HOURLY_ENERGY_DATA)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('d', lineOptimized);

    // Interactive Points & Hover
    const focusGroup = g.append('g').style('display', 'none');

    const verticalLine = focusGroup
      .append('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3')
      .attr('y1', 0)
      .attr('y2', height - margin.top - margin.bottom);

    const baselineCircle = focusGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#f43f5e')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    const optimizedCircle = focusGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Overlay for mouse events
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height - margin.top - margin.bottom)
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('fill', 'transparent')
      .on('mouseover', () => focusGroup.style('display', null))
      .on('mouseout', () => {
        focusGroup.style('display', 'none');
        setActiveHoverData(null);
      })
      .on('mousemove', (event) => {
        const [xPos] = d3.pointer(event);
        const eachBand = width / (HOURLY_ENERGY_DATA.length - 1);
        const index = Math.round(xPos / eachBand);
        const clampedIndex = Math.max(0, Math.min(HOURLY_ENERGY_DATA.length - 1, index));
        const dataPoint = HOURLY_ENERGY_DATA[clampedIndex];

        if (dataPoint) {
          const cx = xScale(dataPoint.hour) || 0;
          verticalLine.attr('x1', cx).attr('x2', cx);
          baselineCircle.attr('cx', cx).attr('cy', yScale(dataPoint.baselineWatts));
          optimizedCircle.attr('cx', cx).attr('cy', yScale(dataPoint.optimizedWatts));
          setActiveHoverData(dataPoint);
        }
      });
  }, []);

  // D3 Donut Chart for Device Energy Breakdown
  useEffect(() => {
    if (!donutContainerRef.current) return;

    d3.select(donutContainerRef.current).select('svg').remove();

    const size = 180;
    const radius = size / 2;
    const innerRadius = radius - 26;

    const svg = d3
      .select(donutContainerRef.current)
      .append('svg')
      .attr('width', size)
      .attr('height', size)
      .append('g')
      .attr('transform', `translate(${radius},${radius})`);

    const pie = d3
      .pie<typeof DEVICE_BREAKDOWN[0]>()
      .value((d) => d.optimizedPct)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<typeof DEVICE_BREAKDOWN[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 4)
      .cornerRadius(4);

    svg
      .selectAll('path')
      .data(pie(DEVICE_BREAKDOWN))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#020617')
      .attr('stroke-width', 2);

    // Center text
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#38bdf8')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('-62%');

    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text('KW SAVED');
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Ring Ecosystem Energy &amp; Power Optimization</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                D3.js Live Engine
              </span>
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Visualizing power consumption reduction and financial savings driven by conditional smart routines.
            </div>
          </div>
        </div>

        {/* Cost Rate Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Utility Rate:</span>
          <select
            value={selectedKwhCost}
            onChange={(e) => setSelectedKwhCost(parseFloat(e.target.value))}
            className="bg-slate-900 text-sky-300 border border-slate-700 rounded px-1.5 py-0.5 text-xs focus:outline-none"
          >
            <option value="0.22">$0.22 / kWh (Off-Peak)</option>
            <option value="0.28">$0.28 / kWh (Standard US)</option>
            <option value="0.36">$0.36 / kWh (Peak Summer)</option>
            <option value="0.45">$0.45 / kWh (Commercial Tier)</option>
          </select>
        </div>
      </div>

      {/* Energy KPI Stat Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Power Load Drop</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">-62.4%</div>
          <div className="text-[11px] text-slate-400">Average 64W vs 172W baseline</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Monthly Cost Saved</span>
            <DollarSign className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            ${monthlyDollarSavings.toFixed(2)}
          </div>
          <div className="text-[11px] text-sky-300 font-mono">
            {monthlyKwhSaved.toFixed(1)} kWh monthly savings
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Carbon Offset</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono tabular-nums">
            {monthlyCo2SavedKg.toFixed(1)} kg
          </div>
          <div className="text-[11px] text-slate-400">Avoided CO₂e emissions</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Solar Pack Yield</span>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono tabular-nums">480 Wh/day</div>
          <div className="text-[11px] text-slate-400">Ring Doorbell Solar Panel</div>
        </div>
      </div>

      {/* Main D3 Chart and Donut Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* D3 24-Hour Comparison Chart */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">24-Hour Continuous Load Profile (Watts)</h3>
              <p className="text-[11px] text-slate-400">
                Hover over data points to inspect instant power metrics &amp; savings.
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-0.5 bg-rose-500 border-dashed" />
                <span>Baseline (Always On)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-1 bg-emerald-500 rounded" />
                <span>Smart Automation</span>
              </div>
            </div>
          </div>

          {/* D3 Chart Canvas Container */}
          <div ref={chartContainerRef} className="w-full" />

          {/* Active Hover Inspection HUD */}
          {activeHoverData ? (
            <div className="bg-slate-900 border border-sky-500/40 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-400">{activeHoverData.hour}:</span>
                <span className="text-rose-400">Baseline: {activeHoverData.baselineWatts}W</span>
                <span>·</span>
                <span className="text-emerald-400 font-bold">Optimized: {activeHoverData.optimizedWatts}W</span>
              </div>
              <div className="text-emerald-300 font-semibold">
                Instant Savings: +{activeHoverData.savingsWatts}W (-{Math.round((activeHoverData.savingsWatts / activeHoverData.baselineWatts) * 100)}%)
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 text-center py-1 font-mono italic">
              Move cursor across the chart line to reveal exact hourly power differentials.
            </div>
          )}
        </div>

        {/* D3 Donut Breakdown and Active Energy Automations */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Optimized Power by Hardware</h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Distribution of energy across Ring fleet after smart dimming &amp; sleep states.
            </p>

            <div className="flex items-center justify-center py-1">
              <div ref={donutContainerRef} />
            </div>

            <div className="space-y-1.5 pt-2">
              {DEVICE_BREAKDOWN.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-300 truncate max-w-[150px]">{d.device}</span>
                  </div>
                  <div className="text-slate-400">
                    <span className="text-emerald-400 font-bold">{d.optimizedPct}%</span>
                    <span className="text-[10px] text-slate-500 line-through ml-1">{d.baselinePct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Energy-Saving Automations List */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Active Energy-Saving Automations Driving Reductions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>PIR Radar Spotlight Dimming</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Floodlight stays in 10% ambient guide mode, instantly ramping to 100% (2000lm) only upon 3D radar motion detection.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono">Saves ~85W during idle night hours</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Deadbolt Sleep Polling</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Z-Wave deadbolt enters deep micro-amp sleep, waking within 300ms upon Doorbell ring or NFC touch.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono">Extends AA battery life by 14 months</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Solar Peak Shaving Buffer</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Video Doorbell Pro 2 and Chime Pro draw daytime auxiliary current from rooftop solar panels.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono">Offsets 100% of daytime standby power</div>
          </div>
        </div>
      </div>
    </div>
  );
};
