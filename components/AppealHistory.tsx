'use client';
import { useState, useEffect, useCallback } from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Appeal {
  id: string;
  user_id: string;
  appeal_content: string;
  number_plate: string;
  ticket_value: number;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  updated_at: string;
  appeal_letter_content?: string;
  success_probability?: number;
  compliance_issues_found?: string[];
}

interface AppealHistoryProps {
  userId: string;
}

export function AppealHistory({ userId }: AppealHistoryProps) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAppeals();
  }, [userId, fetchAppeals]);

  const fetchAppeals = useCallback(async () => {
    try {
      const response = await fetch(`/api/appeals?userId=${userId}`);
      const data = await response.json();
      setAppeals(data.appeals || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'submitted':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      submitted: 'default',
      under_review: 'default',
      accepted: 'default',
      rejected: 'destructive',
      withdrawn: 'secondary'
    } as const;

    const colors = {
      draft: 'bg-gray-600',
      submitted: 'bg-blue-600',
      under_review: 'bg-yellow-600',
      accepted: 'bg-green-600',
      rejected: 'bg-red-600',
      withdrawn: 'bg-gray-600'
    };

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || 'secondary'}
        className={colors[status as keyof typeof colors] || 'bg-gray-600'}
      >
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredAppeals = appeals.filter(appeal => {
    if (activeTab === 'all') return true;
    return appeal.status === activeTab;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-zinc-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Appeal History</h2>
        <p className="text-gray-400">Track all your PCN appeals and their status</p>
      </div>

      {appeals.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Appeals Yet</h3>
            <p className="text-gray-400 mb-4">
              Start by creating your first PCN appeal
            </p>
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Create First Appeal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 bg-zinc-900 border-zinc-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700">
                All ({appeals.length})
              </TabsTrigger>
              <TabsTrigger value="draft" className="data-[state=active]:bg-zinc-700">
                Draft ({appeals.filter(a => a.status === 'draft').length})
              </TabsTrigger>
              <TabsTrigger value="submitted" className="data-[state=active]:bg-zinc-700">
                Submitted ({appeals.filter(a => a.status === 'submitted').length})
              </TabsTrigger>
              <TabsTrigger value="under_review" className="data-[state=active]:bg-zinc-700">
                Review ({appeals.filter(a => a.status === 'under_review').length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="data-[state=active]:bg-zinc-700">
                Won ({appeals.filter(a => a.status === 'accepted').length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-zinc-700">
                Lost ({appeals.filter(a => a.status === 'rejected').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredAppeals.map((appeal) => (
                <Card key={appeal.id} className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white flex items-center">
                          {getStatusIcon(appeal.status)}
                          <span className="ml-2">Appeal #{appeal.id.slice(-8)}</span>
                        </CardTitle>
                        <CardDescription>
                          Vehicle: {appeal.number_plate} • {formatCurrency(appeal.ticket_value)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(appeal.status)}
                        {appeal.success_probability && (
                          <Badge variant="outline" className="border-blue-500 text-blue-400">
                            {appeal.success_probability}% success
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-400">
                        <p className="line-clamp-2">{appeal.appeal_content}</p>
                      </div>
                      
                      {appeal.compliance_issues_found && appeal.compliance_issues_found.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">Compliance Issues Found:</h4>
                          <div className="flex flex-wrap gap-2">
                            {appeal.compliance_issues_found.map((issue, index) => (
                              <Badge key={index} variant="outline" className="border-green-500 text-green-400">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>Created: {new Date(appeal.created_at).toLocaleDateString()}</span>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {appeal.appeal_letter_content && (
                            <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {appeals.filter(a => a.status === 'accepted').length}
                </div>
                <div className="text-sm text-gray-400">Appeals Won</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {appeals.filter(a => a.status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-400">Appeals Lost</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {appeals.filter(a => a.status === 'under_review').length}
                </div>
                <div className="text-sm text-gray-400">Under Review</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
