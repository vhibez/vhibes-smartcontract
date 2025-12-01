// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./VhibesPoints.sol";
import "./VhibesBadges.sol";

contract ChainReactionContract is Ownable {
    
    VhibesPoints public pointsContract;
    VhibesBadges public badgesContract;
    
    struct Challenge {
        address initiator;
        string prompt;
        string promptImageIpfsHash; // Optional image for the challenge
        uint256 timestamp;
        uint256[] responseIds;
        bool exists;
    }
    
    struct Response {
        address responder;
        uint256 parentChallengeId;
        uint256 parentResponseId; // 0 if responding to challenge, otherwise response ID
        string responseText;
        string responseImageIpfsHash;
        uint256 timestamp;
        uint256[] childResponseIds;
        bool exists;
    }
    
    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => Response) public responses;
    mapping(address => uint256[]) public userChallenges;
    mapping(address => uint256[]) public userResponses;
    
    uint256 private _challengeIdCounter;
    uint256 private _responseIdCounter;
    uint256 public pointsPerChallenge = 15;
    uint256 public pointsPerResponse = 10;
    
    event ChallengeStarted(address indexed initiator, uint256 indexed challengeId, string prompt, string promptImageIpfsHash);
    event ChallengeJoined(address indexed responder, uint256 indexed challengeId, uint256 indexed responseId, uint256 parentResponseId, string responseText, string responseImageIpfsHash);
    event PointsUpdated(uint256 newPointsPerChallenge, uint256 newPointsPerResponse);

    constructor(
        address admin,
        address _pointsContract,
        address _badgesContract
    ) Ownable(admin) {
        pointsContract = VhibesPoints(_pointsContract);
        badgesContract = VhibesBadges(_badgesContract);
    }

    function startChallenge(string memory prompt, string memory promptImageIpfsHash) external returns (uint256) {
        require(bytes(prompt).length > 0, "Invalid prompt");
        
        _challengeIdCounter++;
        uint256 challengeId = _challengeIdCounter;
        
        challenges[challengeId] = Challenge({
            initiator: msg.sender,
            prompt: prompt,
            promptImageIpfsHash: promptImageIpfsHash,
            timestamp: block.timestamp,
            responseIds: new uint256[](0),
            exists: true
        });
        
        userChallenges[msg.sender].push(challengeId);
        
        // Award points for starting a challenge
        pointsContract.earnPoints(msg.sender, pointsPerChallenge, "Challenge initiation");
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit ChallengeStarted(msg.sender, challengeId, prompt, promptImageIpfsHash);
        
        return challengeId;
    }

    function joinChallenge(uint256 challengeId, uint256 parentResponseId, string memory responseText, string memory responseImageIpfsHash) external returns (uint256) {
        require(challenges[challengeId].exists, "Challenge does not exist");
        require(bytes(responseText).length > 0 || bytes(responseImageIpfsHash).length > 0, "Response cannot be empty");
        
        // If parentResponseId is 0, responding to challenge, otherwise responding to a response
        if (parentResponseId > 0) {
            require(responses[parentResponseId].exists, "Parent response does not exist");
            require(responses[parentResponseId].parentChallengeId == challengeId, "Parent response not in this challenge");
        }
        
        _responseIdCounter++;
        uint256 responseId = _responseIdCounter;
        
        responses[responseId] = Response({
            responder: msg.sender,
            parentChallengeId: challengeId,
            parentResponseId: parentResponseId,
            responseText: responseText,
            responseImageIpfsHash: responseImageIpfsHash,
            timestamp: block.timestamp,
            childResponseIds: new uint256[](0),
            exists: true
        });
        
        // Add to challenge's response list
        challenges[challengeId].responseIds.push(responseId);
        
        // Add to parent response's child list
        if (parentResponseId > 0) {
            responses[parentResponseId].childResponseIds.push(responseId);
        }
        
        userResponses[msg.sender].push(responseId);
        
        // Award points for joining challenge
        pointsContract.earnPoints(msg.sender, pointsPerResponse, "Challenge response");
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit ChallengeJoined(msg.sender, challengeId, responseId, parentResponseId, responseText, responseImageIpfsHash);
        
        return responseId;
    }

    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        require(challenges[challengeId].exists, "Challenge does not exist");
        return challenges[challengeId];
    }

    function getResponse(uint256 responseId) external view returns (Response memory) {
        require(responses[responseId].exists, "Response does not exist");
        return responses[responseId];
    }

    function getChain(uint256 challengeId) external view returns (uint256[] memory) {
        require(challenges[challengeId].exists, "Challenge does not exist");
        return challenges[challengeId].responseIds;
    }

    function getResponseChain(uint256 responseId) external view returns (uint256[] memory) {
        require(responses[responseId].exists, "Response does not exist");
        return responses[responseId].childResponseIds;
    }

    function getUserChallenges(address user) external view returns (uint256[] memory) {
        return userChallenges[user];
    }

    function getUserResponses(address user) external view returns (uint256[] memory) {
        return userResponses[user];
    }

    function getActiveChallenges(uint256 limit) external view returns (uint256[] memory) {
        require(limit <= 50, "Limit too high");
        
        uint256[] memory activeChallenges = new uint256[](limit);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _challengeIdCounter && count < limit; i++) {
            if (challenges[i].exists) {
                activeChallenges[count] = i;
                count++;
            }
        }
        
        return activeChallenges;
    }

    function updatePoints(uint256 newPointsPerChallenge, uint256 newPointsPerResponse) external onlyOwner {
        pointsPerChallenge = newPointsPerChallenge;
        pointsPerResponse = newPointsPerResponse;
        emit PointsUpdated(newPointsPerChallenge, newPointsPerResponse);
    }

    function totalChallenges() external view returns (uint256) {
        return _challengeIdCounter;
    }

    function totalResponses() external view returns (uint256) {
        return _responseIdCounter;
    }

    function getChallengeResponseCount(uint256 challengeId) external view returns (uint256) {
        require(challenges[challengeId].exists, "Challenge does not exist");
        return challenges[challengeId].responseIds.length;
    }

    function getResponseChildCount(uint256 responseId) external view returns (uint256) {
        require(responses[responseId].exists, "Response does not exist");
        return responses[responseId].childResponseIds.length;
    }
}
