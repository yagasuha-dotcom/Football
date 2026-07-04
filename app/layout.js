import './globals.css';

export const metadata = {
  title: 'MATCHDAY — Live Football Scores & Highlights',
  description: 'Skor live, event pertandingan, dan highlight video football real-time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
