// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VhibesPoints is Ownable {
    
    // Level management
    struct Level {
        string name;
        uint256 minPoints;
        bool exists;
    }
    
    mapping(address => uint256) public userPoints;
    mapping(address => bool) public authorizedContracts;
    mapping(address => uint256) public lastLoginTimestamp;
    mapping(address => uint256) public loginStreak;
    mapping(address => uint256) public activityStreak;
    mapping(address => uint256) public lastActivityTimestamp;
    
    // User tracking for leaderboard
    address[] public userList;
    mapping(address => bool) public isUserTracked;
    
    // Level management mappings
    mapping(uint256 => Level) public levels;
    uint256 public totalLevels;
    
    uint256 public dailyLoginPoints = 5;
    uint256 public streakBonusPoints = 2;
    uint256 public activityStreakBonus = 3;
    uint256 constant DAY = 1 days;
    
    event PointsAwarded(address indexed user, uint256 amount, string reason);
    event PointsDeducted(address indexed user, uint256 amount, string reason);
    event ContractAuthorized(address indexed contractAddress);
    event ContractDeauthorized(address indexed contractAddress);
    event DailyLogin(address indexed user, uint256 points, uint256 streak);
    event ActivityStreak(address indexed user, uint256 streak, uint256 bonusPoints);
    event LevelAdded(uint256 levelId, string name, uint256 minPoints);
    event LevelUpdated(uint256 levelId, string name, uint256 minPoints);
    event LevelRemoved(uint256 levelId);

    constructor(address admin) Ownable(admin) {
        // Initialize default levels
        _addLevel("Vibe Newbie", 0);
        _addLevel("Vibe Enthusiast", 50);
        _addLevel("Vibe Pro", 200);
        _addLevel("Vibe Legend", 500);
        _addLevel("Vibe Master", 1000);
    }

    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    // Level management functions
    function _addLevel(string memory name, uint256 minPoints) internal {
        levels[totalLevels] = Level(name, minPoints, true);
        totalLevels++;
    }

    function addLevel(string memory name, uint256 minPoints) external onlyOwner {
        require(bytes(name).length > 0, "Level name cannot be empty");
        require(minPoints >= 0, "Min points cannot be negative");
        
        _addLevel(name, minPoints);
        emit LevelAdded(totalLevels - 1, name, minPoints);
    }

    function updateLevel(uint256 levelId, string memory name, uint256 minPoints) external onlyOwner {
        require(levelId < totalLevels, "Level does not exist");
        require(bytes(name).length > 0, "Level name cannot be empty");
        require(minPoints >= 0, "Min points cannot be negative");
        
        levels[levelId] = Level(name, minPoints, true);
        emit LevelUpdated(levelId, name, minPoints);
    }

    function removeLevel(uint256 levelId) external onlyOwner {
        require(levelId < totalLevels, "Level does not exist");
        require(levelId > 0, "Cannot remove base level");
        
        levels[levelId].exists = false;
        emit LevelRemoved(levelId);
    }

    function getLevel(uint256 levelId) external view returns (string memory name, uint256 minPoints, bool exists) {
        require(levelId < totalLevels, "Level does not exist");
        Level memory level = levels[levelId];
        return (level.name, level.minPoints, level.exists);
    }

    function getUserLevel(address user) external view returns (string memory levelName, uint256 levelId) {
        uint256 userPointsValue = userPoints[user];
        
        // Find the highest level the user qualifies for
        for (int256 i = int256(totalLevels) - 1; i >= 0; i--) {
            uint256 levelIndex = uint256(i);
            if (levels[levelIndex].exists && userPointsValue >= levels[levelIndex].minPoints) {
                return (levels[levelIndex].name, levelIndex);
            }
        }
        
        // Fallback to base level
        return (levels[0].name, 0);
    }

    function getLevels() external view returns (string[] memory names, uint256[] memory minPoints) {
        string[] memory levelNames = new string[](totalLevels);
        uint256[] memory levelMinPoints = new uint256[](totalLevels);
        
        for (uint256 i = 0; i < totalLevels; i++) {
            if (levels[i].exists) {
                levelNames[i] = levels[i].name;
                levelMinPoints[i] = levels[i].minPoints;
            }
        }
        
        return (levelNames, levelMinPoints);
    }

    function authorizeContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }

    function deauthorizeContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        authorizedContracts[contractAddress] = false;
        emit ContractDeauthorized(contractAddress);
    }

    function earnPoints(address user, uint256 amount, string memory reason) external onlyAuthorized {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Track user if not already tracked
        if (!isUserTracked[user]) {
            userList.push(user);
            isUserTracked[user] = true;
        }
        
        userPoints[user] += amount;
        emit PointsAwarded(user, amount, reason);
    }

    function deductPoints(address user, uint256 amount, string memory reason) external onlyAuthorized {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(userPoints[user] >= amount, "Insufficient points");
        
        userPoints[user] -= amount;
        emit PointsDeducted(user, amount, reason);
    }

    function dailyLogin() external {
        uint256 currentTime = block.timestamp;
        
        // Track user if not already tracked
        if (!isUserTracked[msg.sender]) {
            userList.push(msg.sender);
            isUserTracked[msg.sender] = true;
        }
        
        // Check if it's a new day
        if (currentTime >= lastLoginTimestamp[msg.sender] + DAY) {
            if (currentTime < lastLoginTimestamp[msg.sender] + 2 * DAY) {
                // Consecutive day
                loginStreak[msg.sender]++;
            } else {
                // Streak broken, reset to 1
                loginStreak[msg.sender] = 1;
            }
            
            lastLoginTimestamp[msg.sender] = currentTime;
            
            // Award points
            uint256 pointsToAward = dailyLoginPoints + (loginStreak[msg.sender] * streakBonusPoints);
            userPoints[msg.sender] += pointsToAward;
            
            emit DailyLogin(msg.sender, pointsToAward, loginStreak[msg.sender]);
        }
    }

    function recordActivity() external onlyAuthorized {
        uint256 currentTime = block.timestamp;
        address user = tx.origin; // Get the original user who initiated the transaction
        
        // Track user if not already tracked
        if (!isUserTracked[user]) {
            userList.push(user);
            isUserTracked[user] = true;
        }
        
        // Check if it's a new day
        if (currentTime >= lastActivityTimestamp[user] + DAY) {
            if (currentTime < lastActivityTimestamp[user] + 2 * DAY) {
                // Consecutive day of activity
                activityStreak[user]++;
            } else {
                // Streak broken, reset to 1
                activityStreak[user] = 1;
            }
            
            lastActivityTimestamp[user] = currentTime;
            
            // Award streak bonus points
            if (activityStreak[user] > 1) {
                uint256 bonusPoints = activityStreak[user] * activityStreakBonus;
                userPoints[user] += bonusPoints;
                emit ActivityStreak(user, activityStreak[user], bonusPoints);
            }
        }
    }

    function getPoints(address user) external view returns (uint256) {
        return userPoints[user];
    }

    function getLoginStreak(address user) external view returns (uint256) {
        return loginStreak[user];
    }

    function getActivityStreak(address user) external view returns (uint256) {
        return activityStreak[user];
    }

    function getLastLogin(address user) external view returns (uint256) {
        return lastLoginTimestamp[user];
    }

    function getLastActivity(address user) external view returns (uint256) {
        return lastActivityTimestamp[user];
    }

    function updatePointValues(uint256 newDailyLoginPoints, uint256 newStreakBonusPoints, uint256 newActivityStreakBonus) external onlyOwner {
        dailyLoginPoints = newDailyLoginPoints;
        streakBonusPoints = newStreakBonusPoints;
        activityStreakBonus = newActivityStreakBonus;
    }

    function getLeaderboard(uint256 startIndex, uint256 endIndex) external view returns (address[] memory, uint256[] memory) {
        require(startIndex < endIndex, "Invalid range");
        require(endIndex - startIndex <= 100, "Range too large");
        require(endIndex <= userList.length, "End index out of bounds");
        
        uint256 length = endIndex - startIndex;
        address[] memory users = new address[](length);
        uint256[] memory points = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            users[i] = userList[startIndex + i];
            points[i] = userPoints[users[i]];
        }
        
        return (users, points);
    }

    function getTopUsers(uint256 limit) external view returns (address[] memory, uint256[] memory) {
        require(limit <= 100, "Limit too high");
        
        if (userList.length == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        // Create array of user addresses with their points for sorting
        address[] memory sortedUsers = new address[](userList.length);
        uint256[] memory sortedPoints = new uint256[](userList.length);
        
        // Copy all users and points
        for (uint256 i = 0; i < userList.length; i++) {
            sortedUsers[i] = userList[i];
            sortedPoints[i] = userPoints[userList[i]];
        }
        
        // Sort by points (descending) using insertion sort
        for (uint256 i = 1; i < sortedUsers.length; i++) {
            address keyUser = sortedUsers[i];
            uint256 keyPoints = sortedPoints[i];
            uint256 j = i;
            
            while (j > 0 && sortedPoints[j - 1] < keyPoints) {
                sortedUsers[j] = sortedUsers[j - 1];
                sortedPoints[j] = sortedPoints[j - 1];
                j--;
            }
            sortedUsers[j] = keyUser;
            sortedPoints[j] = keyPoints;
        }
        
        // Return top 'limit' users
        uint256 resultSize = userList.length < limit ? userList.length : limit;
        address[] memory topUsers = new address[](resultSize);
        uint256[] memory topPoints = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            topUsers[i] = sortedUsers[i];
            topPoints[i] = sortedPoints[i];
        }
        
        return (topUsers, topPoints);
    }

    function getUserRank(address user) external view returns (uint256) {
        if (userPoints[user] == 0 && !isUserTracked[user]) {
            return 0; // User not in leaderboard
        }
        
        uint256 userPointsValue = userPoints[user];
        uint256 rank = 1;
        
        // Count users with more points
        for (uint256 i = 0; i < userList.length; i++) {
            if (userPoints[userList[i]] > userPointsValue) {
                rank++;
            }
        }
        
        return rank;
    }

    function getTotalUsers() external view returns (uint256) {
        return userList.length;
    }

    function isAuthorized(address contractAddress) external view returns (bool) {
        return authorizedContracts[contractAddress];
    }
}
