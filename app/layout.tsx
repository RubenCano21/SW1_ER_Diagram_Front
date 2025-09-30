// app/layout.tsx
import localFont from 'next/font/local'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = localFont({
  src: [
    { path: './fonts/Inter-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Inter-Bold.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-inter'
})

export const metadata = {
  title: 'ER Diagram',
  description: 'Aplicación con autenticación JWT usando Next.js 13+ y Spring Boot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
