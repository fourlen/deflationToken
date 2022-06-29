// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

interface ITokenToSwapCollector {
    event AllTokensSentToDeflationToken(uint256 amount);

    function sendAllTokensToDeflationToken() external;
}
