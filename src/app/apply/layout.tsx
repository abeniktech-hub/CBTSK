import "./portal.css";

export default function ApplyLayout({ children }: LayoutProps<"/apply">) {
  return <div className="portal min-h-screen">{children}</div>;
}
