import React, { useState, useEffect } from 'react';
import { Flag, Eye, AlertTriangle, CheckCircle, XCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextArea } from '../../components/ui/Input';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase, getStorageUrl } from '../../lib/supabase';
import type { Report, ReportStatus, AdminAction } from '../../types';

const REPORT_TYPE_LABELS: Record<string, { en: string; color: string }> = {
  scam: { en: 'Scam/Fraud', color: 'bg-red-100 text-red-700' },
  fake_profile: { en: 'Fake Profile', color: 'bg-orange-100 text-orange-700' },
  harassment: { en: 'Harassment', color: 'bg-purple-100 text-purple-700' },
  payment_issue: { en: 'Payment Issue', color: 'bg-yellow-100 text-yellow-700' },
  service_quality: { en: 'Service Quality', color: 'bg-blue-100 text-blue-700' },
  inappropriate_content: { en: 'Inappropriate', color: 'bg-pink-100 text-pink-700' },
  other: { en: 'Other', color: 'bg-gray-100 text-gray-700' },
};

export const AdminReports: React.FC = () => {
  const { } = useApp();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('reports')
        .select('*, reporter:users!reports_reporter_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleAction = async (reportId: string, status: ReportStatus, action: AdminAction) => {
    if (!user) return;

    setActionLoading(true);

    try {
      await supabase
        .from('reports')
        .update({
          status,
          admin_action: action,
          admin_notes: adminNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      // If action is ban or suspend, update the reported user/provider
      if (action === 'banned' && selectedReport) {
        if (selectedReport.reported_user_id) {
          await supabase
            .from('users')
            .update({
              is_banned: true,
              ban_reason: adminNotes || 'Policy violation',
            })
            .eq('id', selectedReport.reported_user_id);
        }
        if (selectedReport.reported_provider_id) {
          await supabase
            .from('providers')
            .update({ is_suspended: true, suspended_reason: adminNotes })
            .eq('id', selectedReport.reported_provider_id);
        }
      } else if (action === 'suspended' && selectedReport?.reported_provider_id) {
        await supabase
          .from('providers')
          .update({
            is_suspended: true,
            suspended_reason: adminNotes,
            suspended_at: new Date().toISOString(),
          })
          .eq('id', selectedReport.reported_provider_id);
      }

      await fetchReports();
      setSelectedReport(null);
      setAdminNotes('');
    } catch (err) {
      console.error('Error updating report:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    const config = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      reviewed: { variant: 'info' as const, label: 'Reviewed' },
      resolved: { variant: 'success' as const, label: 'Resolved' },
      dismissed: { variant: 'default' as const, label: 'Dismissed' },
    };
    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          {reports.filter(r => r.status === 'pending').length > 0 && (
            <Badge variant="danger" className="animate-pulse">
              {reports.filter(r => r.status === 'pending').length} New
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['pending', 'reviewed', 'resolved', 'dismissed', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-700 rounded w-48" />
                  <div className="h-4 bg-gray-700 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <Avatar
                  src={report.reporter?.avatar_url ? getStorageUrl('avatars', report.reporter.avatar_url) : undefined}
                  name={report.reporter?.full_name || 'Anonymous'}
                  size="md"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">
                        {report.reporter?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${REPORT_TYPE_LABELS[report.report_type]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {REPORT_TYPE_LABELS[report.report_type]?.en || report.report_type}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-3">{report.description}</p>

                  {report.screenshot_url && (
                    <button
                      onClick={() => window.open(getStorageUrl('booking-photos', report.screenshot_url), '_blank')}
                      className="flex items-center gap-2 text-blue-400 text-sm hover:underline mb-3"
                    >
                      <Eye className="w-4 h-4" />
                      View Screenshot
                    </button>
                  )}

                  {report.admin_notes && (
                    <div className="bg-gray-700 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-400">Admin Notes:</p>
                      <p className="text-gray-200">{report.admin_notes}</p>
                    </div>
                  )}

                  {report.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes('');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Reports Found
          </h3>
          <p className="text-gray-400">
            {statusFilter === 'pending' ? 'All reports have been reviewed' : 'No reports in this category'}
          </p>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => {
          setSelectedReport(null);
          setAdminNotes('');
        }}
        title="Review Report"
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            {/* Report Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {REPORT_TYPE_LABELS[selectedReport.report_type]?.en}
                  </p>
                  <p className="text-sm text-gray-600">{selectedReport.description}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Reported by: {selectedReport.reporter?.full_name || 'Anonymous'}
              </p>
            </div>

            {/* Admin Notes */}
            <TextArea
              label="Admin Notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this report and action taken..."
              rows={3}
            />

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleAction(selectedReport.id, 'dismissed', 'dismissed')}
                loading={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
              <Button
                onClick={() => handleAction(selectedReport.id, 'resolved', 'warned')}
                loading={actionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Warn User
              </Button>
              <Button
                variant="danger"
                onClick={() => handleAction(selectedReport.id, 'resolved', 'suspended')}
                loading={actionLoading}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Suspend
              </Button>
              <Button
                variant="danger"
                onClick={() => handleAction(selectedReport.id, 'resolved', 'banned')}
                loading={actionLoading}
                className="bg-red-700 hover:bg-red-800"
              >
                <Ban className="w-4 h-4 mr-2" />
                Permanent Ban
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
