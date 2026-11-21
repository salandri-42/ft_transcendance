import hre from "hardhat";

async function main() {
  console.log("Déploiement de TranscendenceArt sur Fuji...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(" Déploiement avec le compte:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(" Balance:", hre.ethers.formatEther(balance), "AVAX");

  if (balance <= 0n) {
    throw new Error("Pas assez d'AVAX ! Allez sur https://faucet.avax.network/");
  }

  console.log(" Déploiement en cours...");
  const TranscendenceArt = await hre.ethers.getContractFactory("TranscendenceArt");
  const contract = await TranscendenceArt.deploy(deployer.address);

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(" TranscendenceArt déployé à:", address);
  console.log(" Vérifier sur:", `https://testnet.snowtrace.io/address/${address}`);
  console.log("\n Sauvegardez cette adresse dans votre .env :");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  });