import "@/styles/globals.css";
import Layout from "../components/Layout";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

const xdc = {
  id: 551,
  name: "XDC Devnet",
  network: "XDC Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "XDC",
    symbol: "XDC",
  },
  rpcUrls: {
    public: { http: ["https://devnetstats.apothem.network/devnet"] },
    default: { http: ["https://devnetstats.apothem.network/devnet"] },
  },
};

const { chains, publicClient } = configureChains([xdc], [publicProvider()]);
const { connectors } = getDefaultWallets({
  appName: "App",
  projectId: "2a612b9a18e81ce3fda2f82787eb6a4a",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});
export default function App({ Component, pageProps }) {
  const rainbowKitConfig = {
    chains: chains,
    showRecentTransactions: true,
    coolMode: true,
  };
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider {...rainbowKitConfig}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
