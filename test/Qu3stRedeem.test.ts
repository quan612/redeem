import { expect } from "./chai-setup";

// we import our utilities
import { setupUsers, setupUser } from "./utils";

// We import the hardhat environment field we are planning to use
import {
    ethers,
    deployments,
    getEnum,
    getNamedAccounts,
    getUnnamedAccounts,
    network,
} from "hardhat";
import { isLocalEnv } from "./utils/environment";
import { RedeemProxyAdmin, Qu3stRedeem, ERC721EnumerableExample, ERC20Test, ChonkNFT } from "../types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils } from "ethers";

const {
    utils: { formatBytes32String, parseUnits, solidityKeccak256 },
    constants: { HashZero },
    getContractFactory,
    getUnnamedSigners,
    getNamedSigner,
    getContract,
} = ethers;

const REDEEM_CONTRACT = "Qu3stRedeem";

async function setupQu3stRedeemContract() {
    // only deploy if local testing
    if (isLocalEnv(network.name)) {
        console.log("local env");
        await deployments.fixture([REDEEM_CONTRACT]);
    }
    console.log("**************************");
    // we get the deployer
    const { deployer } = await getNamedAccounts();

    //we get an instantiated contract in the form of a ethers.js Contract instance:
    const contracts = {
        redeemContract: (await getContract(REDEEM_CONTRACT)) as Qu3stRedeem,
    };

    // These object allow you to write things like `users[0].Token.transfer(....)`
    const users = await setupUsers(await getUnnamedAccounts(), contracts);
    // finally we return the whole object (including the tokenOwner setup as a User object)
    return {
        ...contracts,
        users,
        owner: await setupUser(deployer, contracts),
    };
}

describe(" Redeem Contract Test!!!", () => {
    let deployer: SignerWithAddress;
    let executor: SignerWithAddress;
    let treasury: SignerWithAddress;
    let redeemContract: Qu3stRedeem;

    let users;
    let proxyOwner: SignerWithAddress;
    let redeemProxyAdmin: RedeemProxyAdmin;
    let erc721EnumerableExample: ERC721EnumerableExample;

    let redeemableRole;
    let adminRole;
    let erc20: ERC20Test;

    before("populate accs", async () => {
        deployer = await getNamedSigner("deployer");
        proxyOwner = await getNamedSigner("proxyOwner");
        treasury = await getNamedSigner("treasury");
        executor = await getNamedSigner("executor");

        ({ redeemContract, users } = await setupQu3stRedeemContract());
        redeemProxyAdmin = await getContract("RedeemProxyAdmin", deployer);
        redeemableRole = await redeemContract.REDEEMABLE_ROLE();
        adminRole = await redeemContract.DEFAULT_ADMIN_ROLE();

        await deployer.sendTransaction({
            to: treasury.address,
            value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
        });

        await deployer.sendTransaction({
            to: executor.address,
            value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
        });
    });

    describe("Test With Proxy", () => {
        describe("Set Function", () => {
            // should be another message
            // it("Should fail to allow non-owner to set functions", async function () {
            //     await expect(
            //         users[0].anomuraEquipment.setBaseURI("https://anomuragame.com")
            //     ).to.be.revertedWith(
            //         `AccessControl: account ${users[0].address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
            //     );

            //     await expect(users[0].anomuraEquipment.toggleClaimStatus()).to.be.revertedWith(
            //         `AccessControl: account ${users[0].address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
            //     );
            // });

            it("should make deployer of contract admin of redeemContract", async () => {
                expect(await redeemContract.hasRole(adminRole, deployer.address)).to.be.true;
            });
            it("should set upgrade admin correctly", async () => {
                // only admin can call this function so if it goes through it's ok
                await redeemProxyAdmin.getProxyImplementation(redeemContract.address);
            });
            it("should upgrade to new implementation", async () => {
                const newLogic = await (await getContractFactory(REDEEM_CONTRACT)).deploy();
                await newLogic.deployed();
                await redeemProxyAdmin.upgrade(redeemContract.address, newLogic.address);

                expect(await redeemProxyAdmin.getProxyImplementation(redeemContract.address)).to.equal(
                    newLogic.address
                );
            });
            it("should revert when calling initialize() after upgrading", async () => {
                const newLogic = await (await getContractFactory(REDEEM_CONTRACT)).deploy();
                await newLogic.deployed();
                await redeemProxyAdmin.upgrade(redeemContract.address, newLogic.address);

                await expect(
                    redeemContract.initialize("0x9128C112f6BB0B2D888607AE6d36168930a37087")
                ).to.be.revertedWith("Initializable: contract is already initialized");
            });
            it("should hold state after upgrading", async () => {
                expect(await redeemContract.isPaused()).to.equals(false);
                await redeemContract.setContractPaused(true);
                expect(await redeemContract.isPaused()).to.equals(true);

                const newLogic = await (await getContractFactory(REDEEM_CONTRACT)).deploy();
                await newLogic.deployed();
                await redeemProxyAdmin.upgrade(redeemContract.address, newLogic.address);

                expect(await redeemContract.isPaused()).to.equals(true);

                // revert to `not paused` state
                await redeemContract.setContractPaused(false);
            });
            // it("should revert when executor does not have REDEEMABLE_ROLE", async () => {
            //     await expect(
            //         users[0].redeemContract.redeemERC20(
            //             "0xf300099bD25f4D1E7451840552290B022F54A272",
            //             users[0].address,
            //             1,
            //             1
            //         )
            //     ).to.be.revertedWith(
            //         `AccessControl: account ${users[0].address.toLowerCase()} is missing role ${redeemableRole}`
            //     );
            // });
        });
    });

    describe("Redeem ERC721Enumerable", () => {
        const slot1 = 1,
            slot2 = 2,
            slot3 = 3;

        before("setup mock", async () => {
            try {
                await deployments.fixture(["ERC721EnumerableExample"]);
                erc721EnumerableExample = (await getContract(
                    "ERC721EnumerableExample"
                )) as ERC721EnumerableExample;
            } catch (error) {
                console.log(error);
            }
        });

        it("redeemERC721: should revert when executor does not have REDEEMABLE_ROLE", async () => {
            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC721Enumerable(erc721EnumerableExample.address, users[0].address, slot1)
            ).to.be.revertedWith(
                `AccessControl: account ${executor.address.toLowerCase()} is missing role 0x0db03cf185f24aebe8c29b23521b64d46c4e3b95a8a1f7ac5b2dba46ab009146`
            );
        });
        it("redeemERC721: should revert when treasury wallet does not own any nft", async () => {
            await redeemContract.grantRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);

            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC721Enumerable(erc721EnumerableExample.address, users[0].address, slot1)
            ).to.be.revertedWith(`Treasury out of nft`);
        });
        it("redeemERC721: should revert when contract is paused", async () => {
            await redeemContract.setContractPaused(true);

            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC721Enumerable(erc721EnumerableExample.address, users[0].address, slot1)
            ).to.be.revertedWith(`Paused`);

            await redeemContract.setContractPaused(false);
        });
        it("redeemERC721: should revert when executor role is revoked", async () => {
            await redeemContract.revokeRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);

            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC721Enumerable(erc721EnumerableExample.address, users[0].address, slot1)
            ).to.be.revertedWith(
                `AccessControl: account ${executor.address.toLowerCase()} is missing role ${redeemableRole}`
            );
        });

        it("redeemERC721: should revert when token owner not approved the contract to transfer nft", async () => {
            await redeemContract.grantRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);
            await mintERC721(erc721EnumerableExample, treasury, 10);
            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC721Enumerable(erc721EnumerableExample.address, users[0].address, slot1)
            ).to.be.revertedWith(`ERC721: caller is not token owner nor approved`);
        });
        it("redeemERC721: should redeem erc721 when requirement satisfied", async () => {
            const receiver = users[1];
            const initialBalance = await erc721EnumerableExample.balanceOf(receiver.address);
            await expect(initialBalance).to.equals(0, "initial balance expect is wrong");

            await erc721EnumerableExample
                .connect(treasury)
                .setApprovalForAll(redeemContract.address, true);

            await redeemContract
                .connect(executor)
                .redeemERC721Enumerable(erc721EnumerableExample.address, receiver.address, slot1);

            const redeemedBalance = await erc721EnumerableExample.balanceOf(receiver.address);
            await expect(redeemedBalance).to.equals(1, "redeemed balance expect is wrong");
        });
        it("redeemERC721: should emit event once redeem erc721 successful", async () => {
            const receiver = users[1];
            await erc721EnumerableExample
                .connect(treasury)
                .setApprovalForAll(redeemContract.address, true);
            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC721Enumerable(erc721EnumerableExample.address, receiver.address, slot2)
            ).to.emit(redeemContract, "Redeemed");
        });
    });

    describe("Redeem ERC1155", () => {
        const slot1 = 1,
            slot2 = 2,
            slot3 = 3;
            let chonkNFT

        before("setup mock", async () => {
            try {
                await deployments.fixture(["ChonkNFT"]);
                chonkNFT = (await getContract(
                    "ChonkNFT"
                )) as ChonkNFT;
            } catch (error) {
                console.log(error);
            }
        });

        it("redeemERC1155: should revert when executor does not have REDEEMABLE_ROLE", async () => {
            await redeemContract.revokeRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);
            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC1155(chonkNFT.address, users[0].address, 1, slot1)
            ).to.be.revertedWith(
                `AccessControl: account ${executor.address.toLowerCase()} is missing role ${redeemableRole}`
            );
        });
        it("redeemERC721: should revert when treasury wallet does not own any nft", async () => {
            await redeemContract.grantRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);

            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC1155(chonkNFT.address, users[0].address, 1, slot1)
            ).to.be.revertedWith(`Treasury out of nft`);
        });
        it("redeemERC1155: should revert when contract is paused", async () => {
            await redeemContract.setContractPaused(true);

            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC1155(chonkNFT.address, users[0].address, 1, slot1)
            ).to.be.revertedWith(`Paused`);

            await redeemContract.setContractPaused(false);
        });
        it("redeemERC1155: should revert when executor role is revoked", async () => {
            await redeemContract.revokeRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);

            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC1155(chonkNFT.address, users[0].address, 1, slot1)
            ).to.be.revertedWith(
                `AccessControl: account ${executor.address.toLowerCase()} is missing role ${redeemableRole}`
            );
        });

        it("redeemERC1155: should revert when token owner not approved the contract to transfer nft", async () => {
            await redeemContract.grantRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);

            await mintERC1155(chonkNFT, treasury, 10);
            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC1155(chonkNFT.address, users[0].address, 1, slot1)
            ).to.be.revertedWith(`ERC1155: caller is not token owner nor approved`);
        });
        it("redeemERC1155: should redeem erc1155 when requirement satisfied", async () => {
            const receiver = users[1];
            const initialBalance = await chonkNFT.balanceOf(receiver.address, 1);
            await expect(initialBalance).to.equals(0, "initial balance expect is wrong");

            await chonkNFT
                .connect(treasury)
                .setApprovalForAll(redeemContract.address, true);

            await redeemContract
                .connect(executor)
                .redeemERC1155(chonkNFT.address, receiver.address, 1, slot1)

            const redeemedBalance = await chonkNFT.balanceOf(receiver.address, 1);
            await expect(redeemedBalance).to.equals(1, "redeemed balance expect is wrong");
        });
        it("redeemERC1155: should emit event once redeem erc1155 successful", async () => {
            const receiver = users[1];
            await chonkNFT
                .connect(treasury)
                .setApprovalForAll(redeemContract.address, true);

            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC1155(chonkNFT.address, receiver.address, 1, slot1)
            ).to.emit(redeemContract, "Redeemed");
        });
    });


    describe("Redeem ERC20", () => {
        const slot1 = 1,
            slot2 = 2,
            slot3 = 3,
            amount = 1;

        before("setup mock", async () => {
            try {
                await deployments.fixture(["ERC20Test"]);
                erc20 = (await getContract("ERC20Test")) as ERC20Test;
            } catch (error) {
                console.log(error);
            }
        });

        it("redeemERC20: should revert when executor does not have REDEEMABLE_ROLE", async () => {
            await redeemContract.revokeRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);
            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC20(erc20.address, users[0].address, amount, slot1)
            ).to.be.revertedWith(
                `AccessControl: account ${executor.address.toLowerCase()} is missing role 0x0db03cf185f24aebe8c29b23521b64d46c4e3b95a8a1f7ac5b2dba46ab009146`
            );
        });
        it("redeemERC20: should revert when treasury wallet does not own any erc20 token", async () => {
            await redeemContract.grantRole(await redeemContract.REDEEMABLE_ROLE(), executor.address);

            await expect(
                redeemContract.connect(executor).redeemERC20(
                    erc20.address,
                    users[0].address,
                    amount,
                    slot1
                )
            ).to.be.revertedWith(`Balance out of funds`);
        });
        it("redeemERC20: should revert when contract is paused", async () => {
            await redeemContract.setContractPaused(true);

            await expect(
                redeemContract.connect(executor).redeemERC20(
                    erc20.address,
                    users[0].address,
                    amount,
                    slot1
                )
            ).to.be.revertedWith(`Paused`);

            await redeemContract.setContractPaused(false);
        });
        

        it("redeemERC20: should revert as Allowance insufficient when token owner not approved the contract to transfer erc20 token", async () => {
   
            await mintERC20(erc20, treasury, 10);
            await expect(
                redeemContract.connect(executor).redeemERC20(
                    erc20.address,
                    users[0].address,
                    amount,
                    slot1
                )
            ).to.be.revertedWith(`Allowance insufficient`);

        });
        it("redeemERC20: should redeem erc20 when requirement satisfied", async () => {
            const receiver = users[1];
            const initialBalance = await erc20.balanceOf(receiver.address);
            await expect(initialBalance).to.equals(0, "initial balance expect is wrong");

            // let decimals = await erc20.decimals();
            // console.log("decimals", decimals)

            await erc20.connect(treasury).approve(redeemContract.address, 2);

            await redeemContract.connect(executor).redeemERC20(erc20.address, receiver.address, 1, slot1);

            const redeemedBalance = await erc20.balanceOf(receiver.address);
            await expect(redeemedBalance).to.equals(1, "redeemed balance expect is wrong")
        });
        it("redeemERC20: should redeem erc20 when requirement satisfied 2", async () => {
            const receiver = users[1];
         
            await expect(
                redeemContract
                    .connect(executor)
                    .redeemERC20(erc20.address, receiver.address, 1, slot2)
            ).to.emit(redeemContract, "Redeemed");
        });
    });
});

const mintERC721 = async (
    erc721ContractInstance: ERC721EnumerableExample,
    receiver: SignerWithAddress,
    quantity: number
) => {
    for (let i = 0; i < quantity; i++) {
        let tx = await erc721ContractInstance.mintToWallet(receiver.address);
        await tx.wait();
    }
};

const mintERC1155 = async (
    erc1155ContractInstance: ChonkNFT,
    receiver: SignerWithAddress,
    quantity: number
) => {
    for (let i = 0; i < quantity; i++) {
        let tx = await erc1155ContractInstance.mint(receiver.address, 1, 1);
        await tx.wait();
    }
};

const mintERC20 = async (
    erc20ContractInstance: ERC20Test,
    receiver: SignerWithAddress,
    amount: number
) => {

        let tx = await erc20ContractInstance.mint(receiver.address, amount);
        await tx.wait();

};
