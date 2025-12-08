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
        
        uint256[] memory topRoasts = new uint256[](limit);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _roastIdCounter && count < limit; i++) {
            if (roasts[i].exists) {
                topRoasts[count] = i;
                count++;
            }
        }
        
        // Sort by funny votes (simplified - in production you might want a more sophisticated algorithm)
        // For now, just return the first 'limit' roasts
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
}
