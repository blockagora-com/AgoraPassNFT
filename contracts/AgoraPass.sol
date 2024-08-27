// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";


contract AgoraPass is ERC721A, Ownable {
    uint256 public maxSupply;
    uint256 public price ;
    string public _baseTokenURI;


    constructor(
        string memory name, 
        string memory symbol, 
        uint256 _maxSupply, 
        uint256 initialPrice
    ) ERC721A(name, symbol) Ownable(msg.sender) {
        maxSupply = _maxSupply;
        price = initialPrice;
    }


    modifier checkSupply(uint quantity) {
        require(totalSupply() + quantity <= maxSupply, "Maximum supply reached");
        _;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function mint(address send_to, uint256 quantity) external payable checkSupply(quantity){
        require(msg.value >= price * quantity, "Incorrect payment amount"); // 检查支付金额
        _mint(send_to, quantity);

        uint256 cost = price * quantity;
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost); // 退还多余的 ETH
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