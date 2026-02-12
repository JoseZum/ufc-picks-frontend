"use client";

interface AccuracyDataPoint {
  eventName: string;
  eventDate: string;
  accuracy: number;
  total: number;
  correct: number;
}

interface AccuracyChartProps {
  data: AccuracyDataPoint[];
}

export function AccuracyChart({ data }: AccuracyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-brutalist-panel border-[3px] border-white/15 p-8 text-center text-gray-500">
        <p>No data available for accuracy chart</p>
      </div>
    );
  }

  // Get last 10 events
  const chartData = data.slice(0, 10).reverse();

  return (
    <div className="bg-brutalist-panel border-[3px] border-white/15 p-8 shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-8 border-b border-white/8">
        <h3 className="font-bebas text-2xl tracking-[2px]">ACCURACY EVOLUTION</h3>
        <span className="text-[0.65rem] uppercase tracking-[2px] text-gray-500">
          LAST {chartData.length} EVENTS
        </span>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-[120px] mb-8">
        {chartData.map((point, index) => {
          const height = `${point.accuracy}%`;
          const eventLabel = point.eventName.replace('UFC ', '');

          return (
            <div
              key={index}
              className="flex-1 bg-brutalist-elevated relative flex flex-col justify-end"
            >
              {/* Bar Fill */}
              <div
                className="bg-brutalist-accent transition-all duration-300"
                style={{ height }}
              />

              {/* Value Label (Above Bar) */}
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.6rem] text-gray-400 whitespace-nowrap">
                {point.accuracy.toFixed(0)}%
              </span>

              {/* Event Label (Below Bar) */}
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[0.55rem] text-gray-500 whitespace-nowrap">
                {eventLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
