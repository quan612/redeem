// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlEnumerableUpgradeable, IAccessControlEnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

import {IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import {ECDSAUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";

import { IERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import {EnumerableSetUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IERC721AQueryable } from "./ERC721A/extensions/IERC721AQueryable.sol";

import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Qu3stRedeem is
    Initializable,
    AccessControlEnumerableUpgradeable
{
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    /// @dev Emit an event when the Redeemed
    /// slotId will give us the associated record of this RedeemContract
    event Redeemed(address tokenContract, address receiver, uint256 slotId);

    /// @dev Emit an event when the contract is deployed
    event ContractDeployed(address owner);

    bytes32 public constant REDEEMABLE_ROLE = keccak256("REDEEMABLE_ROLE");
    address private _treasury;

    EnumerableSetUpgradeable.AddressSet private _approvalCollections;

    bool public isPaused;

    function initialize(address treasury_) external initializer {
        __AccessControlEnumerable_init();
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        isPaused=false;
        _treasury=address(treasury_); 
        emit ContractDeployed(_msgSender());
    }

    /**
     * @dev Redeem erc20 token. 
     * Slot id is emitted back for event listener, to get original shop item ~ an on-chain or gacha
     */
    function redeemERC20(address _tokenContract, address _receiver, uint256 _amount, uint256 _slotId) external onlyRole(REDEEMABLE_ROLE)
    {
        require(
            isPaused == false,
            "Paused"
        );
        require(
            IERC20(_tokenContract).balanceOf(_treasury) >= _amount,
            "Balance out of funds"
        );   
        require(
            IERC20(_tokenContract).allowance(_treasury, address(this)) >= _amount,
            "Allowance insufficient"
        );   
        require(IERC20(_tokenContract).transferFrom(_treasury, _receiver, _amount));

        emit Redeemed(
            _tokenContract,
            _receiver,
            _slotId
        );
    }

    /**
     * @dev Redeem erc721Enumerable. 
     * Mostly to use on erc721Enumerable contract, which not required to pass tokenId as param.
     * Slot id is emitted back for event listener, to get original shop item ~ an on-chain or gacha
     */
    function redeemERC721Enumerable(address _nftContract, address _receiver, uint256 _slotId) external onlyRole(REDEEMABLE_ROLE)
    {
        require(
            isPaused == false,
            "Paused"
        );
        require(
            IERC721Enumerable(_nftContract).balanceOf(_treasury) >= 1,
            "Treasury out of nft"
        ); 

        uint256 _tokenId = IERC721Enumerable(_nftContract).tokenOfOwnerByIndex(_treasury, 0);

        IERC721Enumerable(_nftContract).transferFrom(_treasury, _receiver, _tokenId);

        emit Redeemed(
            _nftContract,
            _receiver,
            _slotId
        );
    }
    
    /**
     * @dev Redeem erc721A. 
     * Mostly to use on erc721A contract, which not required to pass tokenId as param.
     * This function is not gas efficient and cost much more gas to run than erc721 standard.
     * This function is likely to fail on contract > 10k totalSupply() as it exceeds blockchain gas limit.
     * Only use this function as a last resort on erc721A contract when no indexing service is available
     * Slot id is emitted back for event listener, to get original shop item ~ an on-chain or gacha
     */
    function redeemERC721A(address _nftContract, address _receiver, uint256 _slotId) external onlyRole(REDEEMABLE_ROLE)
    {
        require(
            isPaused == false,
            "Paused"
        );
        require(
            IERC721AQueryable(_nftContract).balanceOf(_treasury) >= 1,
            "Treasury out of nft"
        ); 

        uint256[] memory _tokens = IERC721AQueryable(_nftContract).tokensOfOwner(_treasury);
        uint256 _tokenId = _tokens[0];

        IERC721AQueryable(_nftContract).transferFrom(_treasury, _receiver, _tokenId);

        emit Redeemed(
            _nftContract,
            _receiver,
            _slotId
        );
    }


     /**
     * @dev Redeem erc1155. 
     * Required to know a tokenId before calling the function
     * Slot id is emitted back for event listener, to get original shop item ~ an on-chain or gacha
     */
    function redeemERC1155(address _contract, address _receiver, uint256 _tokenId, uint256 _slotId) external onlyRole(REDEEMABLE_ROLE)
    {
        require(
            isPaused == false,
            "Paused"
        );
        require(
            IERC1155(_contract).balanceOf(_treasury, _tokenId) >= 1,
            "Treasury out of nft"
        ); 

        IERC1155(_contract).safeTransferFrom(_treasury, _receiver, _tokenId, 1, "");

        emit Redeemed(
            _contract,
            _receiver,
            _slotId
        );
    }

     /**
     * @dev Redeem erc721. 
     * To use on erc721 contract, required to know tokenId before calling the function.
     * Slot id is emitted back for event listener, to get original shop item ~ an on-chain or gacha
     */
    function redeemERC721General(address _nftContract, address _receiver, uint256 _tokenId, uint256 _slotId) external onlyRole(REDEEMABLE_ROLE)
    {
        require(
            isPaused == false,
            "Paused"
        );
        require(
            IERC721(_nftContract).balanceOf(_treasury) >= 1,
            "Treasury out of nft"
        );
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == _treasury,
            "Token not belong to treasury"
        ); 

        IERC721(_nftContract).transferFrom(_treasury, _receiver, _tokenId);

        emit Redeemed(
            _nftContract,
            _receiver,
            _slotId
        );
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(
            AccessControlEnumerableUpgradeable
        )
        returns (bool)
    {
        return
            type(IAccessControlEnumerableUpgradeable).interfaceId ==
            interfaceId ||
            super.supportsInterface(interfaceId);
    }


    /**
    @dev Change status of isPaused, to pause all minting functions
    @param _isPaused boolean to pause
    */
    function setContractPaused(bool _isPaused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isPaused = _isPaused;
        // emit UpdatedPauseContract(_isPaused, msg.sender);
    }

    /**
    @dev Get current treasury wallet
    */
    function getTreasury() external view returns (address) {
        return _treasury;
    }

    /**
    @notice Set a new treasury wallet
    @param treasury_ new address of treasury wallet
    */
    function setTreasury(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _treasury = treasury_;
    }
}