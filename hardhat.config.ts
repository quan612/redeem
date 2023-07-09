import "dotenv/config";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-deploy";

import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-tracer";

import { parse, visit } from "@solidity-parser/parser";
import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import { getFullyQualifiedName } from "hardhat/utils/contract-names";
import { node_url, accounts } from "./utils/network";

const {
    INFURA_URL,
    PRIVATE_KEY,
    ETHERSCAN_API,
    COINMARKETCAP_API_KEY,
    REPORT_GAS,
    GNOSIS_SAFE_ADDR_GOERLI,
    GNOSIS_SAFE_ADDR_MAINNET,
    TREASURY_GOERLI,
    TREASURY_MAINNET,
    TREASURY_FUJI,
    TREASURY_POLYGON,
} = process.env;

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.13",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.10",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.11",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.6",
            },
            {
                version: "0.8.0",
            },
            {
                version: "0.6.6",
            },
            {
                version: "0.6.0",
            },
            {
                version: "0.4.24",
            },
        ],
        settings: {
            optimizer: {
                enabled: true,
                runs: 1,
            },
        },
    },
    networks: {
        hardhat: {
            throwOnTransactionFailures: true,
            throwOnCallFailures: true,
            allowUnlimitedContractSize: true,
        },
        localhost: {
            throwOnTransactionFailures: true,
            throwOnCallFailures: true,
            allowUnlimitedContractSize: true,
           
        },
        mainnet: {
            url: node_url("mainnet"),
            accounts: accounts("mainnet"),
            chainId: 1,
        },
        goerli: {
            url: node_url("goerli"),
            accounts: accounts("goerli"),
            chainId: 5,
        },
        /* AVAX TEST NET */
        avalanche_fuji: {
            url: node_url("fuji"),
            accounts: accounts("fuji"),
            chainId: 43113,
        },
        /* AVAX MAINNET */
        avalanche: {
            url: node_url("avalanche"),
            accounts: accounts("avalanche"),
            chainId: 43114,
        },
        /* Arbitrum mainnet */
        arbitrum: {
            url: node_url("arbitrum"), //"https://arbitrum.blockpi.network/v1/rpc/public",
            accounts: accounts("arbitrum"),
            chainId: 42161,
        },
        mumbai: {
            url: "https://polygon-mumbai.g.alchemy.com/v2/SyYEtG0AiExrIqNLml1srA0ppVRM84Qp",
            chainId: 80001,
            accounts: accounts("mumbai"),
        },
        polygon: {
            url: "https://polygon-rpc.com",
            chainId: 137,
            accounts: accounts("polygon"),
        },
        "ronin-testnet": {
            url: "https://saigon-testnet.roninchain.com/rpc",
            chainId: 2021,
            accounts: accounts("saigon"), //accounts('saigon'),[process.env.PK_KEY!],
            blockGasLimit: 100000000,
        },
    },
    namedAccounts: {
        deployer: { default: 0, 4: 0, 5: 0 },
        proxyOwner: { default: 0 },
        gnosisSafe: {
            default: 6,
            goerli: GNOSIS_SAFE_ADDR_GOERLI,
            mainnet: GNOSIS_SAFE_ADDR_MAINNET,
        },
        treasury: {
            default: 7,
            hardhat: TREASURY_GOERLI,
            goerli: TREASURY_GOERLI,
            mainnet: TREASURY_MAINNET,
            avalanche_fuji: TREASURY_FUJI,
            avalanche: TREASURY_FUJI,
            arbitrum: TREASURY_MAINNET,
            mumbai: TREASURY_POLYGON,
            polygon: TREASURY_POLYGON,
        },
        executor: {
            default: 7,
            hardhat: "0xb85B9F5AEd459bE2283786Bc162991A8E6634767",
        },
    },
    typechain: {
        outDir: "types",
        target: "ethers-v5",
    },
    mocha: {
        timeout: 20000,
    },
    etherscan: {
        apiKey: ETHERSCAN_API,
        // apiKey: process.env.SNOWTRACE_TEST_API_KEY, // avalance test net
        // apiKey: ARBISCAN_API_KEY,
        // apiKey: process.env.POLYGON_API_KEY, // polygon
        // customChains: [
        //   {
        //     network: "ronin-testnet",
        //     chainId: 2021,
        //     urls: {
        //       apiURL: "https://saigon-testnet.roninchain.com/rpc",
        //       browserURL: "https://saigon-app.roninchain.com/"
        //     }
        //   }
        // ]
    },
    gasReporter: {
        enabled: true, //!!REPORT_GAS,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        // real cost = transaction cost * price on eth station, then convert this gwei to eth
    },
};

extendEnvironment((hre) => {
    hre.getEnum = async (contractName, enumName) => {
        const { artifacts } = hre;
        const { sourceName } = await artifacts.readArtifact(contractName);
        const { input } = await artifacts.getBuildInfo(
            getFullyQualifiedName(sourceName, contractName)
        );
        return new Promise((resolve, reject) => {
            let found = false;
            visit(parse(input.sources[sourceName].content), {
                EnumDefinition: ({ name, members }) => {
                    if (found || name !== enumName) return;
                    found = true;
                    resolve(
                        Object.fromEntries(
                            members.flatMap(({ name: valueName }, i) => [
                                [i, valueName],
                                [valueName, i],
                            ])
                        )
                    );
                },
            });
            if (!found) reject("not found");
        });
    };
});

export default config;

declare module "hardhat/types/runtime" {
    export interface HardhatRuntimeEnvironment {
        getEnum: (contractName: string, enumName: string) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
}
