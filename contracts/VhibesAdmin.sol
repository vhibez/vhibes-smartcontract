// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./VhibesPoints.sol";
import "./VhibesBadges.sol";
import "./RoastMeContract.sol";
import "./IcebreakerContract.sol";
import "./ChainReactionContract.sol";

contract VhibesAdmin is Ownable {
    
    VhibesPoints public pointsContract;
    VhibesBadges public badgesContract;
    RoastMeContract public roastContract;
    IcebreakerContract public icebreakerContract;
    ChainReactionContract public chainReactionContract;
    
    mapping(address => bool) public authorizedAdmins;
    
    // Temp test counter
    uint256 public tempTestCounter;
    
    event AdminAuthorized(address indexed admin);
    event AdminDeauthorized(address indexed admin);
    event PointsUpdated(string contractName, uint256 newPointsPerAction, uint256 newPointsPerVote, uint256 newPointsPerBonus);
    event CategoryCreated(uint256 categoryId, string name, string description);
    event BadgeURIsUpdated();
    event BadgeRequirementsUpdated();
    event TempTestCounterIncremented(address indexed admin, uint256 newValue);
    event TempTestCounterDecremented(address indexed admin, uint256 newValue);

    modifier onlyAuthorized() {
        require(authorizedAdmins[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address admin) Ownable(admin) {}

    function setContracts(
        address _pointsContract,
        address _badgesContract,
        address _roastContract,
        address _icebreakerContract,
        address _chainReactionContract
    ) external onlyOwner {
        pointsContract = VhibesPoints(_pointsContract);
        badgesContract = VhibesBadges(_badgesContract);
        roastContract = RoastMeContract(_roastContract);
        icebreakerContract = IcebreakerContract(_icebreakerContract);
        chainReactionContract = ChainReactionContract(_chainReactionContract);
    }

    function authorizeAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid admin address");
        authorizedAdmins[admin] = true;
        emit AdminAuthorized(admin);
    }

    function deauthorizeAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid admin address");
        authorizedAdmins[admin] = false;
        emit AdminDeauthorized(admin);
    }

    // Points Management
    function updateRoastMePoints(uint256 newPointsPerRoast, uint256 newPointsPerVote, uint256 newPointsPerFunnyVote) external onlyAuthorized {
        roastContract.updatePoints(newPointsPerRoast, newPointsPerVote, newPointsPerFunnyVote);
        emit PointsUpdated("RoastMe", newPointsPerRoast, newPointsPerVote, newPointsPerFunnyVote);
    }

    function updateIcebreakerPoints(uint256 newPointsPerPrompt, uint256 newPointsPerResponse, uint256 newPointsPerVote) external onlyAuthorized {
        icebreakerContract.updatePoints(newPointsPerPrompt, newPointsPerResponse, newPointsPerVote);
        emit PointsUpdated("Icebreaker", newPointsPerPrompt, newPointsPerResponse, newPointsPerVote);
    }

    function updateChainReactionPoints(uint256 newPointsPerChallenge, uint256 newPointsPerResponse) external onlyAuthorized {
        chainReactionContract.updatePoints(newPointsPerChallenge, newPointsPerResponse);
        emit PointsUpdated("ChainReaction", newPointsPerChallenge, newPointsPerResponse, 0);
    }

    function updateDailyLoginPoints(uint256 newDailyLoginPoints, uint256 newStreakBonusPoints, uint256 newActivityStreakBonus) external onlyAuthorized {
        pointsContract.updatePointValues(newDailyLoginPoints, newStreakBonusPoints, newActivityStreakBonus);
        emit PointsUpdated("DailyLogin", newDailyLoginPoints, newStreakBonusPoints, newActivityStreakBonus);
    }

    // Category Management
    function createIcebreakerCategory(string memory name, string memory description) external onlyAuthorized returns (uint256) {
        uint256 categoryId = icebreakerContract.createCategory(name, description);
        emit CategoryCreated(categoryId, name, description);
        return categoryId;
    }

    // Badge Management
    function setBadgeURIs(
        string memory _firstActivityBadgeURI,
        string memory _loginStreakBadgeURI,
        string memory _activityStreakBadgeURI,
        string memory _topRoasterBadgeURI,
        string memory _chainMasterBadgeURI,
        string memory _icebreakerBadgeURI
    ) external onlyAuthorized {
        badgesContract.setBadgeURIs(
            _firstActivityBadgeURI,
            _loginStreakBadgeURI,
            _activityStreakBadgeURI,
            _topRoasterBadgeURI,
            _chainMasterBadgeURI,
            _icebreakerBadgeURI
        );
        emit BadgeURIsUpdated();
    }

    function setBadgeRequirements(
        uint256 _firstActivityRequirement,
        uint256 _loginStreakRequirement,
        uint256 _activityStreakRequirement,
        uint256 _topRoasterRequirement,
        uint256 _chainMasterRequirement,
        uint256 _icebreakerRequirement
    ) external onlyAuthorized {
        badgesContract.setBadgeRequirements(
            _firstActivityRequirement,
            _loginStreakRequirement,
            _activityStreakRequirement,
            _topRoasterRequirement,
            _chainMasterRequirement,
            _icebreakerRequirement
        );
        emit BadgeRequirementsUpdated();
    }

    function setBadgeBaseURI(string memory newBaseURI) external onlyAuthorized {
        badgesContract.setBaseURI(newBaseURI);
    }

    // Contract Authorization
    function authorizeContractInPoints(address contractAddress) external onlyAuthorized {
        pointsContract.authorizeContract(contractAddress);
    }

    function deauthorizeContractInPoints(address contractAddress) external onlyAuthorized {
        pointsContract.deauthorizeContract(contractAddress);
    }

    function authorizeMinterInBadges(address minter) external onlyAuthorized {
        badgesContract.authorizeMinter(minter);
    }

    function deauthorizeMinterInBadges(address minter) external onlyAuthorized {
        badgesContract.deauthorizeMinter(minter);
    }

    // Emergency Functions
    function emergencyPause() external onlyOwner {
        // This would pause all contracts if they had pause functionality
        // For now, this is a placeholder for future implementation
    }

    function emergencyUnpause() external onlyOwner {
        // This would unpause all contracts if they had pause functionality
        // For now, this is a placeholder for future implementation
    }

    // View Functions
    function getPoints(address user) external view returns (uint256) {
        return pointsContract.getPoints(user);
    }

    function getLoginStreak(address user) external view returns (uint256) {
        return pointsContract.getLoginStreak(user);
    }

    function getActivityStreak(address user) external view returns (uint256) {
        return pointsContract.getActivityStreak(user);
    }

    function getUserBadges(address user) external view returns (uint256[] memory) {
        return badgesContract.getBadges(user);
    }

    function getRoastMeStats() external view returns (uint256 totalRoasts) {
        return roastContract.totalRoasts();
    }

    function getIcebreakerStats() external view returns (uint256 totalCategories, uint256 totalPrompts, uint256 totalPolls) {
        return (icebreakerContract.totalCategories(), icebreakerContract.totalPrompts(), icebreakerContract.totalPolls());
    }

    function getChainReactionStats() external view returns (uint256 totalChallenges, uint256 totalResponses) {
        return (chainReactionContract.totalChallenges(), chainReactionContract.totalResponses());
    }

    function getCategories() external view returns (IcebreakerContract.Category[] memory) {
        return icebreakerContract.getCategories();
    }

    function isAuthorizedAdmin(address admin) external view returns (bool) {
        return authorizedAdmins[admin] || admin == owner();
    }
}
