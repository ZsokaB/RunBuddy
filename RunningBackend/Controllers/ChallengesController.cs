using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RunningBackend.Data;
using RunningBackend.Models;
using RunningBackend.DTOs;
using System;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class ChallengesController : ControllerBase
{
	private readonly ApplicationDbContext _dbContext;

	public ChallengesController(ApplicationDbContext dbContext)
	{
		_dbContext = dbContext;
	}

	// Get users who follow back (mutual followers)
	[HttpGet("friends/{userId}")]
	public async Task<IActionResult> GetMutualFollowers(string userId)
	{
		var mutualFriends = await _dbContext.UserConnections
			.Where(f => f.FollowingUserId == userId &&
						_dbContext.UserConnections.Any(ff => ff.FollowingUserId == f.FollowedUserId && ff.FollowedUserId == userId))
			.Join(_dbContext.Users,
				f => f.FollowedUserId,
				u => u.Id,
				(f, u) => new { u.Id, u.UserName })
			.ToListAsync();

		return Ok(mutualFriends);
	}

	// Send a challenge
	[HttpPost("invite")]
	public async Task<IActionResult> InviteToChallenge([FromBody] Challenge challenge)
	{
		// Validate mutual follow
		bool isMutualFollow = await _dbContext.UserConnections.AnyAsync(f =>
			f.FollowingUserId == challenge.InviterId &&
			f.FollowedUserId == challenge.InviteeId &&
			_dbContext.UserConnections.Any(ff => ff.FollowingUserId == challenge.InviteeId && ff.FollowedUserId == challenge.InviterId));

		if (!isMutualFollow)
		{
			return BadRequest("You can only challenge users who follow you back.");
		}

		// Randomly select a challenge
		string[] challenges = { "Run 5km together", "Run 10km together", "Run 15km together" };
		challenge.ChallengeType = challenges[new Random().Next(challenges.Length)];
		challenge.StartDate = DateTime.UtcNow;
		challenge.EndDate = DateTime.UtcNow.AddDays(7);
		challenge.Status = "Pending";

		_dbContext.Challenges.Add(challenge);
		await _dbContext.SaveChangesAsync();

		return Ok("Challenge invitation sent!");
	}

	// Accept a challenge
	[HttpPost("accept/{challengeId}")]
	public async Task<IActionResult> AcceptChallenge(int challengeId)
	{
		var challenge = await _dbContext.Challenges.FindAsync(challengeId);
		if (challenge == null) return NotFound("Challenge not found.");

		challenge.Status = "Accepted";
		await _dbContext.SaveChangesAsync();

		return Ok("Challenge accepted!");
	}

	// Get pending challenges for a user
	[HttpGet("pending/{userId}")]
	public async Task<IActionResult> GetPendingChallenges(string userId)
	{
		var challenges = await _dbContext.Challenges
			.Where(c => c.InviteeId == userId && c.Status == "Pending")
			.ToListAsync();

		return Ok(challenges);
	}

	// Track progress
	[HttpPost("update-progress")]
	public async Task<IActionResult> UpdateChallengeProgress([FromBody] ChallengeProgressDto progress)
	{
		var challenge = await _dbContext.Challenges.FindAsync(progress.ChallengeId);
		if (challenge == null) return NotFound("Challenge not found.");

		// Check if challenge is completed
		if (progress.Distance >= GetRequiredDistance(challenge.ChallengeType))
		{
			challenge.Status = "Completed";
		}

		await _dbContext.SaveChangesAsync();
		return Ok("Progress updated!");
	}

	private int GetRequiredDistance(string challengeType)
	{
		return challengeType switch
		{
			"Run 5km together" => 5,
			"Run 10km together" => 10,
			"Run 15km together" => 15,
			_ => 0
		};
	}
}
