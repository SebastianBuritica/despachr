// App del conductor: mobile-first, columna centrada en pantallas grandes.
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="mx-auto w-full max-w-md bg-background">{children}</div>
}
