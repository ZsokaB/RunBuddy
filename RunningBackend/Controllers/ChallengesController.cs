using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RunningBackend.Data;
using RunningBackend.Models;
using RunningBackend.DTOs;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using Microsoft.ML;

[ApiController]
[Route("api/[controller]")]
public class ChallengesController : ControllerBase
{
	private readonly ApplicationDbContext _dbContext;

	public ChallengesController(ApplicationDbContext dbContext)
	{
		_dbContext = dbContext;
	}

	
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

	[HttpPost("invite")]
	public async Task<IActionResult> InviteToChallenge([FromBody] ChallengeInvitation invitation)
	{
	
		bool alreadyInvited = await _dbContext.ChallengeInvitations.AnyAsync(i =>
			i.InviterId == invitation.InviterId && i.InviteeId == invitation.InviteeId && !i.IsAccepted);

		if (alreadyInvited)
		{
			return BadRequest("You already sent an invitation to this user.");

		}

		
		invitation.SentAt = DateTime.UtcNow;
		invitation.IsAccepted = false;

		_dbContext.ChallengeInvitations.Add(invitation);
		await _dbContext.SaveChangesAsync();

		return Ok("Challenge invitation sent!");
	}

	[HttpPost("accept/{invitationId}")]
	public async Task<IActionResult> AcceptInvitation(int invitationId)
	{
		var invitation = await _dbContext.ChallengeInvitations.FindAsync(invitationId);
		if (invitation == null) return NotFound("Invitation not found.");

		string[] challenges = { "Run 5 km together", "Run 8 km together", "Run 10 km together", "Run 15 km together" };
		var challenge = new Challenge
		{
			InviterId = invitation.InviterId,
			InviteeId = invitation.InviteeId,
			ChallengeType = challenges[new Random().Next(challenges.Length)],
			StartDate = DateTime.UtcNow,
			EndDate = DateTime.UtcNow.AddDays(7),
			Status = "Active"
		};

		_dbContext.Challenges.Add(challenge);

		
		_dbContext.ChallengeInvitations.Remove(invitation);

		await _dbContext.SaveChangesAsync();

		return Ok("Challenge started and invitation removed!");
	}




	[HttpGet("pending/{userId}")]
	public async Task<IActionResult> GetPendingInvitations(string userId)
	{
		var pendingInvitations = await _dbContext.ChallengeInvitations
			.Where(i => (i.InviteeId == userId || i.InviterId == userId) && !i.IsAccepted)
			.Select(i => new
			{
				i.Id,
				InviterId = i.InviterId,
				InviterName = i.Inviter.UserName,
				InviteeId = i.InviteeId,
				InviteeName = i.Invitee.UserName,
				i.SentAt,
				i.IsAccepted,
			})
			.ToListAsync();

		return Ok(pendingInvitations);
	}


	[HttpGet("{userId}")]
	public async Task<ActionResult<List<ChallengeProgressDto>>> GetUserChallenges(string userId)
	{
		try
		{
			
			var challenges = await _dbContext.Challenges
				.Where(c => c.InviterId == userId || c.InviteeId == userId)
				.Include(c => c.Inviter)
				.Include(c => c.Invitee)
				.ToListAsync();

			if (challenges == null || challenges.Count == 0)
				return NotFound("No challenges found for this user.");

			List<ChallengeProgressDto> challengeProgressList = new();

			foreach (var challenge in challenges)
			{
				
				DateTime challengeStartDate = challenge.StartDate;
				DateTime challengeEndDate = challenge.EndDate;

				
				double inviterDistance = await _dbContext.Runs
					.Where(r => r.UserId == challenge.InviterId && r.Date >= challengeStartDate && r.Date <= challengeEndDate)
					.SumAsync(r => r.Distance);

				double inviteeDistance = await _dbContext.Runs
					.Where(r => r.UserId == challenge.InviteeId && r.Date >= challengeStartDate && r.Date <= challengeEndDate)
					.SumAsync(r => r.Distance);

				double totalDistance = inviterDistance + inviteeDistance;
				double goalDistance = ExtractDistanceFromChallengeType(challenge.ChallengeType);

			
				if (totalDistance >= goalDistance)
				{
					challenge.Status = "Completed";
				}
				else if (challengeEndDate < DateTime.UtcNow)
				{
					challenge.Status = "Failed";
				}

				
				_dbContext.Challenges.Update(challenge);
				await _dbContext.SaveChangesAsync();

				
				challengeProgressList.Add(new ChallengeProgressDto
				{
					ChallengeId = challenge.Id,
					InviterName = challenge.Inviter.UserName,
					InviteeName = challenge.Invitee.UserName,
					InviterDistance = inviterDistance,
					InviteeDistance = inviteeDistance,
					TotalDistance = totalDistance,
					GoalDistance = goalDistance,
					Progress = goalDistance > 0 ? (totalDistance / goalDistance) * 100 : 0,
					Status = challenge.Status,
					ChallengeType = challenge.ChallengeType,
				});
			}

			
			return Ok(challengeProgressList);
		}
		catch (Exception ex)
		{
			
			return StatusCode(500, $"Internal Server Error: {ex.Message}");
		}
	}

	private double ExtractDistanceFromChallengeType(string challengeType)
	{
		return challengeType switch
		{
			"Run 5 km together" => 5000,
			"Run 10 km together" => 10000,
			"Run 15 km together" => 15000,
			"Run 8 km together" => 8000,
			_ => 0
		};

	}
}



	
	

