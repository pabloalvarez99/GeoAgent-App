import { redirect } from 'next/navigation';

// Route conflict: app/page.tsx also serves '/'.
// Dashboard home lives at /home — redirect there.
export default function DashboardRootPage() {
  redirect('/home');
}
