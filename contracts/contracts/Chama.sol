// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title Chama
 * @dev Individual chama group contract (used as implementation for proxy clones)
 * Handles member management, contributions, and rotation logic
 */
contract Chama is ReentrancyGuard, Initializable {
    uint256 public chamaId;
    address public factory;
    address public creator;
    address public tokenAddress;

    uint256 public contributionAmount;
    uint256 public contributionFrequency;
    uint256 public maxMembers;
    uint256 public createdAt;

    uint256 public currentRound = 1;
    uint256 public nextRotationTime;

    address[] public members;
    mapping(address => bool) public isMember;

    mapping(address => uint256) public totalContributed;
    mapping(uint256 => mapping(address => uint256)) public roundContributions; // round => member => amount
    mapping(uint256 => address) public roundRecipient; // round => recipient address
    mapping(uint256 => bool) public roundPaid; // round => has payout been made
    mapping(address => uint256[]) public recipientHistory; // recipient => list of rounds they received

    event MemberAdded(address indexed member, uint256 timestamp);
    event ContributionRecorded(address indexed member, uint256 amount, uint256 round);
    event RotationProcessed(uint256 indexed round, address indexed recipient, uint256 totalFunds);
    event PayoutReleased(uint256 indexed round, address indexed recipient, uint256 amount);

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member");
        _;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator can call");
        _;
    }

    function initialize(
        uint256 _chamaId,
        address _creator,
        address _tokenAddress,
        uint256 _contributionAmount,
        uint256 _contributionFrequency,
        uint256 _maxMembers
    ) external initializer {
        chamaId = _chamaId;
        factory = msg.sender;
        creator = _creator;
        tokenAddress = _tokenAddress;
        contributionAmount = _contributionAmount;
        contributionFrequency = _contributionFrequency;
        maxMembers = _maxMembers;
        createdAt = block.timestamp;
        nextRotationTime = block.timestamp + _contributionFrequency;
    }

    function addMember(address _member) external onlyFactory {
        require(!isMember[_member], "Already a member");
        require(members.length < maxMembers, "Chama is full");
        members.push(_member);
        isMember[_member] = true;
        emit MemberAdded(_member, block.timestamp);
    }

    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function recordContribution(address _member, uint256 _amount) external onlyFactory nonReentrant {
        require(isMember[_member], "Not a member");
        require(_amount == contributionAmount, "Incorrect amount");
        if (block.timestamp >= nextRotationTime && members.length > 0) {
            processRotation();
        }
        roundContributions[currentRound][_member] += _amount;
        totalContributed[_member] += _amount;
        emit ContributionRecorded(_member, _amount, currentRound);
    }

    function getMemberContribution(address _member, uint256 _round) external view returns (uint256) {
        return roundContributions[_round][_member];
    }

    function processRotation() public {
        require(members.length > 0, "No members");
        require(block.timestamp >= nextRotationTime, "Rotation not yet due");
        uint256 round = currentRound;
        uint256 memberIndex = (round - 1) % members.length;
        address nextRecipient = members[memberIndex];
        roundRecipient[round] = nextRecipient;
        recipientHistory[nextRecipient].push(round);
        uint256 payoutAmount = calculatePayout(round);
        currentRound++;
        nextRotationTime = block.timestamp + contributionFrequency;
        emit RotationProcessed(round, nextRecipient, payoutAmount);
    }

    function distributePayout(
        address _recipient,
        uint256 _round,
        uint256 _amount
    ) external onlyFactory nonReentrant {
        require(!roundPaid[_round], "Round already paid");
        require(roundRecipient[_round] == _recipient || roundRecipient[_round] == address(0), "Invalid recipient");
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        require(balance >= _amount, "Insufficient balance");
        roundRecipient[_round] = _recipient;
        roundPaid[_round] = true;
        IERC20(tokenAddress).transfer(_recipient, _amount);
        emit PayoutReleased(_round, _recipient, _amount);
    }

    function calculatePayout(uint256 _round) public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < members.length; i++) {
            total += roundContributions[_round][members[i]];
        }
        return total;
    }

    function getCurrentRound() external view returns (uint256) {
        return currentRound;
    }

    function getRotationRecipient(uint256 _round) external view returns (address) {
        return roundRecipient[_round];
    }

    function getBalance() external view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function getRoundPaid(uint256 _round) external view returns (bool) {
        return roundPaid[_round];
    }

    function getRecipientHistory(address _member) external view returns (uint256[] memory) {
        return recipientHistory[_member];
    }
}

