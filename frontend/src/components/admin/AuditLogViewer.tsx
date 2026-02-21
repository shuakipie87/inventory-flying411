import { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

interface AuditLogEntry {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    adminId: string;
    details: Record<string, any> | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ action: '', entityType: '' });
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page, filter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (filter.action) params.set('action', filter.action);
            if (filter.entityType) params.set('entityType', filter.entityType);

            const response = await api.get(`/admin/audit-log?${params}`);
            setLogs(response.data.data.logs);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Failed to fetch audit log:', error);
        } finally {
            setLoading(false);
        }
    };

    const actionColors: Record<string, string> = {
        approve: 'bg-green-100 text-green-800',
        reject: 'bg-red-100 text-red-800',
        user_update: 'bg-blue-100 text-blue-800',
        create: 'bg-purple-100 text-purple-800',
        delete: 'bg-orange-100 text-orange-800',
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <h2 className="font-semibold">Audit Log</h2>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter.action}
                        onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                        className="text-sm border rounded-lg px-2 py-1"
                    >
                        <option value="">All Actions</option>
                        <option value="approve">Approve</option>
                        <option value="reject">Reject</option>
                        <option value="user_update">User Update</option>
                    </select>
                    <select
                        value={filter.entityType}
                        onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
                        className="text-sm border rounded-lg px-2 py-1"
                    >
                        <option value="">All Types</option>
                        <option value="listing">Listing</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Timestamp</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Entity ID</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Admin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No audit log entries found
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">{formatDate(log.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{log.entityType}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{log.entityId.slice(0, 8)}...</td>
                                    <td className="px-4 py-3 font-mono text-xs">{log.adminId.slice(0, 8)}...</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="p-4 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, pagination.total)} of{' '}
                        {pagination.total}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="p-2 border rounded-lg disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === pagination.totalPages}
                            className="p-2 border rounded-lg disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
