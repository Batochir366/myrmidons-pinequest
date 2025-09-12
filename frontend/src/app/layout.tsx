
import "./globals.css";
import { ApolloWrapper } from "@/providers/ApolloWrapper";
export const metadata = {
  title: "Full-Stack GraphQL App",
  description: "Full-stack GraphQL application with Next.js and Apollo Server",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
