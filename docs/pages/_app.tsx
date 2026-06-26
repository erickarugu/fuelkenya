import type { AppProps } from "next/app";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={spaceGrotesk.variable}>
      <Component {...pageProps} />
    </main>
  );
}
