# TODO - Vhibes Smart Contract Improvements

## 📋 Overview
This document outlines the tasks and improvements needed for the Vhibes smart contract system.

---

## 1. ✅ Implement Badge Requirement Checks

### Current Issues
- `claimTopRoasterBadge()` doesn't verify user has 10+ roasts from RoastMeContract
- `claimChainMasterBadge()` doesn't verify user has 5+ chain participations from ChainReactionContract
- `claimIcebreakerBadge()` doesn't verify user has 10+ icebreaker activities from IcebreakerContract
- `claimFirstActivityBadge()` has a comment indicating it needs proper activity tracking

### Tasks
- [ ] Add interface/import for RoastMeContract in VhibesBadges.sol
- [ ] Add interface/import for ChainReactionContract in VhibesBadges.sol
- [ ] Add interface/import for IcebreakerContract in VhibesBadges.sol
- [ ] Implement `getUserRoastCount(address user)` view function in RoastMeContract
- [ ] Implement `getUserChainParticipationCount(address user)` view function in ChainReactionContract
- [ ] Implement `getUserIcebreakerActivityCount(address user)` view function in IcebreakerContract
- [ ] Update `claimTopRoasterBadge()` to check `roastContract.getUserRoastCount(msg.sender) >= topRoasterRequirement`
- [ ] Update `claimChainMasterBadge()` to check chain participation count >= requirement
- [ ] Update `claimIcebreakerBadge()` to check icebreaker activity count >= requirement
- [ ] Update `claimFirstActivityBadge()` to properly track first activity across all contracts
- [ ] Add proper error messages for failed requirement checks
- [ ] Test all badge claim functions with valid and invalid requirements

### Files to Modify
- `contracts/VhibesBadges.sol`
- `contracts/RoastMeContract.sol` (add view functions)
- `contracts/ChainReactionContract.sol` (add view functions)
- `contracts/IcebreakerContract.sol` (add view functions)

---

## 2. ✅ Add Sorting/Ranking Algorithms

### Current Issues
- `getTopRoasts()` in RoastMeContract returns unsorted results (just first N roasts)
- `getLeaderboard()` in VhibesPoints returns empty arrays (not implemented)
- No ranking system for users based on points, roasts, or other metrics

### Tasks
- [ ] Implement sorting algorithm for `getTopRoasts()` - sort by funny votes (descending)
- [ ] Consider implementing a more sophisticated ranking algorithm (e.g., weighted score: funny votes - meh votes, or time-decay)
- [ ] Implement `getLeaderboard()` in VhibesPoints:
  - [ ] Option A: Maintain an on-chain sorted list (gas expensive but accurate)
  - [ ] Option B: Return all users with points and sort off-chain (gas efficient)
  - [ ] Option C: Use a mapping to track top N users (hybrid approach)
- [ ] Add `getTopUsers(uint256 limit)` function that returns sorted users by points
- [ ] Add `getUserRank(address user)` function to get user's position in leaderboard
- [ ] Consider adding pagination support for large leaderboards
- [ ] Add ranking functions for other metrics:
  - [ ] Top roasters (by roast count)
  - [ ] Top chain participants (by response count)
  - [ ] Top icebreaker users (by prompt/response count)
- [ ] Optimize gas costs for sorting operations (consider using insertion sort for small lists)

### Files to Modify
- `contracts/VhibesPoints.sol`
- `contracts/RoastMeContract.sol`
- Potentially create a new `contracts/RankingUtils.sol` library for reusable sorting functions

---

## 3. ✅ Implement Pause Functionality

### Current Issues
- `emergencyPause()` and `emergencyUnpause()` in VhibesAdmin are placeholders
- No pause mechanism in any of the contracts
- No way to stop contract operations in case of emergency or vulnerability

### Tasks
- [ ] Add OpenZeppelin's `Pausable.sol` import to all contracts
- [ ] Make all contracts inherit from `Pausable` in addition to `Ownable`
- [ ] Add `whenNotPaused` modifier to critical functions:
  - [ ] VhibesPoints: `earnPoints()`, `deductPoints()`, `dailyLogin()`
  - [ ] VhibesBadges: `mintBadge()`, all `claim*Badge()` functions
  - [ ] RoastMeContract: `submitRoast()`, `voteRoast()`
  - [ ] IcebreakerContract: `createPrompt()`, `submitResponse()`, `createPoll()`, `votePoll()`
  - [ ] ChainReactionContract: `startChallenge()`, `joinChallenge()`
- [ ] Implement `pause()` function in VhibesAdmin that pauses all contracts
- [ ] Implement `unpause()` function in VhibesAdmin that unpauses all contracts
- [ ] Add individual pause/unpause functions for each contract in VhibesAdmin
- [ ] Add events for pause/unpause actions
- [ ] Consider adding time-locked pause (require timelock for unpause)
- [ ] Test pause functionality across all contracts
- [ ] Document pause behavior in contract comments

### Files to Modify
- `contracts/VhibesAdmin.sol`
- `contracts/VhibesPoints.sol`
- `contracts/VhibesBadges.sol`
- `contracts/RoastMeContract.sol`
- `contracts/IcebreakerContract.sol`
- `contracts/ChainReactionContract.sol`

---

## 4. ✅ Add More Validation and Edge Case Handling

### Current Issues
- Missing input validations in several functions
- No checks for array length limits in some functions
- Potential overflow/underflow issues (though Solidity 0.8+ handles this)
- No rate limiting or spam prevention
- Missing checks for duplicate submissions

### Tasks

#### Input Validation
- [ ] Add maximum length checks for string inputs (IPFS hashes, text, etc.)
- [ ] Add minimum length checks where appropriate
- [ ] Validate IPFS hash format (if possible, or at least length)
- [ ] Add checks to prevent empty arrays in batch operations
- [ ] Validate category names don't contain special characters (if needed)

#### Edge Cases
- [ ] Prevent users from voting on their own content (already done in RoastMe, check others)
- [ ] Handle case where user tries to claim badge multiple times (already done, verify)
- [ ] Add checks for maximum number of responses per prompt/challenge
- [ ] Add time-based restrictions if needed (e.g., cooldown periods)
- [ ] Handle case where contract addresses are not set (add checks in VhibesAdmin)
- [ ] Add validation for zero addresses in all functions that accept addresses
- [ ] Check for integer overflow in point calculations (though Solidity 0.8+ handles this)

#### Rate Limiting & Spam Prevention
- [ ] Consider adding cooldown periods for certain actions
- [ ] Add maximum actions per day limits (if needed)
- [ ] Implement duplicate detection for similar content submissions

#### Error Messages
- [ ] Standardize error messages across all contracts
- [ ] Use custom errors instead of require strings (gas optimization)
- [ ] Add descriptive error messages for all validation failures

### Files to Modify
- All contract files
- Consider creating `contracts/ValidationUtils.sol` library for reusable validations

---

## 5. ✅ Write Comprehensive Tests

### Current Issues
- Only `test/Lock.ts` exists (likely a template)
- No tests for any of the main contracts
- No test coverage for edge cases, error conditions, or integration scenarios

### Tasks

#### Test Setup
- [ ] Set up Hardhat test environment with proper fixtures
- [ ] Create helper functions for contract deployment
- [ ] Create test data fixtures (mock IPFS hashes, sample data)
- [ ] Set up test accounts with different roles (owner, admin, user)

#### VhibesPoints Tests
- [ ] Test point earning and deduction
- [ ] Test daily login functionality and streak tracking
- [ ] Test activity streak tracking
- [ ] Test level system (getting user level, adding/updating levels)
- [ ] Test authorization (only authorized contracts can award points)
- [ ] Test edge cases (consecutive logins, broken streaks, etc.)
- [ ] Test leaderboard functionality (once implemented)

#### VhibesBadges Tests
- [ ] Test badge minting by authorized minters
- [ ] Test all badge claim functions with valid requirements
- [ ] Test badge claim functions with invalid requirements (should fail)
- [ ] Test preventing duplicate badge claims
- [ ] Test badge URI and metadata functionality
- [ ] Test soulbound nature (transfers should fail)
- [ ] Test badge requirement updates

#### RoastMeContract Tests
- [ ] Test roast submission
- [ ] Test voting on roasts (funny/meh)
- [ ] Test preventing self-voting
- [ ] Test preventing duplicate votes
- [ ] Test point awards for submissions and votes
- [ ] Test top roasts functionality (once sorting is implemented)
- [ ] Test edge cases (empty hashes, invalid roast IDs)

#### IcebreakerContract Tests
- [ ] Test category creation (admin only)
- [ ] Test prompt creation
- [ ] Test response submission
- [ ] Test poll creation and voting
- [ ] Test preventing duplicate poll votes
- [ ] Test point awards for all actions
- [ ] Test category validation
- [ ] Test edge cases (empty categories, invalid prompts, etc.)

#### ChainReactionContract Tests
- [ ] Test challenge creation
- [ ] Test joining challenges (responding to challenge)
- [ ] Test nested responses (responding to responses)
- [ ] Test chain structure (parent-child relationships)
- [ ] Test point awards
- [ ] Test edge cases (invalid parent IDs, empty responses)

#### VhibesAdmin Tests
- [ ] Test contract address setting
- [ ] Test admin authorization/deauthorization
- [ ] Test point value updates across contracts
- [ ] Test badge URI and requirement updates
- [ ] Test category creation delegation
- [ ] Test pause/unpause functionality (once implemented)
- [ ] Test view functions (stats, user data)
- [ ] Test authorization checks (only authorized admins can call functions)
- [ ] Test `incrementTempTest()` function:
  - [ ] Test that only authorized admins can increment counter
  - [ ] Test that unauthorized users cannot increment counter
  - [ ] Test that counter increments correctly
  - [ ] Test that `TempTestCounterIncremented` event is emitted with correct values
  - [ ] Test multiple increments in sequence
- [ ] Test `decrementTempTest()` function:
  - [ ] Test that only authorized admins can decrement counter
  - [ ] Test that unauthorized users cannot decrement counter
  - [ ] Test that counter decrements correctly
  - [ ] Test that counter cannot go below zero (underflow protection)
  - [ ] Test that `TempTestCounterDecremented` event is emitted with correct values
  - [ ] Test decrementing from zero (should revert)
  - [ ] Test multiple decrements in sequence
- [ ] Test `getTempTestCount()` function:
  - [ ] Test that function returns correct counter value
  - [ ] Test that function is publicly accessible (view function)
  - [ ] Test that function returns zero initially
  - [ ] Test that function returns updated value after increments/decrements

#### Integration Tests
- [ ] Test full user flow: login → submit roast → vote → earn points → claim badge
- [ ] Test cross-contract interactions
- [ ] Test activity streak across multiple contracts
- [ ] Test badge eligibility across multiple contracts

#### Gas Optimization Tests
- [ ] Measure gas costs for common operations
- [ ] Compare gas costs before/after optimizations
- [ ] Test gas costs with different data sizes

### Files to Create
- `test/VhibesPoints.test.ts`
- `test/VhibesBadges.test.ts`
- `test/RoastMeContract.test.ts`
- `test/IcebreakerContract.test.ts`
- `test/ChainReactionContract.test.ts`
- `test/VhibesAdmin.test.ts`
- `test/integration.test.ts`
- `test/helpers/fixtures.ts`
- `test/helpers/deploy.ts`

---

## 6. ✅ Gas Optimization

### Current Issues
- No gas optimization analysis performed
- Potential inefficiencies in loops and storage operations
- String operations can be gas-intensive
- No use of custom errors (using require strings)

### Tasks

#### Code Optimizations
- [ ] Replace `require()` with custom errors (saves gas on revert)
- [ ] Use `unchecked` blocks where overflow/underflow is impossible
- [ ] Optimize storage reads/writes (cache storage variables in memory)
- [ ] Use `calldata` instead of `memory` for read-only function parameters
- [ ] Pack structs efficiently (group smaller types together)
- [ ] Use events instead of storage for historical data where possible
- [ ] Optimize loops (avoid redundant iterations, break early when possible)

#### Specific Optimizations
- [ ] Optimize `getUserLevel()` - consider caching or using binary search
- [ ] Optimize `getCategories()` - avoid creating new arrays if possible
- [ ] Optimize badge metadata storage (consider using events for historical data)
- [ ] Optimize vote counting (consider using mappings instead of arrays where possible)
- [ ] Optimize IPFS hash storage (use `bytes32` instead of `string` if possible, or `bytes`)

#### Storage Optimizations
- [ ] Review all mappings and structs for efficient packing
- [ ] Consider using `uint128` instead of `uint256` where values are small
- [ ] Use `uint8` for small counters where appropriate
- [ ] Pack boolean flags into single storage slot

#### Function Optimizations
- [ ] Batch operations where possible (e.g., batch badge claims)
- [ ] Add view functions that return multiple values in one call
- [ ] Consider using libraries for reusable code (reduces deployment size)

#### Analysis & Benchmarking
- [ ] Run gas reports using Hardhat gas reporter
- [ ] Compare gas costs before/after each optimization
- [ ] Document gas costs for common operations
- [ ] Set gas budgets for critical functions

### Files to Modify
- All contract files
- Consider creating `contracts/libraries/` for reusable optimized code

---

## 📊 Priority Levels

### High Priority
1. Implement Badge Requirement Checks (security issue)
2. Add More Validation and Edge Case Handling (security & UX)
3. Write Comprehensive Tests (quality assurance)

### Medium Priority
4. Implement Pause Functionality (security & operations)
5. Add Sorting/Ranking Algorithms (feature completeness)

### Low Priority
6. Gas Optimization (cost efficiency, can be done incrementally)

---

## 📝 Notes

- All changes should be tested thoroughly before deployment
- Consider creating a staging/testnet deployment for testing
- Document all changes in code comments
- Update README.md with any new features or changes
- Consider creating a CHANGELOG.md to track version changes

---

## 🔄 Status Legend

- ⬜ Not Started
- 🟡 In Progress
- ✅ Completed
- ❌ Blocked/Cancelled

