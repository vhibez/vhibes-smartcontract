// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./VhibesPoints.sol";
import "./RoastMeContract.sol";
import "./ChainReactionContract.sol";
import "./IcebreakerContract.sol";

contract VhibesBadges is ERC721, Ownable {
    
    // Custom errors for better gas efficiency
    error BadgeAlreadyClaimed(string badgeType);
    error BadgeURINotSet(string badgeType);
    error RequirementNotMet(string badgeType, uint256 required, uint256 actual);
    error ContractNotSet(string contractName);
    
    VhibesPoints public pointsContract;
    RoastMeContract public roastContract;
    ChainReactionContract public chainReactionContract;
    IcebreakerContract public icebreakerContract;
    
    uint256 private _tokenIdCounter;
    string public baseURI;
    mapping(address => bool) public authorizedMinters;
    mapping(uint256 => string) public badgeMetadata;
    mapping(address => uint256[]) public userBadges;
    
    // Badge tracking
    mapping(address => bool) public hasFirstActivityBadge;
    mapping(address => bool) public hasLoginStreakBadge;
    mapping(address => bool) public hasActivityStreakBadge;
    mapping(address => bool) public hasTopRoasterBadge;
    mapping(address => bool) public hasChainMasterBadge;
    mapping(address => bool) public hasIcebreakerBadge;
    
    // Badge requirements
    uint256 public firstActivityRequirement = 1;
    uint256 public loginStreakRequirement = 7;
    uint256 public activityStreakRequirement = 5;
    uint256 public topRoasterRequirement = 10;
    uint256 public chainMasterRequirement = 5;
    uint256 public icebreakerRequirement = 10;
    
    // Badge URIs
    string public firstActivityBadgeURI;
    string public loginStreakBadgeURI;
    string public activityStreakBadgeURI;
    string public topRoasterBadgeURI;
    string public chainMasterBadgeURI;
    string public icebreakerBadgeURI;
    
    event BadgeMinted(address indexed user, uint256 badgeId, string badgeType);
    event MinterAuthorized(address indexed minter);
    event MinterDeauthorized(address indexed minter);
    event BaseURIUpdated(string newBaseURI);
    event BadgeClaimed(address indexed user, string badgeType);

    constructor(
        address admin,
        string memory name,
        string memory symbol,
        string memory _baseURI
    ) ERC721(name, symbol) Ownable(admin) {
        baseURI = _baseURI;
    }

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized minter");
        _;
    }

    function setPointsContract(address _pointsContract) external onlyOwner {
        pointsContract = VhibesPoints(_pointsContract);
    }

    function setContracts(
        address _roastContract,
        address _chainReactionContract,
        address _icebreakerContract
    ) external onlyOwner {
        require(_roastContract != address(0), "Invalid roast contract address");
        require(_chainReactionContract != address(0), "Invalid chain reaction contract address");
        require(_icebreakerContract != address(0), "Invalid icebreaker contract address");
        roastContract = RoastMeContract(_roastContract);
        chainReactionContract = ChainReactionContract(_chainReactionContract);
        icebreakerContract = IcebreakerContract(_icebreakerContract);
    }

    function authorizeMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    function deauthorizeMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = false;
        emit MinterDeauthorized(minter);
    }

    function mintBadge(address user, string memory badgeType, string memory metadataURI) external onlyAuthorizedMinter returns (uint256) {
        require(user != address(0), "Invalid user address");
        require(bytes(badgeType).length > 0, "Invalid badge type");
        
        _tokenIdCounter++;
        uint256 badgeId = _tokenIdCounter;
        
        badgeMetadata[badgeId] = metadataURI;
        userBadges[user].push(badgeId);
        
        _safeMint(user, badgeId);
        emit BadgeMinted(user, badgeId, badgeType);
        
        return badgeId;
    }

    // User claim functions (inspired by vhibes)
    function claimFirstActivityBadge() external {
        require(!hasFirstActivityBadge[msg.sender], "First activity badge already claimed");
        require(bytes(firstActivityBadgeURI).length > 0, "Badge URI not set by owner");
        
        // Check if user has any activity (this would be tracked by other contracts)
        // For now, we'll assume they have activity if they're calling this function
        
        _tokenIdCounter++;
        uint256 badgeId = _tokenIdCounter;
        badgeMetadata[badgeId] = firstActivityBadgeURI;
        userBadges[msg.sender].push(badgeId);
        
        _safeMint(msg.sender, badgeId);
        hasFirstActivityBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender, "First Activity");
    }

    function claimLoginStreakBadge() external {
        require(!hasLoginStreakBadge[msg.sender], "Login streak badge already claimed");
        require(bytes(loginStreakBadgeURI).length > 0, "Badge URI not set by owner");
        require(pointsContract.getLoginStreak(msg.sender) >= loginStreakRequirement, "Login streak requirement not met");
        
        _tokenIdCounter++;
        uint256 badgeId = _tokenIdCounter;
        badgeMetadata[badgeId] = loginStreakBadgeURI;
        userBadges[msg.sender].push(badgeId);
        
        _safeMint(msg.sender, badgeId);
        hasLoginStreakBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender, "Login Streak");
    }

    function claimActivityStreakBadge() external {
        require(!hasActivityStreakBadge[msg.sender], "Activity streak badge already claimed");
        require(bytes(activityStreakBadgeURI).length > 0, "Badge URI not set by owner");
        require(pointsContract.getActivityStreak(msg.sender) >= activityStreakRequirement, "Activity streak requirement not met");
        
        _tokenIdCounter++;
        uint256 badgeId = _tokenIdCounter;
        badgeMetadata[badgeId] = activityStreakBadgeURI;
        userBadges[msg.sender].push(badgeId);
        
        _safeMint(msg.sender, badgeId);
        hasActivityStreakBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender, "Activity Streak");
    }

    function claimTopRoasterBadge() external {
        if (hasTopRoasterBadge[msg.sender]) {
            revert BadgeAlreadyClaimed("Top Roaster");
        }
        if (bytes(topRoasterBadgeURI).length == 0) {
            revert BadgeURINotSet("Top Roaster");
        }
        if (address(roastContract) == address(0)) {
            revert ContractNotSet("RoastMeContract");
        }
        
        uint256 roastCount = roastContract.getUserRoastCount(msg.sender);
        if (roastCount < topRoasterRequirement) {
            revert RequirementNotMet("Top Roaster", topRoasterRequirement, roastCount);
        }
        
        _tokenIdCounter++;
        uint256 badgeId = _tokenIdCounter;
        badgeMetadata[badgeId] = topRoasterBadgeURI;
        userBadges[msg.sender].push(badgeId);
        
        _safeMint(msg.sender, badgeId);
        hasTopRoasterBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender, "Top Roaster");
    }

    function claimChainMasterBadge() external {
        if (hasChainMasterBadge[msg.sender]) {
            revert BadgeAlreadyClaimed("Chain Master");
        }
        if (bytes(chainMasterBadgeURI).length == 0) {
            revert BadgeURINotSet("Chain Master");
        }
        if (address(chainReactionContract) == address(0)) {
            revert ContractNotSet("ChainReactionContract");
        }
        
        uint256 participationCount = chainReactionContract.getUserChainParticipationCount(msg.sender);
        if (participationCount < chainMasterRequirement) {
            revert RequirementNotMet("Chain Master", chainMasterRequirement, participationCount);
        }
        
        _tokenIdCounter++;
        uint256 badgeId = _tokenIdCounter;
        badgeMetadata[badgeId] = chainMasterBadgeURI;
        userBadges[msg.sender].push(badgeId);
        
        _safeMint(msg.sender, badgeId);
        hasChainMasterBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender, "Chain Master");
    }

    function claimIcebreakerBadge() external {
        if (hasIcebreakerBadge[msg.sender]) {
            revert BadgeAlreadyClaimed("Icebreaker");
        }
        if (bytes(icebreakerBadgeURI).length == 0) {
            revert BadgeURINotSet("Icebreaker");
        }
        if (address(icebreakerContract) == address(0)) {
            revert ContractNotSet("IcebreakerContract");
        }
        
        uint256 activityCount = icebreakerContract.getUserIcebreakerActivityCount(msg.sender);
        if (activityCount < icebreakerRequirement) {
            revert RequirementNotMet("Icebreaker", icebreakerRequirement, activityCount);
        }
        
        _tokenIdCounter++;
        uint256 badgeId = _tokenIdCounter;
        badgeMetadata[badgeId] = icebreakerBadgeURI;
        userBadges[msg.sender].push(badgeId);
        
        _safeMint(msg.sender, badgeId);
        hasIcebreakerBadge[msg.sender] = true;
        emit BadgeClaimed(msg.sender, "Icebreaker");
    }

    // Admin functions to set badge URIs and requirements
    function setBadgeURIs(
        string memory _firstActivityBadgeURI,
        string memory _loginStreakBadgeURI,
        string memory _activityStreakBadgeURI,
        string memory _topRoasterBadgeURI,
        string memory _chainMasterBadgeURI,
        string memory _icebreakerBadgeURI
    ) external onlyOwner {
        firstActivityBadgeURI = _firstActivityBadgeURI;
        loginStreakBadgeURI = _loginStreakBadgeURI;
        activityStreakBadgeURI = _activityStreakBadgeURI;
        topRoasterBadgeURI = _topRoasterBadgeURI;
        chainMasterBadgeURI = _chainMasterBadgeURI;
        icebreakerBadgeURI = _icebreakerBadgeURI;
    }

    function setBadgeRequirements(
        uint256 _firstActivityRequirement,
        uint256 _loginStreakRequirement,
        uint256 _activityStreakRequirement,
        uint256 _topRoasterRequirement,
        uint256 _chainMasterRequirement,
        uint256 _icebreakerRequirement
    ) external onlyOwner {
        firstActivityRequirement = _firstActivityRequirement;
        loginStreakRequirement = _loginStreakRequirement;
        activityStreakRequirement = _activityStreakRequirement;
        topRoasterRequirement = _topRoasterRequirement;
        chainMasterRequirement = _chainMasterRequirement;
        icebreakerRequirement = _icebreakerRequirement;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function getBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }

    function getBadgeMetadata(uint256 badgeId) external view returns (string memory) {
        require(ownerOf(badgeId) != address(0), "Badge does not exist");
        return badgeMetadata[badgeId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
        
        string memory metadata = badgeMetadata[tokenId];
        if (bytes(metadata).length > 0) {
            return metadata;
        }
        
        return string(abi.encodePacked(baseURI, _toString(tokenId)));
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // Override transfer functions to make badges non-transferable (soulbound)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Badges are non-transferable");
        return super._update(to, tokenId, auth);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function isAuthorizedMinter(address minter) external view returns (bool) {
        return authorizedMinters[minter];
    }
}
