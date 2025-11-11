// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChamaFactory {
    struct Chama {
        uint256 id;
        string name;
        address owner;
        uint256 memberCount;
        uint256 contributionAmount;
        uint256 contributionFrequency;
        uint256 totalFunds;
        bool active;
    }

    uint256 public chamaCount;
    mapping(uint256 => Chama) private chamas;
    mapping(uint256 => mapping(address => bool)) private members;

    event ChamaCreated(uint256 indexed chamaId, string name, address indexed owner);
    event ChamaJoined(uint256 indexed chamaId, address indexed member);
    event ContributionReceived(uint256 indexed chamaId, address indexed member, uint256 amount);

    function createChama(
        string memory name,
        uint256 contributionAmount,
        uint256 contributionFrequency
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(contributionAmount > 0, "Contribution amount must be positive");
        require(contributionFrequency > 0, "Contribution frequency must be positive");

        chamaCount += 1;
        Chama storage chama = chamas[chamaCount];
        chama.id = chamaCount;
        chama.name = name;
        chama.owner = msg.sender;
        chama.memberCount = 1;
        chama.contributionAmount = contributionAmount;
        chama.contributionFrequency = contributionFrequency;
        chama.active = true;
        members[chamaCount][msg.sender] = true;

        emit ChamaCreated(chama.id, name, msg.sender);
        return chama.id;
    }

    function joinChama(uint256 chamaId) external {
        Chama storage chama = chamas[chamaId];
        require(chama.active, "Chama inactive");
        require(chama.owner != address(0), "Chama does not exist");
        require(!members[chamaId][msg.sender], "Already a member");

        members[chamaId][msg.sender] = true;
        chama.memberCount += 1;

        emit ChamaJoined(chamaId, msg.sender);
    }

    function contribute(uint256 chamaId) external payable {
        Chama storage chama = chamas[chamaId];
        require(chama.active, "Chama inactive");
        require(chama.owner != address(0), "Chama does not exist");
        require(members[chamaId][msg.sender], "Not a member");
        require(msg.value >= chama.contributionAmount, "Contribution below minimum");

        chama.totalFunds += msg.value;

        emit ContributionReceived(chamaId, msg.sender, msg.value);
    }

    function isMember(uint256 chamaId, address account) external view returns (bool) {
        return members[chamaId][account];
    }

    function getChamaInfo(uint256 chamaId) external view returns (Chama memory) {
        return chamas[chamaId];
    }
}

