import { DeployFunction } from "hardhat-deploy/types";
import { RedeemProxyAdmin } from "../types"

const func: DeployFunction = async ({
  ethers: {
    getContract,
    provider
  },
  deployments: { deploy },
  getNamedAccounts,
}) => {
  const { deployer, gnosisSafe } = await getNamedAccounts();

  await deploy("RedeemProxyAdmin", { skipIfAlreadyDeployed: true, from: deployer, log: true })
}

func.tags = ["RedeemProxyAdmin"]

export default func;