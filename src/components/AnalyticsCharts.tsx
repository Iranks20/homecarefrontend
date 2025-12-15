// import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface AnalyticsChartsProps {
  data: any;
  type: 'appointments' | 'revenue' | 'satisfaction' | 'utilization' | 'services';
}

const COLORS = ['#0D6EFD', '#20B486', '#FFC107', '#DC3545', '#6F42C1', '#FD7E14'];

export default function AnalyticsCharts({ data, type }: AnalyticsChartsProps) {
  const renderChart = () => {
    switch (type) {
      case 'appointments':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="scheduled"
                stackId="1"
                stroke="#0D6EFD"
                fill="#0D6EFD"
                fillOpacity={0.6}
                name="Scheduled"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stackId="1"
                stroke="#20B486"
                fill="#20B486"
                fillOpacity={0.6}
                name="Completed"
              />
              <Area
                type="monotone"
                dataKey="cancelled"
                stackId="1"
                stroke="#DC3545"
                fill="#DC3545"
                fillOpacity={0.6}
                name="Cancelled"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#20B486" name="Monthly Revenue" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'satisfaction':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 5]} />
              <Tooltip formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : value, 'Rating']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#0D6EFD"
                strokeWidth={3}
                dot={{ fill: '#0D6EFD', strokeWidth: 2, r: 6 }}
                name="Average Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'utilization':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="80%"
              barSize={10}
              data={data}
            >
              <RadialBar
                // minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                // clockWise
                dataKey="value"
              />
              <Legend />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case 'services':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {renderChart()}
    </div>
  );
}

