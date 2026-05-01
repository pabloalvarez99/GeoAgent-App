export function generateStaticParams() {
  return [{ id: '_', stId: '_' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
