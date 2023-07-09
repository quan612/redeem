// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ERC20Test is ERC20 {
    mapping(address => bool) private _frozenAddresses;

    constructor(uint256 initialSupply) ERC20("WETH Test", "WETH") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function freeze(address addressToFreeze) public returns (bool) {
        _frozenAddresses[addressToFreeze] = true;
        return true;
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        require(_frozenAddresses[recipient] != true, "TEST_ERC20: blacklisted address");
        super.transfer(recipient, amount);
        return true;
    }
}
