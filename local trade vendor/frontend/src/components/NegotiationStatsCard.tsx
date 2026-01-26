import React from 'react';

interface NegotiationStatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const NegotiationStatsCard: React.FC<NegotiationStatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-600';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-600';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-600';
      case 'gray':
        return 'bg-gray-50 border-gray-200 text-gray-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getTrendColor = (isPositive: boolean) => {
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${getColorClasses(color)}`}>
              <span className="text-xl">{icon}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        
        {trend && (
          <div className={`flex items-center text-sm font-medium ${getTrendColor(trend.isPositive)}`}>
            <span className="mr-1">
              {trend.isPositive ? '↗' : '↘'}
            </span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default NegotiationStatsCard;