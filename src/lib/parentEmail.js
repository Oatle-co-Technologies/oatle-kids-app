import { supabase } from './supabase';
export function attemptId(subject, fresh = false) {
 const key = `oatle-report-attempt-${subject}`;
 let id = localStorage.getItem(key);
 if (!id || fresh) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
 return id;
}
export function queueReport(userId, subject, scores) {
 if (!userId) throw new Error('Sign in to save a report.');
 const key = `oatle-report-queue-${userId}`;
 const queue = JSON.parse(localStorage.getItem(key) || '[]');
 const id = attemptId(subject);
 if (!queue.some(r => r.attempt_id === id)) {
  queue.push({ attempt_id: id, owner_id: userId, subject, scores });
  localStorage.setItem(key, JSON.stringify(queue));
 }
 window.dispatchEvent(new Event('oatle-report-queued'));
}
export async function flushReports(userId) {
 const key = `oatle-report-queue-${userId}`;
 for (const report of JSON.parse(localStorage.getItem(key) || '[]')) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id !== userId) return;
  const { error } = await supabase.functions.invoke('parent-email', { body: report });
  if (error) throw error;
  // Re-read so a report completed while this request was in flight is retained.
  const remaining = JSON.parse(localStorage.getItem(key) || '[]').filter(r => r.attempt_id !== report.attempt_id);
  localStorage.setItem(key, JSON.stringify(remaining));
 }
}
