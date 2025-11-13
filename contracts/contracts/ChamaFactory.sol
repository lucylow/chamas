// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./Chama.sol";
import "./ChamaToken.sol";

/**
 * @title ChamaFactory
 * @dev Creates and manages multiple Chama instances
 * Acts as the entry point for all chama operations
 */
contract ChamaFactory is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public chamaImplementation;
    address public chamaTokenImplementation;

    // chamaId => Chama contract address
    mapping(uint256 => address) public chamas;

    // chamaId => Chama details
    mapping(uint256 => ChamaDetails) public chamaDetails;

    // user => list of chama IDs they joined
    mapping(address => uint256[]) public userChamas;

    // Global counter for chama IDs
    uint256 public chamaCounter;

    struct ChamaDetails {
        string name;
        string description;
        address creator;
        uint256 contributionAmount;
        uint256 contributionFrequency;
        address tokenAddress;
        uint256 maxMembers;
        uint256 createdAt;
        bool archived;
        uint256 totalContributed;
    }

    event ChamaCreated(
        uint256 indexed chamaId,
        address indexed creator,
        address chamaAddress,
        string name,
        uint256 contributionAmount
    );

    event MemberJoined(
        uint256 indexed chamaId,
        address indexed member,
        uint256 timestamp
    );

    event ContributionMade(
        uint256 indexed chamaId,
        address indexed contributor,
        uint256 amount,
        uint256 timestamp
    );

    event PayoutDistributed(
        uint256 indexed chamaId,
        address indexed recipient,
        uint256 amount,
        uint256 rotationRound
    );

    event ChamaArchived(uint256 indexed chamaId, uint256 timestamp);

    constructor(address _chamaImpl, address _tokenImpl) {
        chamaImplementation = _chamaImpl;
        chamaTokenImplementation = _tokenImpl;
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createChama(
        string memory _name,
        string memory _description,
        uint256 _contributionAmount,
        uint256 _contributionFrequency,
        address _tokenAddress,
        uint256 _maxMembers
    ) external returns (uint256 chamaId) {
        require(_contributionAmount > 0, "Contribution amount must be > 0");
        require(_maxMembers > 1, "Chama must have at least 2 members");
        require(_tokenAddress != address(0), "Invalid token address");

        chamaCounter++;
        chamaId = chamaCounter;

        address chamaProxy = Clones.clone(chamaImplementation);
        chamas[chamaId] = chamaProxy;

        chamaDetails[chamaId] = ChamaDetails({
            name: _name,
            description: _description,
            creator: msg.sender,
            contributionAmount: _contributionAmount,
            contributionFrequency: _contributionFrequency,
            tokenAddress: _tokenAddress,
            maxMembers: _maxMembers,
            createdAt: block.timestamp,
            archived: false,
            totalContributed: 0
        });

        Chama(chamaProxy).initialize(
            chamaId,
            msg.sender,
            _tokenAddress,
            _contributionAmount,
            _contributionFrequency,
            _maxMembers
        );

        Chama(chamaProxy).addMember(msg.sender);
        userChamas[msg.sender].push(chamaId);

        emit ChamaCreated(
            chamaId,
            msg.sender,
            chamaProxy,
            _name,
            _contributionAmount
        );
        return chamaId;
    }

    function joinChama(uint256 _chamaId) external {
        require(_chamaId > 0 && _chamaId <= chamaCounter, "Invalid chama ID");
        require(!chamaDetails[_chamaId].archived, "Chama is archived");

        address chamaAddr = chamas[_chamaId];
        require(chamaAddr != address(0), "Chama not found");

        Chama(chamaAddr).addMember(msg.sender);
        userChamas[msg.sender].push(_chamaId);

        emit MemberJoined(_chamaId, msg.sender, block.timestamp);
    }

    function contribute(uint256 _chamaId, uint256 _amount) external {
        require(_chamaId > 0 && _chamaId <= chamaCounter, "Invalid chama ID");

        ChamaDetails storage details = chamaDetails[_chamaId];
        require(!details.archived, "Chama is archived");
        require(_amount == details.contributionAmount, "Invalid contribution amount");

        address chamaAddr = chamas[_chamaId];
        IERC20(details.tokenAddress).transferFrom(msg.sender, chamaAddr, _amount);

        Chama(chamaAddr).recordContribution(msg.sender, _amount);

        details.totalContributed += _amount;

        emit ContributionMade(_chamaId, msg.sender, _amount, block.timestamp);
    }

    function distributePayout(
        uint256 _chamaId,
        address _recipient,
        uint256 _rotationRound
    ) external {
        require(_chamaId > 0 && _chamaId <= chamaCounter, "Invalid chama ID");

        ChamaDetails storage details = chamaDetails[_chamaId];
        address chamaAddr = chamas[_chamaId];
        require(msg.sender == details.creator, "Only creator can distribute");

        uint256 payoutAmount = Chama(chamaAddr).calculatePayout(_rotationRound);
        Chama(chamaAddr).distributePayout(_recipient, _rotationRound, payoutAmount);

        emit PayoutDistributed(_chamaId, _recipient, payoutAmount, _rotationRound);
    }

    function getUserChamas(address _user) external view returns (uint256[] memory) {
        return userChamas[_user];
    }

    function getChamaDetails(uint256 _chamaId)
        external
        view
        returns (ChamaDetails memory)
    {
        return chamaDetails[_chamaId];
    }

    function getActiveChamaIds() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= chamaCounter; i++) {
            if (!chamaDetails[i].archived) {
                count++;
            }
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= chamaCounter; i++) {
            if (!chamaDetails[i].archived) {
                result[idx] = i;
                idx++;
            }
        }
        return result;
    }

    function archiveChama(uint256 _chamaId) external {
        require(_chamaId > 0 && _chamaId <= chamaCounter, "Invalid chama ID");
        require(msg.sender == chamaDetails[_chamaId].creator, "Only creator can archive");

        chamaDetails[_chamaId].archived = true;
        emit ChamaArchived(_chamaId, block.timestamp);
    }
}



