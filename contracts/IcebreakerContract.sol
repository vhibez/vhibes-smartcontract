// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./VhibesPoints.sol";
import "./VhibesBadges.sol";

contract IcebreakerContract is Ownable {
    
    VhibesPoints public pointsContract;
    VhibesBadges public badgesContract;
    
    struct Category {
        string name;
        string description;
        bool exists;
    }
    
    struct Prompt {
        address creator;
        string text;
        string category;
        uint256 timestamp;
        bool exists;
    }
    
    struct Response {
        address responder;
        string responseText;
        string responseImageIpfsHash; // For image prompts
        uint256 timestamp;
        bool exists;
    }
    
    struct Poll {
        address creator;
        string question;
        string[] options;
        mapping(address => uint256) votes; // Maps user to option index
        uint256[] voteCounts;
        uint256 totalVotes;
        bool exists;
    }
    
    mapping(uint256 => Category) public categories;
    mapping(uint256 => Prompt) public prompts;
    mapping(uint256 => Response[]) public promptResponses;
    mapping(uint256 => Poll) public polls;
    mapping(address => uint256[]) public userPrompts;
    mapping(address => uint256[]) public userResponses;
    mapping(address => uint256) public userPromptCount;
    mapping(address => uint256) public userResponseCount;
    
    uint256 private _categoryIdCounter;
    uint256 private _promptIdCounter;
    uint256 private _pollIdCounter;
    uint256 public pointsPerPrompt = 15;
    uint256 public pointsPerResponse = 5;
    uint256 public pointsPerVote = 1;
    
    event CategoryCreated(uint256 indexed categoryId, string name, string description);
    event PromptCreated(address indexed creator, uint256 indexed promptId, string text, string category);
    event ResponseSubmitted(address indexed user, uint256 indexed promptId, string responseText, string responseImageIpfsHash);
    event PollCreated(address indexed creator, uint256 indexed pollId, string question, string[] options);
    event PollVoted(address indexed voter, uint256 indexed pollId, uint256 optionIndex);
    event PointsUpdated(uint256 newPointsPerPrompt, uint256 newPointsPerResponse, uint256 newPointsPerVote);

    constructor(
        address admin,
        address _pointsContract,
        address _badgesContract
    ) Ownable(admin) {
        pointsContract = VhibesPoints(_pointsContract);
        badgesContract = VhibesBadges(_badgesContract);
    }

    // Admin functions - only for setting up categories
    function createCategory(string memory name, string memory description) external onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "Invalid category name");
        require(bytes(description).length > 0, "Invalid category description");
        
        _categoryIdCounter++;
        uint256 categoryId = _categoryIdCounter;
        
        categories[categoryId] = Category({
            name: name,
            description: description,
            exists: true
        });
        
        emit CategoryCreated(categoryId, name, description);
        
        return categoryId;
    }

    // User functions - creating prompts under categories
    function createPrompt(string memory text, string memory category) external returns (uint256) {
        require(bytes(text).length > 0, "Invalid prompt text");
        require(bytes(category).length > 0, "Invalid category");
        require(categoryExists(category), "Category does not exist");
        
        _promptIdCounter++;
        uint256 promptId = _promptIdCounter;
        
        prompts[promptId] = Prompt({
            creator: msg.sender,
            text: text,
            category: category,
            timestamp: block.timestamp,
            exists: true
        });
        
        userPrompts[msg.sender].push(promptId);
        userPromptCount[msg.sender]++;
        
        // Award points for creating a prompt
        pointsContract.earnPoints(msg.sender, pointsPerPrompt, "Creating icebreaker prompt");
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit PromptCreated(msg.sender, promptId, text, category);
        
        return promptId;
    }

    function submitResponse(uint256 promptId, string memory responseText, string memory responseImageIpfsHash) external returns (uint256) {
        require(prompts[promptId].exists, "Prompt does not exist");
        require(bytes(responseText).length > 0 || bytes(responseImageIpfsHash).length > 0, "Response cannot be empty");
        
        Response memory newResponse = Response({
            responder: msg.sender,
            responseText: responseText,
            responseImageIpfsHash: responseImageIpfsHash,
            timestamp: block.timestamp,
            exists: true
        });
        
        promptResponses[promptId].push(newResponse);
        userResponses[msg.sender].push(promptId);
        userResponseCount[msg.sender]++;
        
        // Award points for responding
        pointsContract.earnPoints(msg.sender, pointsPerResponse, "Icebreaker response");
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit ResponseSubmitted(msg.sender, promptId, responseText, responseImageIpfsHash);
        
        return promptResponses[promptId].length - 1; // Return response index
    }

    function createPoll(string memory question, string[] memory options) external returns (uint256) {
        require(bytes(question).length > 0, "Invalid question");
        require(options.length >= 2 && options.length <= 10, "Invalid number of options");
        
        _pollIdCounter++;
        uint256 pollId = _pollIdCounter;
        
        Poll storage poll = polls[pollId];
        poll.creator = msg.sender;
        poll.question = question;
        poll.options = options;
        poll.voteCounts = new uint256[](options.length);
        poll.totalVotes = 0;
        poll.exists = true;
        
        // Award points for creating a poll
        pointsContract.earnPoints(msg.sender, pointsPerPrompt, "Creating icebreaker poll");
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit PollCreated(msg.sender, pollId, question, options);
        
        return pollId;
    }

    function votePoll(uint256 pollId, uint256 optionIndex) external {
        require(polls[pollId].exists, "Poll does not exist");
        require(optionIndex < polls[pollId].options.length, "Invalid option");
        require(polls[pollId].votes[msg.sender] == 0, "Already voted");
        
        polls[pollId].votes[msg.sender] = optionIndex + 1; // +1 to distinguish from unvoted (0)
        polls[pollId].voteCounts[optionIndex]++;
        polls[pollId].totalVotes++;
        
        // Award points for voting
        pointsContract.earnPoints(msg.sender, pointsPerVote, "Poll vote");
        
        // Record activity for streak tracking
        pointsContract.recordActivity();
        
        emit PollVoted(msg.sender, pollId, optionIndex);
    }

    // View functions
    function getCategory(uint256 categoryId) external view returns (Category memory) {
        require(categories[categoryId].exists, "Category does not exist");
        return categories[categoryId];
    }

    function getPrompt(uint256 promptId) external view returns (Prompt memory) {
        require(prompts[promptId].exists, "Prompt does not exist");
        return prompts[promptId];
    }

    function getResponses(uint256 promptId) external view returns (Response[] memory) {
        require(prompts[promptId].exists, "Prompt does not exist");
        return promptResponses[promptId];
    }

    function getPoll(uint256 pollId) external view returns (
        address creator,
        string memory question,
        string[] memory options,
        uint256[] memory voteCounts,
        uint256 totalVotes
    ) {
        require(polls[pollId].exists, "Poll does not exist");
        Poll storage poll = polls[pollId];
        return (poll.creator, poll.question, poll.options, poll.voteCounts, poll.totalVotes);
    }

    function getUserPrompts(address user) external view returns (uint256[] memory) {
        return userPrompts[user];
    }

    function getUserResponses(address user) external view returns (uint256[] memory) {
        return userResponses[user];
    }

    function getUserPromptCount(address user) external view returns (uint256) {
        return userPromptCount[user];
    }

    function getUserResponseCount(address user) external view returns (uint256) {
        return userResponseCount[user];
    }

    function getRandomPrompt() external view returns (uint256) {
        require(_promptIdCounter > 0, "No prompts available");
        // Simple random selection - in production you might want a more sophisticated approach
        return 1; // Return first prompt for now
    }

    function categoryExists(string memory category) public view returns (bool) {
        for (uint256 i = 1; i <= _categoryIdCounter; i++) {
            if (categories[i].exists && keccak256(bytes(categories[i].name)) == keccak256(bytes(category))) {
                return true;
            }
        }
        return false;
    }

    function getCategories() external view returns (Category[] memory) {
        Category[] memory allCategories = new Category[](_categoryIdCounter);
        for (uint256 i = 1; i <= _categoryIdCounter; i++) {
            if (categories[i].exists) {
                allCategories[i - 1] = categories[i];
            }
        }
        return allCategories;
    }

    function updatePoints(uint256 newPointsPerPrompt, uint256 newPointsPerResponse, uint256 newPointsPerVote) external onlyOwner {
        pointsPerPrompt = newPointsPerPrompt;
        pointsPerResponse = newPointsPerResponse;
        pointsPerVote = newPointsPerVote;
        emit PointsUpdated(newPointsPerPrompt, newPointsPerResponse, newPointsPerVote);
    }

    function totalCategories() external view returns (uint256) {
        return _categoryIdCounter;
    }

    function totalPrompts() external view returns (uint256) {
        return _promptIdCounter;
    }

    function totalPolls() external view returns (uint256) {
        return _pollIdCounter;
    }

    function hasUserVoted(address user, uint256 pollId) external view returns (bool) {
        return polls[pollId].votes[user] > 0;
    }

    function getUserVote(address user, uint256 pollId) external view returns (uint256) {
        require(polls[pollId].votes[user] > 0, "User has not voted");
        return polls[pollId].votes[user] - 1; // Convert back to 0-based index
    }
}
