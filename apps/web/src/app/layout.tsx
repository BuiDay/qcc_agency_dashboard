import type { Metadata } from 'next';
import { AuthProvider } from '@/features/auth/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'QCC Agency',
    template: '%s | QCC Agency',
  },
  description: 'Quản lý công việc và quy trình dự án của QCC Agency.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
