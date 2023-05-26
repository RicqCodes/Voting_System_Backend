const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory and signer
  const Contract = await ethers.getContractFactory("Voting");
  const [deployer] = await ethers.getSigners();
  console.log(ethers.utils.formatEther(await deployer.getBalance()));

  const gasPrice = ethers.utils.parseUnits("10", "gwei"); // Set the gas price (e.g., 10 gwei)
  const gasLimit = 3000000; // Set the gas limit (e.g., 3 million)

  // Deploy the contract
  const contract = await Contract.deploy({ gasPrice, gasLimit });

  // Wait for the contract to be mined and get the deployed address
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);

  // Print the deployer's address
  console.log("Deployer address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
