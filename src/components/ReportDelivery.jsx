import { useEffect, useState } from 'react';
import { flushReports } from '../lib/parentEmail';
export default function ReportDelivery({userId}) {
 const [message,setMessage] = useState('');
 useEffect(() => {
  let active = true, busy = false;
  async function flush() {
   if (busy) return;
   busy = true;
   try { const pending = JSON.parse(localStorage.getItem(`oatle-report-queue-${userId}`) || '[]').length;
    if (pending) { await flushReports(userId); if (active) setMessage('Assessment report saved for email delivery to your verified parent account.'); }
   } catch { if (active) setMessage('Report is saved on this device. Keep the app open or return online to retry email submission.'); }
   finally { busy = false; }
  }
  flush(); const timer = setInterval(flush, 30000);
  window.addEventListener('online',flush); window.addEventListener('oatle-report-queued',flush);
  return () => {active=false; clearInterval(timer); window.removeEventListener('online',flush); window.removeEventListener('oatle-report-queued',flush);};
 }, [userId]);
 return message ? <p role="status">{message}</p> : null;
}
