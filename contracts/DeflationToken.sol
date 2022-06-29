// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./libraries/PancakeLibrary.sol";
import "./interfaces/ITokenToSwapCollector.sol";
import "./interfaces/IPancakeFactory.sol";
import "hardhat/console.sol";

contract DeflationToken is ERC20, Ownable {
    IERC20Metadata public immutable tokenToSwap;
    IUniswapV2Router02 public immutable router;
    ITokenToSwapCollector public tokenToSwapCollector;

    mapping(address => bool) noFee;

    event CollectorSetted(ITokenToSwapCollector collector);
    event LiquidityWithSwapTokenAdded(
        uint256 thisTokenAmount,
        uint256 tokenToSwapAmount
    );

    constructor(
        uint256 initialSupply,
        IERC20Metadata _tokenToSwap,
        IUniswapV2Router02 _router
    ) ERC20("Deflation", "DFL") {
        require(
            address(_tokenToSwap) != address(0),
            "Token to swap address can't be 0"
        );
        require(address(_router) != address(0), "Router address can't be 0");
        _mint(msg.sender, initialSupply);
        tokenToSwap = _tokenToSwap;
        router = _router;
        noFee[address(tokenToSwap)] = true;
        noFee[address(router)] = true;
        noFee[owner()] = true;
    }

    function setCollector(ITokenToSwapCollector collector) external onlyOwner {
        require(
            address(collector) != address(0),
            "Collector address can't be 0"
        );
        tokenToSwapCollector = collector;

        emit CollectorSetted(collector);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(
            address(tokenToSwapCollector) != address(0),
            "Collector is not setted yet"
        );
        address sender = _msgSender();
        if (noFee[sender]) {
            super._transfer(from, to, amount);
        } else {
            console.log("Not in whitelist", sender);
            super._transfer(sender, owner(), (amount * 2) / 100); //2% to owner
            address[] memory path = new address[](2);
            path[0] = address(this);
            path[1] = address(tokenToSwap);
            _approve(address(this), address(router), (amount * 2) / 100); //approve for swap
            super._transfer(sender, address(this), (amount * 2) / 100); //transfer to this token 2%
            uint256[] memory amounts = router.swapExactTokensForTokens(
                amount / 100,
                0,
                path,
                address(tokenToSwapCollector), //я бы прописал сюда address(this), но он не позволяет переводить токены пары на адрес самого токена
                block.timestamp //можно было бы переводить на адрес овнера, но тогда овнеру приходилось постоянно бы вручную переводить эти токены на этот адрес
            ); //swap 1 half of 2%

            _approve(address(this), address(router), amounts[0]); //swaps
            tokenToSwap.approve(address(router), amounts[1]); //for addLiquidity
            super._transfer(sender, address(this), amounts[0]);
            tokenToSwapCollector.sendAllTokensToDeflationToken();
            router.addLiquidity(
                address(this),
                address(tokenToSwap),
                amounts[0],
                amounts[1],
                0,
                0,
                owner(),
                block.timestamp
            ); //2% for liquidity
            super._transfer(
                sender,
                0x000000000000000000000000000000000000dEaD,
                amount / 100
            ); //1% to dead address
            super._transfer(sender, to, (amount * 95) / 100); //residue 95% to receiver
        }
    }

    //this contract must have thisTokenAmount, tokenToSwapAmount balance and allowance
    function addLiquidity(uint256 thisTokenAmount, uint256 tokenToSwapAmount)
        external
    {
        _approve(address(this), address(router), thisTokenAmount);
        tokenToSwap.approve(address(router), tokenToSwapAmount);
        router.addLiquidity(
            address(this),
            address(tokenToSwap),
            thisTokenAmount,
            tokenToSwapAmount,
            0,
            0,
            owner(),
            block.timestamp
        );
        noFee[
            IPancakeFactory(router.factory()).getPair(
                address(this),
                address(tokenToSwap)
            )
        ] = true;

        emit LiquidityWithSwapTokenAdded(thisTokenAmount, tokenToSwapAmount);
    }
}
