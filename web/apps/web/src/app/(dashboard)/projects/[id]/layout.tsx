// Server Component layout — enables static export for dynamic [id] segment.
// generateStaticParams returns [] so no pages are pre-rendered at build time;
// the Electron app uses client-side routing to handle all project routes.
export function generateStaticParams() {
  return [];
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
