import Layout from "@/components/Layout";
import MediaProvider from "@/providers/MediaProvider";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <MediaProvider>
        <Component {...pageProps} />
      </MediaProvider>
    </Layout>
  );
}
