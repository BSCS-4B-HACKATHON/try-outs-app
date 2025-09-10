// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BSCS4BBudgetBill {
    address public owner;

    struct BSCS4BBudgetBillTxn {
        address from;
        string senderName;
        address to;
        string recipientName;
        uint256 amount;
        string currency;
        string purpose;
        uint256 date;
    }

    BSCS4BBudgetBillTxn[] public transactions;

    // mapping for quick checks + array for enumeration
    mapping(address => bool) public approvedSenders;
    address[] private approvedSendersList;

    mapping(address => bool) public approvedRecipients;
    address[] private approvedRecipientsList;

    event TransactionRecorded(
        uint256 indexed index,
        address indexed from,
        string senderName,
        address indexed to,
        string recipientName,
        uint256 amount,
        string currency,
        string purpose,
        uint256 date
    );

    event SenderApproved(address indexed who, bool approved);
    event RecipientApproved(address indexed who, bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyApprovedSender() {
        require(approvedSenders[msg.sender], "Sender not approved");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // helper to add to array without duplicates
    function _addToList(address[] storage list, address who) internal {
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == who) return;
        }
        list.push(who);
    }

    // helper to remove (swap-pop)
    function _removeFromList(address[] storage list, address who) internal {
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == who) {
                list[i] = list[list.length - 1];
                list.pop();
                return;
            }
        }
    }

    // owner manages allowed senders/recipients and list is kept in sync
    function setApprovedSender(address who, bool approved) external onlyOwner {
        if (approved) {
            if (!approvedSenders[who]) {
                approvedSenders[who] = true;
                _addToList(approvedSendersList, who);
                emit SenderApproved(who, true);
            }
        } else {
            if (approvedSenders[who]) {
                approvedSenders[who] = false;
                _removeFromList(approvedSendersList, who);
                emit SenderApproved(who, false);
            }
        }
    }

    function setApprovedRecipient(address who, bool approved) external onlyOwner {
        if (approved) {
            if (!approvedRecipients[who]) {
                approvedRecipients[who] = true;
                _addToList(approvedRecipientsList, who);
                emit RecipientApproved(who, true);
            }
        } else {
            if (approvedRecipients[who]) {
                approvedRecipients[who] = false;
                _removeFromList(approvedRecipientsList, who);
                emit RecipientApproved(who, false);
            }
        }
    }

    // view helpers to enumerate approved wallets
    function getApprovedSenders() external view returns (address[] memory) {
        return approvedSendersList;
    }

    function getApprovedRecipients() external view returns (address[] memory) {
        return approvedRecipientsList;
    }

    // convenience check (mapping is public too)
    function isApprovedSender(address who) external view returns (bool) {
        return approvedSenders[who];
    }

    function isApprovedRecipient(address who) external view returns (bool) {
        return approvedRecipients[who];
    }

    function addTransaction(
        string calldata senderName,
        address to,
        string calldata recipientName,
        uint256 amount,
        string calldata currency,
        string calldata purpose,
        uint256 date
    ) external onlyApprovedSender returns (uint256) {
        require(approvedRecipients[to], "Recipient not approved");

        // push empty storage slot and populate to reduce stack usage
        transactions.push();
        uint256 idx = transactions.length - 1;
        BSCS4BBudgetBillTxn storage txEntry = transactions[idx];

        txEntry.from = msg.sender;
        txEntry.senderName = senderName;
        txEntry.to = to;
        txEntry.recipientName = recipientName;
        txEntry.amount = amount;
        txEntry.currency = currency;
        txEntry.purpose = purpose;
        txEntry.date = date;

        emit TransactionRecorded(
            idx,
            txEntry.from,
            txEntry.senderName,
            txEntry.to,
            txEntry.recipientName,
            txEntry.amount,
            txEntry.currency,
            txEntry.purpose,
            txEntry.date
        );

        return idx;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 index) external view returns (BSCS4BBudgetBillTxn memory) {
        require(index < transactions.length, "Index OOB");
        return transactions[index];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero addr");
        owner = newOwner;
    }
}