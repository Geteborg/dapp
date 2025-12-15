// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Donation.sol";

contract DonationTest is Test {
    Donation public donation;
    address public owner = address(1);
    address public donor = address(2);

    function setUp() public {
        vm.prank(owner);
        donation = new Donation();
        vm.deal(donor, 10 ether);
    }

    function testDonateWithMessage() public {
        vm.prank(donor);
        donation.donate{value: 1 ether}("Thank you!");

        assertEq(donation.totalDonations(), 1 ether);
        assertEq(donation.donationsCount(), 1);
        assertEq(donation.getMessagesCount(), 1);
    }

    function testGetRecentMessages() public {
        vm.prank(donor);
        donation.donate{value: 1 ether}("Message 1");
        
        vm.prank(donor);
        donation.donate{value: 0.5 ether}("Message 2");

        Donation.DonationMessage[] memory messages = donation.getRecentMessages(2);
        assertEq(messages.length, 2);
        assertEq(messages[0].message, "Message 2");
        assertEq(messages[1].message, "Message 1");
    }

    function testWithdraw() public {
        vm.prank(donor);
        donation.donate{value: 1 ether}("Test donation");

        uint256 balanceBefore = owner.balance;
        vm.prank(owner);
        donation.withdraw();

        assertEq(owner.balance, balanceBefore + 1 ether);
        assertEq(donation.getBalance(), 0);
    }

    function testOnlyOwnerCanWithdraw() public {
        vm.prank(donor);
        donation.donate{value: 1 ether}("Test");

        vm.prank(donor);
        vm.expectRevert("Only owner can withdraw");
        donation.withdraw();
    }

    function testEmptyMessage() public {
        vm.prank(donor);
        donation.donate{value: 0.5 ether}("");

        assertEq(donation.totalDonations(), 0.5 ether);
        assertEq(donation.getMessagesCount(), 1);
    }

    function testMultipleDonations() public {
        vm.prank(donor);
        donation.donate{value: 1 ether}("First");
        
        vm.prank(donor);
        donation.donate{value: 0.5 ether}("Second");

        assertEq(donation.getDonation(donor), 1.5 ether);
        assertEq(donation.donationsCount(), 2);
    }

    function testRevertOnZeroDonation() public {
        vm.prank(donor);
        vm.expectRevert("Donation must be greater than 0");
        donation.donate{value: 0}("Zero donation");
    }
}
