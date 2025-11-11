// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Chama
 * @dev Represents an individual savings/investment group deployed as a minimal proxy clone.
 *      All state updates are orchestrated through the factory contract for consistency.
 */
contract Chama {
    using SafeERC20 for IERC20;

    error Chama__AlreadyInitialized();
    error Chama__ZeroAddress();
    error Chama__Inactive();
    error Chama__OnlyFactory();
    error Chama__AlreadyMember();
    error Chama__MaxMembersReached();
    error Chama__NotMember();
    error Chama__InsufficientContribution(uint256 provided, uint256 required);
    error Chama__RotationNotReady(uint256 currentTime, uint256 nextRotationTime);
    error Chama__InsufficientBalance(uint256 available, uint256 required);
    error Chama__NoMembers();
    error Chama__InvalidContributionConfiguration();
    error Chama__InvalidMaxMembers();

    event MemberJoined(address indexed member, uint256 memberCount);
    event ContributionRecorded(address indexed member, uint256 amount, uint256 totalContributed);
    event RotationProcessed(uint256 indexed round, address indexed recipient, uint256 payoutAmount);
    event Deactivated();

    string public name;
    string public description;
    uint256 public contributionAmount;
    uint256 public contributionFrequency;
    address public contributionToken;
    uint256 public maxMembers;
    uint256 public nextRotationTime;
    uint256 public currentRound;
    bool public active;

    address public factory;
    address public creator;

    bool private initialized;

    address[] private memberList;
    mapping(address => bool) private memberStatus;
    mapping(address => uint256) private memberContributionTotals;
    mapping(uint256 => address) private rotationRecipients;

    modifier onlyFactory() {
        if (msg.sender != factory) revert Chama__OnlyFactory();
        _;
    }

    modifier whenActive() {
        if (!active) revert Chama__Inactive();
        _;
    }

    /**
     * @notice Initializes the chama clone.
     * @dev Can only be called once by the factory immediately after deployment.
     */
    function initialize(
        string memory _name,
        string memory _description,
        address _factory,
        address _creator,
        address _token,
        uint256 _contributionAmount,
        uint256 _contributionFrequency,
        uint256 _maxMembers
    ) external {
        if (initialized) revert Chama__AlreadyInitialized();
        if (_factory == address(0) || _creator == address(0) || _token == address(0)) {
            revert Chama__ZeroAddress();
        }
        if (_contributionAmount == 0 || _contributionFrequency == 0) {
            revert Chama__InvalidContributionConfiguration();
        }
        if (_maxMembers == 0) revert Chama__InvalidMaxMembers();

        name = _name;
        description = _description;
        factory = _factory;
        creator = _creator;
        contributionToken = _token;
        contributionAmount = _contributionAmount;
        contributionFrequency = _contributionFrequency;
        maxMembers = _maxMembers;
        active = true;
        initialized = true;

        memberList.push(_creator);
        memberStatus[_creator] = true;

        nextRotationTime = block.timestamp + _contributionFrequency;
    }

    function deactivate() external onlyFactory whenActive {
        active = false;
        emit Deactivated();
    }

    function join(address member) external onlyFactory whenActive {
        if (member == address(0)) revert Chama__ZeroAddress();
        if (memberStatus[member]) revert Chama__AlreadyMember();
        if (memberList.length >= maxMembers) revert Chama__MaxMembersReached();

        memberStatus[member] = true;
        memberList.push(member);

        emit MemberJoined(member, memberList.length);
    }

    function recordContribution(address member, uint256 amount) external onlyFactory whenActive {
        if (!memberStatus[member]) revert Chama__NotMember();
        if (amount < contributionAmount) revert Chama__InsufficientContribution(amount, contributionAmount);

        memberContributionTotals[member] += amount;
        emit ContributionRecorded(member, amount, memberContributionTotals[member]);
    }

    function processRotation()
        external
        onlyFactory
        whenActive
        returns (address recipient, uint256 payoutAmount, uint256 roundIndex)
    {
        if (memberList.length == 0) revert Chama__NoMembers();
        if (block.timestamp < nextRotationTime) {
            revert Chama__RotationNotReady(block.timestamp, nextRotationTime);
        }

        roundIndex = currentRound;
        uint256 memberIndex = roundIndex % memberList.length;
        recipient = memberList[memberIndex];

        payoutAmount = calculatePayout(roundIndex);
        uint256 balance = IERC20(contributionToken).balanceOf(address(this));
        if (balance < payoutAmount) {
            revert Chama__InsufficientBalance(balance, payoutAmount);
        }

        rotationRecipients[roundIndex] = recipient;
        currentRound = roundIndex + 1;
        nextRotationTime = block.timestamp + contributionFrequency;

        IERC20(contributionToken).safeTransfer(recipient, payoutAmount);

        emit RotationProcessed(roundIndex, recipient, payoutAmount);
    }

    function calculatePayout(uint256 /*_round*/ ) public view returns (uint256) {
        return contributionAmount * memberList.length;
    }

    function isMember(address account) external view returns (bool) {
        return memberStatus[account];
    }

    function memberCount() external view returns (uint256) {
        return memberList.length;
    }

    function members() external view returns (address[] memory) {
        return memberList;
    }

    function totalContributed(address member) external view returns (uint256) {
        return memberContributionTotals[member];
    }

    function rotationRecipient(uint256 round) external view returns (address) {
        return rotationRecipients[round];
    }
}

