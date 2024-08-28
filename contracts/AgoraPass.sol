// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";


contract AgoraPass is ERC721A, Ownable {
    uint256 public maxSupply;
    uint256 public price ;
    string public _baseTokenURI;
    uint256 public roundTokenNum; // Maximum number of tokens that can be minted in a single transaction


    constructor(
        string memory name, 
        string memory symbol, 
        uint256 _maxSupply, 
        uint256 initialPrice,
        address newowner
    ) ERC721A(name, symbol) Ownable(newowner) {
        maxSupply = _maxSupply;
        price = initialPrice;
        roundTokenNum = 0;
    }


    modifier checkSupply(uint quantity) {
        require(totalSupply() + quantity <= maxSupply, "Maximum supply reached");
        _;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function setRoundTokenNum(uint256 newRoundTokenNum) external onlyOwner {
        roundTokenNum = newRoundTokenNum;
    }

    function mint(address send_to, uint256 quantity) external payable checkSupply(quantity) {
        require(totalSupply() < roundTokenNum, "Quantity exceeds round token limit");
        require(msg.value >= price * quantity, "Incorrect payment amount");
        _mint(send_to, quantity);

        uint256 cost = price * quantity;
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost); // Refund excess ETH
        }
    }

     function adminMint(address send_to,uint256 quantity) external onlyOwner checkSupply(quantity){
        _mint(send_to, quantity);
    }


    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}