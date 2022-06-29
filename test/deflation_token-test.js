//не забыть добавить ликвидности перед трансфером, чтобы можно было обменять дефляционный токен на tokenToSwap


const { expect } = require("chai");
const { utils } = require("ethers");
const { ethers } = require("hardhat");

pancakeRouter = null;
tokenToSwap = null;
deflationToken = null;
const hund_tokens = utils.parseEther("100");

describe("Deployment, transfering tokens, approvance and testing crowdsale", function () {
  

  it("Should deploy saleToken, paymentToken, stakeToken stake and crowdsale contract", async function () {
    const signers = await ethers.getSigners();


    const Factory = await ethers.getContractFactory("PancakeFactory");
    factory = await Factory.deploy(signers[0].address);
    await factory.deployed();

    console.log(`Factory address: ${factory.address}`);

    const WETH = await ethers.getContractFactory("WETH");
    weth = await WETH.deploy();
    await weth.deployed();

    console.log(`weth address: ${weth.address}`);

    const PancakeRouter = await ethers.getContractFactory("PancakeRouter");
    pancakeRouter = await PancakeRouter.deploy(factory.address, weth.address);
    await pancakeRouter.deployed();

    console.log(`router address: ${pancakeRouter.address}`);

    const TokenToSwap = await ethers.getContractFactory("tokenToSwap");
    tokenToSwap = await TokenToSwap.deploy(utils.parseEther("1000")); //emit 1000 tokens
    await tokenToSwap.deployed();

    console.log(`tokenToSwap address: ${tokenToSwap.address}`);


    const DeflationToken = await ethers.getContractFactory("DeflationToken");
    deflationToken = await DeflationToken.deploy(utils.parseEther("1000"), tokenToSwap.address, pancakeRouter.address); //emit 1000 tokens
    await deflationToken.deployed();

    console.log(`deflationToken address: ${deflationToken.address}`);

    const TokenToSwapCollector = await ethers.getContractFactory("TokenToSwapCollector");
    tokenToSwapCollector = await TokenToSwapCollector.deploy(deflationToken.address, tokenToSwap.address); //emit 1000 tokens
    await tokenToSwapCollector.deployed();

    console.log(`tokenToSwapCollector address: ${tokenToSwapCollector.address}`);

    await deflationToken.setCollector(tokenToSwapCollector.address);
  });

  it("Should add liquidity for deflation token and tokenToSwap 1 to 2", async function () {

    //liquidity
    await deflationToken.transfer(deflationToken.address, hund_tokens);
    await tokenToSwap.transfer(deflationToken.address, hund_tokens);
    await deflationToken.addLiquidity(utils.parseEther("50"), hund_tokens);
  });


  it("Should transfer 1 deflation token to alice, alice should receive 0.95 tokens", async function () {
    const signers = await ethers.getSigners();
    alice = signers[1];
    bob = signers[2];
    await deflationToken.approve(pancakeRouter.address, hund_tokens);
    await deflationToken.transfer(alice.address, utils.parseEther("1"));
    await deflationToken.connect(alice).transfer(bob.address, utils.parseEther("0.5"));

    expect(await deflationToken.balanceOf(bob.address)).to.equal(utils.parseEther("0.475"));
  });

  it("Bob should buy and sell deflation token", async function () {
    const signers = await ethers.getSigners();
    bob = signers[2];
    await tokenToSwap.transfer(bob.address, hund_tokens);
    await tokenToSwap.connect(bob).approve(pancakeRouter.address, utils.parseEther("100"));

    
    await pancakeRouter.connect(bob).swapExactTokensForTokens(
        utils.parseEther("1"),
        0,
        [tokenToSwap.address, deflationToken.address],
        bob.address,
        9999999999
    );
    

    await deflationToken.connect(bob).approve(pancakeRouter.address, utils.parseEther("0.4"));
    await pancakeRouter.connect(bob).swapExactTokensForTokens(
      utils.parseEther("0.4"),
      0,
      [deflationToken.address, tokenToSwap.address],
      bob.address,
      9999999999
    );
  });
});
