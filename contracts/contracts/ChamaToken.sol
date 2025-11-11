// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChamaToken
 * @dev Optional governance token for chama voting
 * Minted to members based on contributions
 */
contract ChamaToken is ERC20, Ownable {
    uint256 public constant DECIMALS = 18;
    uint256 public tokensPerContribution = 1 * 10 ** DECIMALS;

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyOwner {
        _burn(_from, _amount);
    }
}

