export function generateStaticParams() {
  return [{ id: '_', dhId: '_' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
