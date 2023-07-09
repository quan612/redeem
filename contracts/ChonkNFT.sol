// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ChonkNFT is ERC1155 {

  constructor() public ERC1155("https://farm.chonker.finance/api/NFT/") {
  }

  function mint(address receiver, uint256 id, uint256 amount) public {
    _mint(receiver, id, amount, "");
  }
    
  function burn(uint256 id, uint256 amount) public {
    _burn(_msgSender(), id, amount);
  }

}