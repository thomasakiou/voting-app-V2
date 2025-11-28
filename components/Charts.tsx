import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const VotesOverTimeChart = () => {
  const data = [
    { name: 'Mon', votes: 2400 },
    { name: 'Tue', votes: 1398 },
    { name: 'Wed', votes: 9800 },
    { name: 'Thu', votes: 3908 },
    { name: 'Fri', votes: 4800 },
    { name: 'Sat', votes: 3800 },
    { name: 'Sun', votes: 4300 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1351ec" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1351ec" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
        <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#1351ec' }}
        />
        <Area type="monotone" dataKey="votes" stroke="#1351ec" strokeWidth={3} fillOpacity={1} fill="url(#colorVotes)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const CandidateBarChart = () => {
    const data = [
      { name: 'J. Doe', votes: 62.3, fill: '#1351ec' },
      { name: 'J. Smith', votes: 58.5, fill: '#64748b' },
      { name: 'E. Jones', votes: 19.5, fill: '#22c55e' },
      { name: 'S. Miller', votes: 11.7, fill: '#eab308' },
    ];
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={data} margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} />
          <Tooltip cursor={{fill: 'transparent'}} />
          <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

export const VoteSharePieChart = () => {
    const data = [
      { name: 'J. Doe', value: 40, color: '#1351ec' },
      { name: 'J. Smith', value: 37.5, color: '#64748b' },
      { name: 'E. Jones', value: 12.5, color: '#22c55e' },
      { name: 'S. Miller', value: 7.5, color: '#eab308' },
    ];
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    );
  };
