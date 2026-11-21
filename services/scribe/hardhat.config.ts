import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    fuji: {
      url: process.env.SCRIBE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: process.env.SCRIBE_PRIVATE_KEY ? [process.env.SCRIBE_PRIVATE_KEY] : [],
    },
  },
  paths: {
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;