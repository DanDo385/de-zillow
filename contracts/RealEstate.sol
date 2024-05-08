// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title A contract for tokenizing real estate as NFTs
contract RealEstate is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // Counter to keep track of token IDs

    /// @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
    constructor() ERC721("De-Zillow", "DZ") {}

    /// @notice Mints a new real estate token
    /// @param tokenURI The URI for token metadata
    /// @return newItemId The newly minted token ID
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment(); // Increment the counter to ensure unique ID
        uint256 newItemId = _tokenIds.current(); // Obtain the new token ID

        _mint(msg.sender, newItemId); // Mint the token to sender
        _setTokenURI(newItemId, tokenURI); // Set the metadata URI for the token

        return newItemId; // Return the new token ID
    }

    // Retrieves the current total supply of minted tokens
    // The total number of tokens minted by this contract
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current(); // Return the current count of the token IDs
    }
}
