import React from 'react';

interface PieChartProps {
  data: {
    range: string;
    count: number;
    color: string;
  }[];
}

export const PieChart = ({ data }: PieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let currentAngle = 0;

  if (total === 0) {
    return (
      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
        No Data
      </div>
    );
  }

  // If there's only one item with 100%, we need to draw a circle instead of an arc
  if (data.filter(item => item.count > 0).length === 1) {
    const item = data.find(item => item.count > 0)!;
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        <circle cx="50" cy="50" r="50" fill={item.color} />
        <circle cx="50" cy="50" r="35" fill="white" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
      {data.map((item, index) => {
        if (item.count === 0) return null;
        
        const percentage = item.count / total;
        const angle = percentage * 360;
        
        // Calculate SVG path for the slice
        const startAngleRad = (Math.PI * currentAngle) / 180;
        const endAngleRad = (Math.PI * (currentAngle + angle)) / 180;

        const x1 = 50 + 50 * Math.cos(startAngleRad);
        const y1 = 50 + 50 * Math.sin(startAngleRad);
        
        const x2 = 50 + 50 * Math.cos(endAngleRad);
        const y2 = 50 + 50 * Math.sin(endAngleRad);
        
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        
        const pathData = [
          `M 50 50`,
          `L ${x1} ${y1}`,
          `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `Z`
        ].join(' ');
        
        const slice = (
          <path
            key={index}
            d={pathData}
            fill={item.color}
            stroke="white"
            strokeWidth="1"
          />
        );
        
        currentAngle += angle;
        return slice;
      })}
      {/* Inner circle for donut chart effect */}
      <circle cx="50" cy="50" r="35" fill="white" />
    </svg>
  );
};
