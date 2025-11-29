// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./VhibesPoints.sol";
import "./VhibesBadges.sol";

contract RoastMeContract is Ownable {
    
    VhibesPoints public pointsContract;
    VhibesBadges public badgesContract;
    
    struct Roast {
        address submitter;
        string originalImageIpfsHash;
        string roastIpfsHash;
        uint256 funnyVotes;
        uint256 mehVotes;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(uint256 => Roast) public roasts;
    mapping(address => uint256[]) public userRoasts;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    mapping(address => mapping(uint256 => bool)) public voteType; // true = funny, false = meh
    
    uint256 private _roastIdCounter;
    uint256 public pointsPerRoast = 10;
    uint256 public pointsPerVote = 1;
    uint256 public pointsPerFunnyVote = 5;
    
    event RoastSubmitted(address indexed user, uint256 roastId, string originalImageIpfsHash, string roastIpfsHash);
    event RoastVoted(address indexed voter, uint256 roastId, bool isFunny);
    event PointsUpdated(uint256 newPointsPerRoast, uint256 newPointsPerVote, uint256 newPointsPerFunnyVote);

    constructor(
        address admin,
        address _pointsContract,
        address _badgesContract
    ) Ownable(admin) {
        pointsContract = VhibesPoints(_pointsContract);
        badgesContract = VhibesBadges(_badgesContract);
    }

    function submitRoast(string memory originalImageIpfsHash, string memory roastIpfsHash) external returns (uint256) {
        require(bytes(originalImageIpfsHash).length > 0, "Invalid original image hash");
        require(bytes(roastIpfsHash).length > 0, "Invalid roast hash");
        
        _roastIdCounter++;
        uint256 roastId = _roastIdCounter;
        
        roasts[roastId] = Roast({
            submitter: msg.sender,
            originalImageIpfsHash: originalImageIpfsHash,
            roastIpfsHash: roastIpfsHash,
            funnyVotes: 0,
            mehVotes: 0,
            timestamp: block.timestamp,
            exists: true
        });
        
        userRoasts[msg.sender].push(roastId);
        
        // Award points for submitting a roast
        pointsContract.earnPoints(msg.sender, pointsPerRoast, "Roast submission");
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit RoastSubmitted(msg.sender, roastId, originalImageIpfsHash, roastIpfsHash);
        
        return roastId;
    }

    function voteRoast(uint256 roastId, bool isFunny) external {
        require(roasts[roastId].exists, "Roast does not exist");
        require(!hasVoted[msg.sender][roastId], "Already voted on this roast");
        require(msg.sender != roasts[roastId].submitter, "Cannot vote on your own roast");
        
        hasVoted[msg.sender][roastId] = true;
        voteType[msg.sender][roastId] = isFunny;
        
        if (isFunny) {
            roasts[roastId].funnyVotes++;
            // Award points to voter
            pointsContract.earnPoints(msg.sender, pointsPerVote, "Voting on roast");
            // Award bonus points to roast submitter
            pointsContract.earnPoints(roasts[roastId].submitter, pointsPerFunnyVote, "Funny roast vote");
        } else {
            roasts[roastId].mehVotes++;
            // Award points to voter
            pointsContract.earnPoints(msg.sender, pointsPerVote, "Voting on roast");
        }
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit RoastVoted(msg.sender, roastId, isFunny);
    }

    function getRoast(uint256 roastId) external view returns (Roast memory) {
        require(roasts[roastId].exists, "Roast does not exist");
        return roasts[roastId];
    }

    function getUserRoasts(address user) external view returns (uint256[] memory) {
        return userRoasts[user];
    }

    function getTopRoasts(uint256 limit) external view returns (uint256[] memory) {
        require(limit <= 50, "Limit too high");
        
        // Collect all existing roast IDs
        uint256[] memory allRoastIds = new uint256[](_roastIdCounter);
        uint256 totalRoasts = 0;
        
        for (uint256 i = 1; i <= _roastIdCounter; i++) {
            if (roasts[i].exists) {
                allRoastIds[totalRoasts] = i;
                totalRoasts++;
            }
        }
        
        if (totalRoasts == 0) {
            return new uint256[](0);
        }
        
        // Sort by funny votes (descending) using insertion sort
        // This is gas-efficient for small lists (up to 50 items)
        for (uint256 i = 1; i < totalRoasts; i++) {
            uint256 key = allRoastIds[i];
            uint256 keyVotes = roasts[key].funnyVotes;
            uint256 j = i;
            
            while (j > 0 && roasts[allRoastIds[j - 1]].funnyVotes < keyVotes) {
                allRoastIds[j] = allRoastIds[j - 1];
                j--;
            }
            allRoastIds[j] = key;
        }
        
        // Return top 'limit' roasts
        uint256 resultSize = totalRoasts < limit ? totalRoasts : limit;
        uint256[] memory topRoasts = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            topRoasts[i] = allRoastIds[i];
        }
        
        return topRoasts;
    }

    function updatePoints(uint256 newPointsPerRoast, uint256 newPointsPerVote, uint256 newPointsPerFunnyVote) external onlyOwner {
        pointsPerRoast = newPointsPerRoast;
        pointsPerVote = newPointsPerVote;
        pointsPerFunnyVote = newPointsPerFunnyVote;
        emit PointsUpdated(newPointsPerRoast, newPointsPerVote, newPointsPerFunnyVote);
    }

    function totalRoasts() external view returns (uint256) {
        return _roastIdCounter;
    }

    function hasUserVoted(address user, uint256 roastId) external view returns (bool) {
        return hasVoted[user][roastId];
    }

    function getUserVote(address user, uint256 roastId) external view returns (bool) {
        require(hasVoted[user][roastId], "User has not voted");
        return voteType[user][roastId];
    }

    function getUserRoastCount(address user) external view returns (uint256) {
        return userRoasts[user].length;
    }

    function getTopRoasters(uint256 limit) external view returns (address[] memory, uint256[] memory) {
        require(limit <= 100, "Limit too high");
        
        // Since we can't iterate over mappings efficiently, we'll use a simpler approach:
        // Collect unique users and their counts by iterating through roasts
        // This is O(n²) but acceptable for small datasets
        
        address[] memory tempUsers = new address[](_roastIdCounter);
        uint256[] memory tempCounts = new uint256[](_roastIdCounter);
        uint256 uniqueUserCount = 0;
        
        // First pass: collect all unique users and count their roasts
        for (uint256 i = 1; i <= _roastIdCounter; i++) {
            if (roasts[i].exists) {
                address submitter = roasts[i].submitter;
                bool found = false;
                
                // Check if user already in our list
                for (uint256 j = 0; j < uniqueUserCount; j++) {
                    if (tempUsers[j] == submitter) {
                        tempCounts[j]++;
                        found = true;
                        break;
                    }
                }
                
                // Add new user if not found
                if (!found) {
                    tempUsers[uniqueUserCount] = submitter;
                    tempCounts[uniqueUserCount] = 1;
                    uniqueUserCount++;
                }
            }
        }
        
        if (uniqueUserCount == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        // Create properly sized arrays
        address[] memory users = new address[](uniqueUserCount);
        uint256[] memory counts = new uint256[](uniqueUserCount);
        
        for (uint256 i = 0; i < uniqueUserCount; i++) {
            users[i] = tempUsers[i];
            counts[i] = tempCounts[i];
        }
        
        // Sort by roast count (descending) using insertion sort
        for (uint256 i = 1; i < uniqueUserCount; i++) {
            address keyUser = users[i];
            uint256 keyCount = counts[i];
            uint256 j = i;
            
            while (j > 0 && counts[j - 1] < keyCount) {
                users[j] = users[j - 1];
                counts[j] = counts[j - 1];
                j--;
            }
            users[j] = keyUser;
            counts[j] = keyCount;
        }
        
        // Return top 'limit' roasters
        uint256 resultSize = uniqueUserCount < limit ? uniqueUserCount : limit;
        address[] memory topRoasters = new address[](resultSize);
        uint256[] memory topCounts = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            topRoasters[i] = users[i];
            topCounts[i] = counts[i];
        }
        
        return (topRoasters, topCounts);
    }
}
