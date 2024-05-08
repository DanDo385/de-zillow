// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address from, address to, uint256 id) external;
}

/// @title A contract for handling escrow transactions of NFT-based real estate
contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    /// @dev Ensures only the buyer of the NFT can execute
    modifier onlyBuyer(uint256 nftID) {
        require(msg.sender == buyer[nftID], "Only buyer can call");
        _;
    }

    /// @dev Ensures only the seller can execute
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call");
        _;
    }

    /// @dev Ensures only the inspector can execute
    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call");
        _;
    }

    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    /// @notice Lists an NFT for sale in the escrow contract
    function list(uint256 nftID, address buyerAddress, uint256 purchasePriceAmount, uint256 escrowAmountValue)
        public
        payable
        onlySeller
    {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), nftID);

        isListed[nftID] = true;
        purchasePrice[nftID] = purchasePriceAmount;
        escrowAmount[nftID] = escrowAmountValue;
        buyer[nftID] = buyerAddress;
    }

    /// @notice Deposits earnest money for the NFT
    function depositEarnest(uint256 nftID) public payable onlyBuyer(nftID) {
        require(msg.value >= escrowAmount[nftID], "Insufficient earnest deposit");
    }

    /// @notice Updates the inspection status for the NFT
    function updateInspectionStatus(uint256 nftID, bool passed) public onlyInspector {
        inspectionPassed[nftID] = passed;
    }

    /// @notice Records approval to proceed with the sale
    function approveSale(uint256 nftID) public {
        approval[nftID][msg.sender] = true;
    }

    /// @notice Finalizes the sale transferring ownership and funds
    function finalizeSale(uint256 nftID) public {
        require(inspectionPassed[nftID], "Inspection not passed");
        require(approval[nftID][buyer[nftID]], "Buyer has not approved");
        require(approval[nftID][seller], "Seller has not approved");
        require(approval[nftID][lender], "Lender has not approved");
        require(address(this).balance >= purchasePrice[nftID], "Insufficient funds to complete sale");

        isListed[nftID] = false;

        // Transfer all funds to the seller
        (bool success, ) = seller.call{value: address(this).balance}("");
        require(success, "Payment to seller failed");

        // Transfer NFT ownership to the buyer
        IERC721(nftAddress).transferFrom(address(this), buyer[nftID], nftID);
    }

    /// @notice Cancels the sale returning funds appropriately based on inspection results
    function cancelSale(uint256 nftID) public {
        if (!inspectionPassed[nftID]) {
            payable(buyer[nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    /// @notice Allows the contract to receive funds
    receive() external payable {}

    /// @notice Returns the balance held in the contract
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
