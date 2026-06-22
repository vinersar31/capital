'use client';

import React, { useMemo } from 'react';
import { useWealthData } from '../hooks/useWealthData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, Landmark, TrendingDown } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { assets, liabilities, loading, totalAssets, totalLiabilities, netWorth } = useWealthData();

  const assetAllocationData = useMemo(() => {
    const allocation = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + asset.currentValue;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(allocation).map(key => ({
      name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: allocation[key]
    }));
  }, [assets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-600">Loading your capital...</div>
      </div>
    );
  }

  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Capital Dashboard</h1>
        <p className="text-gray-500">Your personal wealth and net worth tracker</p>
      </header>

      {/* Top Row: Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center space-x-4 border border-gray-100">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Net Worth</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(netWorth)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center space-x-4 border border-gray-100">
          <div className="p-4 bg-green-50 text-green-600 rounded-full">
            <Landmark size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Gross Assets</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalAssets)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center space-x-4 border border-gray-100">
          <div className="p-4 bg-red-50 text-red-600 rounded-full">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Debt</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalLiabilities)}</p>
          </div>
        </div>
      </div>

      {/* Middle Section: Asset Allocation Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Asset Allocation</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={assetAllocationData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {assetAllocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section: Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Assets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{asset.name}</div>
                      {asset.ticker && <div className="text-xs text-gray-500">{asset.ticker}</div>}
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600">
                      {asset.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(asset.currentValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Liabilities Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Liabilities</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liabilities.map((liability) => (
                  <tr key={liability.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{liability.name}</td>
                    <td className="px-6 py-4 capitalize text-gray-600">
                      {liability.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(liability.currentValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
