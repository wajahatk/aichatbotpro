import { Head, Html, Main, NextScript } from "next/document";

const Document = () => (
  <Html translate="no">
    <Head>
      {/* <script
        crossOrigin="anonymous"
        src="//unpkg.com/react-scan/dist/auto.global.js"
      /> */}
      <link rel="icon" type="images/svg+xml" href="/favicon.svg" />
      <meta name="google" content="notranslate" />
      <script src="/__ENV.js" />
      {/* PWA */}
      <link rel="manifest" href="/api/manifest" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#6366f1" />
    </Head>
    <body className="font-body text-gray-12 bg-gray-2 dark:bg-gray-1 antialiased">
      <Main />
      <NextScript />
    </body>
  </Html>
);

export default Document;
