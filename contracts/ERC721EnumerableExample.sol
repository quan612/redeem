// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {StringsUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import {Base64Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";


contract ERC721EnumerableExample is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIds;

    bool public isPaused;
    string private baseURI;

    string public tanukiImage;

    function initialize() external initializer {
        __ERC721_init("ERC721 Test", "ERTS");
        __ERC721Enumerable_init();
        __ReentrancyGuard_init();
        __Ownable_init();

        isPaused = false;

        // to have anomuraId starts at 1, instead of 0
        _tokenIds.increment();
    }

    // ============ ACCESS CONTROL/SANITY MODIFIERS ============

    /**
     * @dev Throws if called when contract is paused.
     */
    modifier isNotPaused() {
        require(isPaused == false, "Contract Paused");
        _;
    }

    /**
     * @dev Throws if token not existed on contract.
     */
    modifier isTokenExist(uint256 _tokenId) {
        require(_exists(_tokenId), "Nonexistent token.");
        _;
    }


    // ============ PUBLIC FUNCTIONS FOR MINTING =============

    /**
     * @dev Only Owner mint token. Do not check Max ToTAL SUPPLY.
     */
    function mintToWallet(address _walletAddress)
        external
        isNotPaused
        nonReentrant
        onlyOwner
        returns (uint256 mintId)
    {
            mintId = _tokenIds.current();
            _tokenIds.increment();
            _safeMint(_walletAddress, mintId);
    }

    /**
    @notice To set new baseURI for tokenId
    @param baseURI_ new baseURI
    */
    function setBaseURI(string calldata baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    /**
    @notice Takes a tokenId and returns base64 string
    @param _tokenId Id of the token
    @return string base64
    */
   function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "Nonexistent token");
 
        string memory json = Base64Upgradeable.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Mokunuki #',
                        StringsUpgradeable.toString(_tokenId),
                        '", "image":"',
                        tanukiImage,
                        '"'
                        "}"
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
    @notice Takes an eth address and returns the tokenIds that this user owns
    @param _ownerAddr Owner of the tokens
    @return tokenIds The list of owned tokens
    */
    function getTokensByOwner(address _ownerAddr)
        external
        view
        returns (uint256[] memory tokenIds)
    {
        require(_ownerAddr != address(0), "Cannot query address 0");

        uint256 numTokens = balanceOf(_ownerAddr);
        tokenIds = new uint256[](numTokens);
        for (uint256 i = 0; i < numTokens; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_ownerAddr, i);
        }
    }

    /**
    @notice Change status of isPaused, to pause all minting functions
    @param _isPaused boolean to pause
    */
    function setContractPaused(bool _isPaused) external onlyOwner {
        isPaused = _isPaused;    }

    /**
    @notice Disable renounceOwnership since this contract has multiple onlyOwner functions
    */
    function renounceOwnership() public view override onlyOwner {
        revert("renounceOwnership is not allowed");
    }

    /**
    @notice withdraw current balance to msg.sender address
    */
    function withdrawAvailableBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    /**
    @notice Transfer the toker to a new address, and reset the starfish map of this token
    @param _from The token to be transferred from
    @param _to The token to be transferred to
    @param _tokenId tokenId to be transferred
    */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }

    function setTanukiImage(string calldata _tanukiImage) external onlyOwner {
        tanukiImage = _tanukiImage;
    }
}
