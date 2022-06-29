// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/ITokenToSwapCollector.sol";

contract TokenToSwapCollector is ITokenToSwapCollector {
    IERC20Metadata public immutable deflationToken;
    IERC20Metadata public immutable tokenToSwap;

    constructor(IERC20Metadata _deflationToken, IERC20Metadata _tokenToSwap) {
        require(
            address(_deflationToken) != address(0),
            "Deflation token address can't be 0"
        );
        require(
            address(_deflationToken) != address(0),
            "Deflation token address can't be 0"
        );
        deflationToken = _deflationToken;
        tokenToSwap = _tokenToSwap;
    }

    modifier onlyToken() {
        require(msg.sender == address(deflationToken));
        _;
    }

    function sendAllTokensToDeflationToken() external onlyToken {
        uint256 amount = tokenToSwap.balanceOf(address(this));

        tokenToSwap.transfer(address(deflationToken), amount);

        emit AllTokensSentToDeflationToken(amount);
    }
}
