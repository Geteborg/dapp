// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Donation {
    address payable public owner;
    uint256 public totalDonations;
    uint256 public donationsCount;
    
    struct DonationMessage {
        address donor;
        uint256 amount;
        string message;
        uint256 timestamp;
    }
    
    mapping(address => uint256) public donations;
    DonationMessage[] public donationMessages;
    
    event DonationReceived(address indexed donor, uint256 amount, string message, uint256 timestamp);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    constructor() {
        owner = payable(msg.sender);
    }
    
    function donate(string memory _message) public payable {
        require(msg.value > 0, "Donation must be greater than 0");
        
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;
        donationsCount++;
        
        donationMessages.push(DonationMessage({
            donor: msg.sender,
            amount: msg.value,
            message: _message,
            timestamp: block.timestamp
        }));
        
        emit DonationReceived(msg.sender, msg.value, _message, block.timestamp);
    }

    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(address(this).balance > 0, "No funds to withdraw");
        
        uint256 balance = address(this).balance;
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(owner, balance);
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getDonation(address donor) public view returns (uint256) {
        return donations[donor];
    }
    
    function getAllMessages() public view returns (DonationMessage[] memory) {
        return donationMessages;
    }
    
    function getMessagesCount() public view returns (uint256) {
        return donationMessages.length;
    }

    function getRecentMessages(uint256 count) public view returns (DonationMessage[] memory) {
        uint256 total = donationMessages.length;
        uint256 returnCount = count > total ? total : count;
        
        DonationMessage[] memory recentMessages = new DonationMessage[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            recentMessages[i] = donationMessages[total - 1 - i];
        }
        
        return recentMessages;
    }
}
