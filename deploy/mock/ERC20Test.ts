import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
  ethers: {
    utils: { parseUnits },
  },
  deployments: { deploy },
  getNamedAccounts,
}) => {
  const { deployer } = await getNamedAccounts();
  await deploy("ERC20Test", {
    skipIfAlreadyDeployed: true,
    contract: "ERC20Test",
    args: [parseUnits("666")],
    from: deployer,
    log: true,
  });
};

func.tags = ["ERC20Test"];

export default func;
