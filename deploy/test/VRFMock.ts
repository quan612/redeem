import { DeployFunction } from "hardhat-deploy/types";
import { VRFCoordinatorV2Mock } from "../../types";

const DECIMALS = "18";
const INITIAL_PRICE = "200000000000000000000";
const POINT_ONE_LINK = "100000000000000000";

// module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {

const func: DeployFunction = async ({
    ethers: { getContract, provider },
    deployments: { deploy, get, log },
    getNamedAccounts,
    network,
}) => {
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // If we are on a local development network, we need to deploy mocks!
    // This mock SHOULD NOT be available on mainnet / testnet deployment
    if (chainId == 31337) {
        log("Local network detected! Deploying mocks...");
      
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [
                POINT_ONE_LINK,
                1e9, // 0.000000001 LINK per gas
            ],
        });
      
        const signer = provider.getSigner(deployer);
        const vrfCoordinatorV2Mock = await getContract<VRFCoordinatorV2Mock>("VRFCoordinatorV2Mock", signer);
        console.log("VRFCoordinatorV2Mock Contract Address: ", vrfCoordinatorV2Mock.address);
        console.log("Mocks Deployed!");
        console.log("----------------------------------------------------");
        console.log(
            "You are deploying to a local network, you'll need a local network running to interact"
        );
        console.log("Please run `yarn hardhat console` to interact with the deployed smart contracts!");
        console.log("----------------------------------------------------");
    }
};

func.tags = ["VRFMock"];
export default func;
