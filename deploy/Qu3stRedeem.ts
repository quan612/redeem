import { DeployFunction } from "hardhat-deploy/types";
import { Qu3stRedeem, RedeemProxyAdmin } from "../types";

const func: DeployFunction = async ({
  ethers: {
    getContract,
    provider
  },
  deployments: { deploy },
  getNamedAccounts,
}) => {
  const { deployer, proxyOwner, gnosisSafe, treasury } = await getNamedAccounts();

  await deploy("Qu3stRedeem", {
    proxy: {
      owner: proxyOwner,
      proxyContract: "OpenZeppelinTransparentProxy",
      viaAdminContract: "RedeemProxyAdmin",
      execute: {
        init: {
          methodName: "initialize",
          args: [treasury]
        }
      }
    },
    from: deployer,
    log: true,
    // waitConfirmations: 3
  })

  const Qu3stRedeem = await getContract<Qu3stRedeem>("Qu3stRedeem", provider.getSigner(deployer));
  console.log("Qu3stRedeem deployed at", Qu3stRedeem.address);
  // Transfer ownership of the contract to the Safe
  // if ((await Qu3stRedeem.owner()) == deployer) {
  //   console.log("Transferring Qu3stRedeem' ownership")
  //   const tx = await Qu3stRedeem.transferOwnership(gnosisSafe);
  //   await tx.wait();
    
  //   console.log("New qu3st Redeem' owner", await Qu3stRedeem.owner());
  //   console.log("");
  // }

  // Transfer RedeemProxyAdmin's ownership to the safe.
  // We don't do this on the deployment script of the admin because it will make this deployment script
  // impossible since the admin would be managed by the safe and it uses the proxy through the admin
  // const admin = await getContract<RedeemProxyAdmin>("RedeemProxyAdmin", provider.getSigner(deployer));
  // if ((await admin.owner()) == deployer) {
    // console.log("Transferring admin's ownership")
    // await admin.transferOwnership(gnosisSafe);
  // }
}

func.tags = ["Qu3stRedeem"]
func.dependencies = ["RedeemProxyAdmin"]

export default func;