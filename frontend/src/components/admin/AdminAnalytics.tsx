import { useState, useEffect } from 'react';
import { BarChart, Activity, Download } from 'lucide-react';
import api from '../../services/api';

interface AnalyticsData {
    period: string;
    statusBreakdown: { status: string; count: number }[];
    categoryBreakdown: { category: string; count: number }[];
    approvalRate: string;
}

export default function AdminAnalytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [period, setPeriod] = useState('7d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/analytics?period=${period}`);
            setAnalytics(response.data.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportListings = async () => {
        window.open('/api/admin/export/listings', '_blank');
    };

    if (loading || !analytics) {
        return (
            <div className="bg-white rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        DRAFT: 'bg-gray-100 text-gray-800',
        PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        SOLD: 'bg-blue-100 text-blue-800',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold">Platform Analytics</h2>
                </div>
                <div className="flex gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-3 py-1 border rounded-lg text-sm"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                    </select>
                    <button
                        onClick={exportListings}
                        className="flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Approval Rate Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5" />
                    <span className="text-sm opacity-90">Approval Rate</span>
                </div>
                <div className="text-4xl font-bold">{analytics.approvalRate}%</div>
                <p className="text-sm opacity-75 mt-1">
                    Based on all reviewed listings
                </p>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Listings by Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {analytics.statusBreakdown.map((item) => (
                        <div
                            key={item.status}
                            className={`rounded-lg p-4 ${statusColors[item.status] || 'bg-gray-100'}`}
                        >
                            <div className="text-2xl font-bold">{item.count}</div>
                            <div className="text-xs mt-1">{item.status.replace('_', ' ')}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Top Categories</h3>
                <div className="space-y-3">
                    {analytics.categoryBreakdown.map((item, index) => (
                        <div key={item.category} className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium">{item.category}</span>
                                    <span className="text-gray-500">{item.count}</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 rounded-full"
                                        style={{
                                            width: `${(item.count / analytics.categoryBreakdown[0].count) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
