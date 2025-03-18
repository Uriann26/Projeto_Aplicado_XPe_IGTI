import { supabase } from '../supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface TeamProductivity {
  userId: string;
  userName: string;
  totalReports: number;
  approvedReports: number;
  pendingReports: number;
  rejectedReports: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface RoadConditionStats {
  totalLength: number;
  pavedLength: number;
  sidewalkLength: number;
  curbLength: number;
  pathologyCount: number;
}

export interface MonthlyStats {
  month: string;
  reports: number;
  pathologies: number;
  inspectedLength: number;
  completedTasks: number;
}

export interface TeamStats {
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  tasksByStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

async function fetchTeamData(teamId: string) {
  const [tasks, members, deadlines] = await Promise.all([
    supabase.from('tasks').select('status, priority').eq('team_id', teamId),
    supabase.from('team_members').select('id').eq('team_id', teamId),
    supabase.from('tasks')
      .select('id')
      .eq('team_id', teamId)
      .gt('due_date', new Date().toISOString())
      .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  if (tasks.error) throw tasks.error;
  if (members.error) throw members.error;
  if (deadlines.error) throw deadlines.error;

  return { tasks: tasks.data || [], members: members.data || [], deadlines: deadlines.data || [] };
}

export async function getTeamStats(teamId: string): Promise<TeamStats> {
  const { tasks, members, deadlines } = await fetchTeamData(teamId);

  return {
    totalMembers: members.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    upcomingDeadlines: deadlines.length,
    tasksByPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    },
    tasksByStatus: {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    },
  };
}

export async function getTeamProductivity(): Promise<TeamProductivity[]> {
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      reports (status),
      tasks!assigned_to (status)
    `);

  if (error) throw error;

  return (users || []).map(user => ({
    userId: user.id,
    userName: user.name,
    totalReports: user.reports?.length || 0,
    approvedReports: user.reports?.filter(r => r.status === 'approved').length || 0,
    pendingReports: user.reports?.filter(r => r.status === 'pending').length || 0,
    rejectedReports: user.reports?.filter(r => r.status === 'rejected').length || 0,
    completedTasks: user.tasks?.filter(t => t.status === 'completed').length || 0,
    pendingTasks: user.tasks?.filter(t => t.status !== 'completed').length || 0,
  }));
}

export async function getRoadConditionStats(): Promise<RoadConditionStats> {
  const { data, error } = await supabase
    .from('roads')
    .select(`
      length,
      paved_length,
      sidewalk_length,
      curb_length,
      pathologies (count)
    `);

  if (error) throw error;

  return data.reduce((acc, road) => ({
    totalLength: acc.totalLength + (road.length || 0),
    pavedLength: acc.pavedLength + (road.paved_length || 0),
    sidewalkLength: acc.sidewalkLength + (road.sidewalk_length || 0),
    curbLength: acc.curbLength + (road.curb_length || 0),
    pathologyCount: acc.pathologyCount + (road.pathologies?.[0]?.count || 0)
  }), {
    totalLength: 0,
    pavedLength: 0,
    sidewalkLength: 0,
    curbLength: 0,
    pathologyCount: 0
  });
}

export async function getMonthlyStats(months: number = 6): Promise<MonthlyStats[]> {
  const stats: MonthlyStats[] = [];
  const currentDate = new Date();

  for (let i = 0; i < months; i++) {
    const monthDate = subMonths(currentDate, i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    const [reports, pathologies, roads, tasks] = await Promise.all([
      supabase.from('reports').select('id').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('pathologies').select('id').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('roads').select('length').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('tasks').select('id').eq('status', 'completed').gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
    ]);

    if (reports.error) throw reports.error;
    if (pathologies.error) throw pathologies.error;
    if (roads.error) throw roads.error;
    if (tasks.error) throw tasks.error;

    const inspectedLength = roads.data?.reduce((acc, road) => acc + (road.length || 0), 0) || 0;

    stats.push({
      month: format(monthDate, 'MMM yyyy'),
      reports: reports.data?.length || 0,
      pathologies: pathologies.data?.length || 0,
      inspectedLength,
      completedTasks: tasks.data?.length || 0
    });
  }

  return stats.reverse();
}