import { DeployFunction } from "hardhat-deploy/types";
import { RedeemProxyAdmin, ChonkNFT } from "../../types";

const func: DeployFunction = async ({
    ethers: { getContract, provider },
    deployments: { deploy, get },
    getNamedAccounts,
    network,
}) => {
    const { deployer, proxyOwner, gnosisSafe } = await getNamedAccounts();

    const chainID = network.config.chainId;

    try {
        const signer = provider.getSigner(deployer);

        console.log("Attempt deploying ChonkNFT Contract...");

        const chonkDeploy = await deploy("ChonkNFT", {
            skipIfAlreadyDeployed: true,
            contract: "ChonkNFT",
            from: deployer,
            log: true,
          });

       

        console.log("ChonkNFT deployed at: ", chonkDeploy.address);

      
    } catch (error) {
        console.log(error);
    }
};

func.tags = ["ChonkNFT"];
func.dependencies = ["RedeemProxyAdmin"];

export default func;
