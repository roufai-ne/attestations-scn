'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
  monthlyData: Array<{ month: string; count: number }>;
  topAgents: Array<{ nom: string; count: number }>;
  topPromotions: Array<{ promotion: string; count: number }>;
  statutCounts: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardCharts({ monthlyData, topAgents, topPromotions, statutCounts }: DashboardChartsProps) {
  // Données pour le pie chart des statuts
  const statutData = Object.entries(statutCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* Évolution mensuelle */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Évolution des demandes</CardTitle>
          <CardDescription>12 derniers mois</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Demandes" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Répartition par statut */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Répartition par statut</CardTitle>
          <CardDescription>Vue d'ensemble</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statutData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top agents */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Agents les plus actifs</CardTitle>
          <CardDescription>Top 5</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAgents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Demandes traitées" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top promotions */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Top Promotions</CardTitle>
          <CardDescription>Les 5 plus représentées</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPromotions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="promotion" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" name="Demandes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
