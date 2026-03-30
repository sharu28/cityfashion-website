type CatalogShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function CatalogShell({ children, className = "" }: CatalogShellProps) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`.trim()}>{children}</div>;
}
