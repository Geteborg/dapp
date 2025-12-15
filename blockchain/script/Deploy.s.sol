// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Donation.sol";

contract DeployScript is Script {
    function run() external returns (Donation) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        Donation donation = new Donation();
        
        vm.stopBroadcast();
        
        return donation;
    }
}
