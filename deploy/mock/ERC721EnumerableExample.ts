import { DeployFunction } from "hardhat-deploy/types";
import { RedeemProxyAdmin, ERC721EnumerableExample } from "../../types";
const { verify } = require("../../helper-functions");

const func: DeployFunction = async ({
    ethers: { getContract, provider },
    deployments: { deploy, get },
    getNamedAccounts,
    network,
}) => {
    const { deployer, proxyOwner, gnosisSafe } = await getNamedAccounts();

    // console.log("deployer", deployer);
    // console.log("proxyOwner", proxyOwner);

    const chainID = network.config.chainId;
;
    try {
        const signer = provider.getSigner(deployer);

        console.log("Attempt deploying ERC721EnumerableExample Contract...");

        await deploy("ERC721EnumerableExample", {
            proxy: {
                owner: proxyOwner,
                proxyContract: "OpenZeppelinTransparentProxy",
                viaAdminContract: "RedeemProxyAdmin",
                execute: {
                    init: {
                        methodName: "initialize",
                        args: [],
                    },
                },
            },
            from: deployer,
            log: true,
        });

        const eRC721EnumerableExample = await getContract<ERC721EnumerableExample>(
            "ERC721EnumerableExample",
            provider.getSigner(deployer)
        );

        console.log("eRC721EnumerableExample deployed at", eRC721EnumerableExample.address);

        // await verify(eRC721EnumerableExample.address, [])
    } catch (error) {
        console.log(error);
    }
};

func.tags = ["ERC721EnumerableExample"];
func.dependencies = ["RedeemProxyAdmin"];

export default func;
