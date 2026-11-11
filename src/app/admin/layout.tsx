import "../apply/portal.css";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="portal min-h-screen">{children}</div>;
}
