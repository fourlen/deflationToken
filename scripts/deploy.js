const hre = require("hardhat");
const { utils } = require("ethers");

const {
    TokenToSwapAmount,
    DeflationTokenAmount,
    RouterAddress
} = process.env;

async function main() {
    const TokenToSwap = await ethers.getContractFactory("tokenToSwap");
    tokenToSwap = await TokenToSwap.deploy(utils.parseEther(TokenToSwapAmount)); //emit 1000 tokens
    await tokenToSwap.deployed();

    console.log(`tokenToSwap address: ${tokenToSwap.address}`);

    const DeflationToken = await ethers.getContractFactory("DeflationToken");
    deflationToken = await DeflationToken.deploy(utils.parseEther(DeflationTokenAmount), tokenToSwap.address, RouterAddress); //emit 1000 tokens
    await deflationToken.deployed();

    console.log(`deflationToken address: ${deflationToken.address}`);

    const TokenToSwapCollector = await ethers.getContractFactory("TokenToSwapCollector");
    tokenToSwapCollector = await TokenToSwapCollector.deploy(deflationToken.address, tokenToSwap.address); //emit 1000 tokens
    await tokenToSwapCollector.deployed();

    console.log(`tokenToSwapCollector address: ${tokenToSwapCollector.address}`);

    await deflationToken.setCollector(tokenToSwapCollector.address);

    try {
        await verifyToken(tokenToSwap, "contracts/test/TokenToSwap.sol:tokenToSwap", utils.parseEther(TokenToSwapAmount));
        console.log("Verify tokenToSwap succees");
    }
    catch {
        console.log("Verify tokenToSwap failed");
    }

    try {
        await verifyDeflationToken(deflationToken, utils.parseEther(DeflationTokenAmount), tokenToSwap.address, RouterAddress);
        console.log("Verify deflationToken succees");
    }
    catch {
        console.log("Verify deflationToken failed");
    }
    try {
        await verifyTokenToSwapCollector(tokenToSwapCollector, deflationToken.address, tokenToSwap.address);
        console.log("Verify TokenToSwapCollector succees");
    }
    catch {
        console.log("Verify TokenToSwapCollector failed");
    }
}

async function verifyToken(token, path, AMOUNT) {
  await hre.run("verify:verify", {
    address: token.address,
    contract: path,
    constructorArguments: [
      AMOUNT
    ]
  })
}

async function verifyDeflationToken(defToken, amount,
    tokenToSwap,
    router) {
  await hre.run("verify:verify", {
    address: defToken.address,
    constructorArguments: [
        amount,
        tokenToSwap,
        router
    ]
  })
}

async function verifyTokenToSwapCollector(
    tokenToSwapCollector, deflationToken, tokenToSwap
) {
await hre.run("verify:verify", {
  address: tokenToSwapCollector.address,
  constructorArguments: [
    deflationToken, 
    tokenToSwap
  ]
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });